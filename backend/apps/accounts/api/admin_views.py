import platform
from decimal import Decimal
from django.conf import settings
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework import generics, serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, SecurityAuditLog
from apps.orders.models import Order, OrderItem, OrderStatus, PaymentStatus
from apps.payments.models import Payment
from apps.products.models import Product, ProductVariant


class AdminPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


# ==========================================================
# 1. OVERVIEW TELEMETRY
# ==========================================================

class AdminOverviewView(APIView):
    """
    Staff-only endpoint returning aggregate operational metrics for the admin dashboard.
    Enforces server-side is_staff authorization and exposes zero customer PII.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # 1. Product & Catalog metrics
        total_products = Product.objects.count()
        active_products = Product.objects.filter(is_active=True).count()

        # 2. Inventory metrics
        low_stock_variants = ProductVariant.objects.filter(stock__lte=5, is_active=True).count()
        out_of_stock_variants = ProductVariant.objects.filter(stock=0, is_active=True).count()

        # 3. Order metrics
        total_orders = Order.objects.count()
        pending_orders = Order.objects.filter(status=OrderStatus.PENDING).count()
        confirmed_orders = Order.objects.filter(status=OrderStatus.CONFIRMED).count()
        processing_orders = Order.objects.filter(status=OrderStatus.PROCESSING).count()
        shipped_orders = Order.objects.filter(status=OrderStatus.SHIPPED).count()
        delivered_orders = Order.objects.filter(status=OrderStatus.DELIVERED).count()
        cancelled_orders = Order.objects.filter(status=OrderStatus.CANCELLED).count()

        # 4. Revenue & paid orders
        paid_orders_qs = Order.objects.filter(payment_status=PaymentStatus.PAID)
        paid_orders = paid_orders_qs.count()
        revenue_aggregate = paid_orders_qs.aggregate(total_revenue=Sum("total"))
        raw_revenue = revenue_aggregate["total_revenue"]
        total_revenue = f"{Decimal(str(raw_revenue)):.2f}" if raw_revenue is not None else "0.00"

        # 5. Customer metrics (non-staff registered users)
        total_customers = User.objects.filter(is_staff=False).count()

        return Response(
            {
                "metrics": {
                    "total_revenue": str(total_revenue),
                    "total_orders": total_orders,
                    "paid_orders": paid_orders,
                    "pending_orders": pending_orders,
                    "total_products": total_products,
                    "active_products": active_products,
                    "total_customers": total_customers,
                    "low_stock_variants": low_stock_variants,
                    "out_of_stock_variants": out_of_stock_variants,
                },
                "orders_by_status": {
                    "pending": pending_orders,
                    "confirmed": confirmed_orders,
                    "processing": processing_orders,
                    "shipped": shipped_orders,
                    "delivered": delivered_orders,
                    "cancelled": cancelled_orders,
                },
            },
            status=status.HTTP_200_OK,
        )


# ==========================================================
# 2. CUSTOMERS MANAGEMENT
# ==========================================================

class AdminCustomerListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "is_verified",
            "is_active",
            "created_at",
            "orders_count",
            "total_spent",
        ]

    def get_full_name(self, obj):
        if hasattr(obj, "profile") and obj.profile and obj.profile.full_name:
            return obj.profile.full_name
        return "Customer"

    def get_orders_count(self, obj):
        return getattr(obj, "_orders_count", obj.orders.count())

    def get_total_spent(self, obj):
        spent = getattr(obj, "_total_spent", None)
        if spent is not None:
            return f"{Decimal(str(spent)):.2f}"
        agg = obj.orders.filter(payment_status=PaymentStatus.PAID).aggregate(s=Sum("total"))["s"]
        return f"{Decimal(str(agg)):.2f}" if agg is not None else "0.00"


class AdminCustomerDetailSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    orders_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()
    addresses = serializers.SerializerMethodField()
    recent_orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "is_verified",
            "is_active",
            "created_at",
            "orders_count",
            "total_spent",
            "addresses",
            "recent_orders",
        ]

    def get_full_name(self, obj):
        if hasattr(obj, "profile") and obj.profile and obj.profile.full_name:
            return obj.profile.full_name
        return "Customer"

    def get_orders_count(self, obj):
        return obj.orders.count()

    def get_total_spent(self, obj):
        agg = obj.orders.filter(payment_status=PaymentStatus.PAID).aggregate(s=Sum("total"))["s"]
        return f"{Decimal(str(agg)):.2f}" if agg is not None else "0.00"

    def get_addresses(self, obj):
        return [
            {
                "id": str(a.id),
                "label": a.label,
                "full_name": a.full_name,
                "phone_number": a.phone_number,
                "region": a.region,
                "city": a.city,
                "sub_city": a.sub_city,
                "woreda": a.woreda,
                "house_no": a.house_no,
                "is_default": a.is_default,
            }
            for a in obj.addresses.all()
        ]

    def get_recent_orders(self, obj):
        return [
            {
                "id": str(o.id),
                "order_number": o.order_number,
                "status": o.status,
                "payment_status": o.payment_status,
                "total": str(o.total),
                "created_at": o.created_at,
            }
            for o in obj.orders.order_by("-created_at")[:5]
        ]


class AdminCustomerListView(generics.ListAPIView):
    """
    Staff-only customer directory. Returns non-staff registered users with order aggregates.
    Excludes sensitive authentication hashes or tokens.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminCustomerListSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = (
            User.objects.filter(is_staff=False)
            .select_related("profile")
            .annotate(
                _orders_count=Count("orders", distinct=True),
                _total_spent=Sum("orders__total", filter=Q(orders__payment_status=PaymentStatus.PAID)),
            )
            .order_by("-created_at")
        )
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(email__icontains=search)
                | Q(profile__full_name__icontains=search)
            )
        return qs


