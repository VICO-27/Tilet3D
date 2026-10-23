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

from apps.accounts.models import User, SecurityAuditLog, SystemConfiguration
from apps.accounts.utils import log_security_event
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
        # 1. Product & Catalog metrics (single query)
        prod_agg = Product.objects.aggregate(
            total=Count("id"),
            active=Count("id", filter=Q(is_active=True)),
        )
        total_products = prod_agg["total"]
        active_products = prod_agg["active"]

        # 2. Inventory metrics (single query)
        variant_agg = ProductVariant.objects.aggregate(
            low_stock=Count("id", filter=Q(stock__lte=5, is_active=True)),
            out_of_stock=Count("id", filter=Q(stock=0, is_active=True)),
        )
        low_stock_variants = variant_agg["low_stock"]
        out_of_stock_variants = variant_agg["out_of_stock"]

        # 3. Order & Revenue metrics (single consolidated query instead of 9 queries)
        order_agg = Order.objects.aggregate(
            all_orders=Count("id"),
            pending=Count("id", filter=Q(status=OrderStatus.PENDING)),
            confirmed=Count("id", filter=Q(status=OrderStatus.CONFIRMED)),
            processing=Count("id", filter=Q(status=OrderStatus.PROCESSING)),
            shipped=Count("id", filter=Q(status=OrderStatus.SHIPPED)),
            delivered=Count("id", filter=Q(status=OrderStatus.DELIVERED)),
            cancelled=Count("id", filter=Q(status=OrderStatus.CANCELLED)),
            paid=Count("id", filter=Q(payment_status=PaymentStatus.PAID)),
            revenue=Sum("total", filter=Q(payment_status=PaymentStatus.PAID)),
        )

        total_orders = order_agg["all_orders"]
        pending_orders = order_agg["pending"]
        confirmed_orders = order_agg["confirmed"]
        processing_orders = order_agg["processing"]
        shipped_orders = order_agg["shipped"]
        delivered_orders = order_agg["delivered"]
        cancelled_orders = order_agg["cancelled"]
        paid_orders = order_agg["paid"]
        raw_revenue = order_agg["revenue"]
        total_revenue = f"{Decimal(str(raw_revenue)):.2f}" if raw_revenue is not None else "0.00"

        # 4. Customer metrics (non-staff registered users)
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
        # 1 & 2. Consolidated Order and Revenue analytics (single query instead of 8 queries)
        order_agg = Order.objects.aggregate(
            all_orders=Count("id"),
            paid_count=Count("id", filter=Q(payment_status=PaymentStatus.PAID)),
            total_rev=Sum("total", filter=Q(payment_status=PaymentStatus.PAID)),
            pending=Count("id", filter=Q(status=OrderStatus.PENDING)),
            confirmed=Count("id", filter=Q(status=OrderStatus.CONFIRMED)),
            processing=Count("id", filter=Q(status=OrderStatus.PROCESSING)),
            shipped=Count("id", filter=Q(status=OrderStatus.SHIPPED)),
            delivered=Count("id", filter=Q(status=OrderStatus.DELIVERED)),
            cancelled=Count("id", filter=Q(status=OrderStatus.CANCELLED)),
        )

        paid_count = order_agg["paid_count"]
        rev_agg = order_agg["total_rev"]
        total_revenue = Decimal(str(rev_agg)) if rev_agg is not None else Decimal("0.00")
        avg_order_value = (total_revenue / paid_count) if paid_count > 0 else Decimal("0.00")

        status_counts = {
            OrderStatus.PENDING: order_agg["pending"],
            OrderStatus.CONFIRMED: order_agg["confirmed"],
            OrderStatus.PROCESSING: order_agg["processing"],
            OrderStatus.SHIPPED: order_agg["shipped"],
            OrderStatus.DELIVERED: order_agg["delivered"],
            OrderStatus.CANCELLED: order_agg["cancelled"],
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
    Staff-only telemetry and operational policy management.
    Allows administrators to view telemetry and dynamically toggle security policies (e.g. OTP verification).
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        config = SystemConfiguration.get_solo()
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
                "security_policy": {
                    "otp_verification_enabled": config.otp_verification_enabled,
                    "updated_at": config.updated_at.isoformat() if config.updated_at else None,
                },
                "server_time": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        config = SystemConfiguration.get_solo()
        if "otp_verification_enabled" in request.data:
            val = request.data["otp_verification_enabled"]
            if isinstance(val, str):
                val = val.lower() in ("true", "1", "yes")
            config.otp_verification_enabled = bool(val)
            config.save()
            log_security_event(
                request,
                request.user,
                f"Admin updated OTP Verification policy to: {'Enabled' if config.otp_verification_enabled else 'Disabled'}"
            )
        return self.get(request)