class AdminCustomerDetailView(generics.RetrieveAPIView):
    """
    Staff-only endpoint to view customer order history and shipping addresses.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminCustomerDetailSerializer
    lookup_field = "id"

    def get_queryset(self):
        return User.objects.filter(is_staff=False).select_related("profile").prefetch_related("addresses", "orders")


# ==========================================================
# 3. READ-ONLY PAYMENTS LOG
# ==========================================================

class AdminPaymentListSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "order_id",
            "order_number",
            "user_email",
            "amount",
            "currency",
            "provider",
            "status",
            "transaction_id",
            "created_at",
            "updated_at",
        ]


class AdminPaymentListView(generics.ListAPIView):
    """
    Staff-only read-only payment log backed by Payment records.
    Allows auditing gateway verification and transactions without manual edit capability.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminPaymentListSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = Payment.objects.select_related("order", "user").order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(order__order_number__icontains=search)
                | Q(user__email__icontains=search)
                | Q(transaction_id__icontains=search)
            )
        status_filter = self.request.query_params.get("status", "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


# ==========================================================
# 4. STORE ANALYTICS
# ==========================================================

class AdminAnalyticsView(APIView):
    """
    Staff-only aggregated store analytics calculated on demand via database queries.
    Provides verified metrics for orders, revenue, top products, and inventory.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # 1. Revenue & Order values
        paid_orders = Order.objects.filter(payment_status=PaymentStatus.PAID)
        paid_count = paid_orders.count()
        rev_agg = paid_orders.aggregate(total_rev=Sum("total"))["total_rev"]
        total_revenue = Decimal(str(rev_agg)) if rev_agg is not None else Decimal("0.00")
        avg_order_value = (total_revenue / paid_count) if paid_count > 0 else Decimal("0.00")

        # 2. Orders by Status
        status_counts = {
            s: Order.objects.filter(status=s).count()
            for s in [
                OrderStatus.PENDING,
                OrderStatus.CONFIRMED,
                OrderStatus.PROCESSING,
                OrderStatus.SHIPPED,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
            ]
        }

        # 3. Top Performing Products
        top_items = (
            OrderItem.objects.filter(order__payment_status=PaymentStatus.PAID)
            .values("product_name")
            .annotate(
                units_sold=Sum("quantity"),
                revenue=Sum("subtotal"),
            )
            .order_by("-units_sold")[:5]
        )

        top_products = [
            {
                "product_name": item["product_name"],
                "units_sold": item["units_sold"],
                "revenue": str(item["revenue"]),
            }
            for item in top_items
        ]

        # 4. Inventory Health
        total_variants = ProductVariant.objects.count()
        in_stock_count = ProductVariant.objects.filter(stock__gt=5, is_active=True).count()
        low_stock_count = ProductVariant.objects.filter(stock__gt=0, stock__lte=5, is_active=True).count()
        out_of_stock_count = ProductVariant.objects.filter(stock=0, is_active=True).count()

        return Response(
            {
                "financials": {
                    "total_revenue": f"{total_revenue:.2f}",
                    "average_order_value": f"{avg_order_value:.2f}",
                    "currency": "ETB",
                    "paid_orders_count": paid_count,
                },
                "orders_by_status": status_counts,
                "top_products": top_products,
                "inventory_health": {
                    "total_variants": total_variants,
                    "in_stock": in_stock_count,
                    "low_stock": low_stock_count,
                    "out_of_stock": out_of_stock_count,
                },
            },
            status=status.HTTP_200_OK,
        )


# ==========================================================
# 5. SECURITY AUDIT LOGS
# ==========================================================

class AdminAuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = SecurityAuditLog
        fields = [
            "id",
            "user_email",
            "event",
            "ip_address",
            "user_agent",
            "created_at",
        ]


class AdminAuditLogListView(generics.ListAPIView):
    """
    Staff-only read-only view of user security events (logins, password updates, etc.).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminAuditLogSerializer
    pagination_class = AdminPagination

    def get_queryset(self):
        qs = SecurityAuditLog.objects.select_related("user").order_by("-created_at")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(user__email__icontains=search)
                | Q(event__icontains=search)
                | Q(ip_address__icontains=search)
            )
        return qs


# ==========================================================
# 6. SYSTEM SETTINGS & TELEMETRY
# ==========================================================

class AdminSettingsView(APIView):
    """
    Staff-only read-only telemetry revealing system state without exposing secrets.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        db_engine = settings.DATABASES.get("default", {}).get("ENGINE", "").split(".")[-1]
        media_storage = (
            "Cloudinary"
            if "cloudinary" in getattr(settings, "DEFAULT_FILE_STORAGE", "").lower()
            else "Local / S3"
        )
        email_host = getattr(settings, "EMAIL_HOST", "")
        email_status = "Brevo SMTP" if "brevo" in email_host.lower() else ("Console" if settings.DEBUG else "Configured SMTP")

        return Response(
            {
                "platform": {
                    "app_name": "Tilet3D Ethiopian Luxury Fashion",
                    "version": "1.0.0-production",
                    "environment": "Development" if settings.DEBUG else "Production",
                    "debug_mode": settings.DEBUG,
                    "python_version": platform.python_version(),
                },
                "integrations": {
                    "database": f"PostgreSQL ({db_engine})" if "postgres" in db_engine else db_engine,
                    "media_storage": media_storage,
                    "payment_gateway": "Chapa (ETB)",
                    "email_delivery": email_status,
                    "auth_system": "JWT & Google Identity Services",
                    "fitting_room": "WebGL Three.js 3D Avatar",
                },
                "operational_policy": {
                    "token_refresh_rotation": "Enabled",
                    "currency": "ETB",
                    "admin_role_enforcement": "Server-side IsAdminUser",
                    "payment_status_mutation": "Prohibited (Webhook/Chapa Verified Only)",
                },
                "server_time": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
