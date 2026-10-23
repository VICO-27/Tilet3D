import logging
from decimal import Decimal
from django.db.models import Q, Sum, Count
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.pagination import PageNumberPagination

from apps.products.models import Product, ProductVariant
from apps.rentals.models import (
    RentalProductConfig,
    RentalPackage,
    RentalBooking,
    RentalBookingStatus,
    RentalPaymentStatus,
    DepositStatus,
)
from apps.rentals.services.pricing import RentalPricingService
from apps.rentals.services.inventory import RentalInventoryService
from apps.rentals.services.booking import RentalBookingService
from apps.payments.services import PaymentService
from apps.payments.gateway_factory import GatewayFactory
from .serializers import (
    RentalProductConfigSerializer,
    RentalQuoteRequestSerializer,
    RentalBookingCreateSerializer,
    RentalBookingListSerializer,
    RentalBookingDetailSerializer,
    RentalPackageSerializer,
)

logger = logging.getLogger(__name__)


class StandardRentalPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100


# ==========================================================
# CUSTOMER / PUBLIC VIEWS
# ==========================================================

class ProductRentalDetailView(APIView):
    """
    Returns public rental configuration and options for a product.
    """
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        try:
            config = RentalProductConfig.objects.select_related('product').get(product_id=product_id)
            serializer = RentalProductConfigSerializer(config)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RentalProductConfig.DoesNotExist:
            return Response(
                {
                    "is_rental_enabled": False,
                    "rental_inventory_count": 0,
                    "daily_rate": "0.00",
                    "security_deposit": "0.00",
                    "packages": [],
                },
                status=status.HTTP_200_OK
            )


class RentalAvailabilityCheckView(APIView):
    """
    Real-time availability checker for date ranges.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        product_id = request.query_params.get('product_id')
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        variant_id = request.query_params.get('variant_id')
        quantity = int(request.query_params.get('quantity', 1))

        if not product_id or not start_date_str or not end_date_str:
            return Response(
                {"error": "product_id, start_date, and end_date are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
            import datetime
            start_date = datetime.date.fromisoformat(start_date_str)
            end_date = datetime.date.fromisoformat(end_date_str)
        except Exception as e:
            return Response({"error": f"Invalid parameter: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        variant = None
        if variant_id:
            variant = ProductVariant.objects.filter(id=variant_id, product=product).first()

        is_avail, count, msg = RentalInventoryService.check_availability(
            product=product,
            start_date=start_date,
            end_date=end_date,
            variant=variant,
            requested_quantity=quantity,
        )

        return Response({
            "is_available": is_avail,
            "available_count": count,
            "message": msg,
        }, status=status.HTTP_200_OK)


class RentalQuoteView(APIView):
    """
    Generates a server-validated pricing quote.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RentalQuoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            product = Product.objects.get(id=data['product_id'])
            config = product.rental_config
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)
        except RentalProductConfig.DoesNotExist:
            return Response({"error": "Rentals are not configured for this product."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quote = RentalPricingService.quote(
                rental_config=config,
                pricing_mode=data['pricing_mode'],
                start_date=data['start_date'],
                end_date=data.get('end_date'),
                package_id=str(data.get('package_id')) if data.get('package_id') else None,
                quantity=data.get('quantity', 1),
                fulfillment_method=data.get('fulfillment_method', 'shop_pickup'),
            )
            return Response(quote, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RentalBookingCreateView(APIView):
    """
    Atomically creates a rental reservation with inventory hold and initiates Chapa checkout.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RentalBookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            product = Product.objects.get(id=data['product_id'])
        except Product.DoesNotExist:
            return Response({"error": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        variant = None
        if data.get('variant_id'):
            variant = ProductVariant.objects.filter(id=data['variant_id'], product=product).first()

        try:
            booking = RentalBookingService.create_booking(
                user=request.user,
                product=product,
                variant=variant,
                start_date=data['start_date'],
                end_date=data.get('end_date'),
                pricing_mode=data['pricing_mode'],
                package_id=str(data.get('package_id')) if data.get('package_id') else None,
                quantity=data.get('quantity', 1),
                fulfillment_method=data.get('fulfillment_method', 'shop_pickup'),
                full_name=data.get('full_name', ''),
                phone=data.get('phone', ''),
                address_line=data.get('address_line', ''),
                city=data.get('city', ''),
                special_instructions=data.get('special_instructions', ''),
            )
        except Exception as e:
            logger.error(f"Rental booking creation error: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Create Payment Record and initialize Chapa gateway
        try:
            payment = PaymentService.create_rental_payment(
                rental_booking=booking,
                user=request.user,
                provider="chapa",
            )

            gateway = GatewayFactory.get_gateway("chapa")
            gateway_response = gateway.create_payment(payment)

            payment.checkout_url = gateway_response["checkout_url"]
            payment.transaction_id = gateway_response["transaction_id"]
            payment.save(update_fields=["checkout_url", "transaction_id"])

            return Response({
                "booking_id": str(booking.id),
                "booking_reference": booking.booking_reference,
                "total_amount": str(booking.total_amount),
                "payment_id": str(payment.id),
                "checkout_url": payment.checkout_url,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Payment initiation error for booking {booking.booking_reference}: {str(e)}")
            return Response({
                "booking_id": str(booking.id),
                "booking_reference": booking.booking_reference,
                "error": "Booking created, but payment initiation encountered an issue. Please try checking out from your account.",
            }, status=status.HTTP_201_CREATED)


class CustomerRentalListView(APIView):
    """
    Returns authenticated customer's own rental bookings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = (
            RentalBooking.objects
            .filter(user=request.user)
            .select_related('product', 'variant')
            .prefetch_related('product__media')
            .order_by('-created_at')
        )
        paginator = StandardRentalPagination()
        page = paginator.paginate_queryset(bookings, request)
        serializer = RentalBookingListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class CustomerRentalDetailView(APIView):
    """
    Returns single rental booking details enforcing ownership.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = (
                RentalBooking.objects
                .select_related('product', 'variant', 'user', 'rental_package')
                .prefetch_related('product__media')
                .get(id=booking_id, user=request.user)
            )
            serializer = RentalBookingDetailSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RentalBooking.DoesNotExist:
            return Response({"error": "Rental booking not found."}, status=status.HTTP_404_NOT_FOUND)


# ==========================================================
# ADMIN DASHBOARD VIEWS (Staff/Superuser Only)
# ==========================================================

class AdminRentalMetricsView(APIView):
    """
    Computes verified admin metrics for rental operations.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = timezone.localdate()
        total_rentals = RentalBooking.objects.count()

        active_rentals = RentalBooking.objects.filter(
            status__in=[RentalBookingStatus.OUT_ON_RENTAL, RentalBookingStatus.READY_FOR_PICKUP]
        ).count()

        overdue_count = RentalBooking.objects.filter(
            Q(status=RentalBookingStatus.OVERDUE) |
            (Q(status=RentalBookingStatus.OUT_ON_RENTAL) & Q(end_date__lt=today))
        ).count()

        pending_inspection = RentalBooking.objects.filter(
            status=RentalBookingStatus.RETURNED_PENDING_INSPECTION
        ).count()

        deposits_held_total = RentalBooking.objects.filter(
            deposit_status=DepositStatus.HELD,
            payment_status=RentalPaymentStatus.PAID,
        ).aggregate(total=Sum('deposit_amount'))['total'] or Decimal('0.00')

        # Realized rental revenue: sum of rental_subtotal for PAID bookings
        rental_revenue = RentalBooking.objects.filter(
            payment_status=RentalPaymentStatus.PAID
        ).aggregate(total=Sum('rental_subtotal'))['total'] or Decimal('0.00')

        return Response({
            "total_rentals": total_rentals,
            "active_rentals": active_rentals,
            "overdue_count": overdue_count,
            "pending_inspection": pending_inspection,
            "deposits_held_etb": str(deposits_held_total),
            "rental_revenue_etb": str(rental_revenue),
        }, status=status.HTTP_200_OK)


class AdminRentalBookingListView(APIView):
    """
    Searchable, filterable list of all rental reservations for admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        queryset = (
            RentalBooking.objects
            .select_related('product', 'variant', 'user')
            .prefetch_related('product__media')
            .order_by('-created_at')
        )

        # Filters
        status_filter = request.query_params.get('status')
        if status_filter:
            if status_filter == 'overdue':
                today = timezone.localdate()
                queryset = queryset.filter(
                    Q(status=RentalBookingStatus.OVERDUE) |
                    (Q(status=RentalBookingStatus.OUT_ON_RENTAL) & Q(end_date__lt=today))
                )
            else:
                queryset = queryset.filter(status=status_filter)

        payment_status = request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)

        deposit_status = request.query_params.get('deposit_status')
        if deposit_status:
            queryset = queryset.filter(deposit_status=deposit_status)

        fulfillment = request.query_params.get('fulfillment_method')
        if fulfillment:
            queryset = queryset.filter(fulfillment_method=fulfillment)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(booking_reference__icontains=search) |
                Q(product__name__icontains=search) |
                Q(full_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(user__email__icontains=search)
            )

        paginator = StandardRentalPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = RentalBookingDetailSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminRentalBookingDetailView(APIView):
    """
    Admin detail view for a specific rental booking.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, booking_id):
        try:
            booking = (
                RentalBooking.objects
                .select_related('product', 'variant', 'user', 'rental_package')
                .prefetch_related('product__media')
                .get(id=booking_id)
            )
            serializer = RentalBookingDetailSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except RentalBooking.DoesNotExist:
            return Response({"error": "Rental booking not found."}, status=status.HTTP_404_NOT_FOUND)


class AdminRentalBookingActionView(APIView):
    """
    Performs verified administrative status transitions.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, booking_id):
        action = request.data.get('action')
        try:
            booking = RentalBooking.objects.get(id=booking_id)
        except RentalBooking.DoesNotExist:
            return Response({"error": "Rental booking not found."}, status=status.HTTP_404_NOT_FOUND)

        try:
            if action == 'ready_for_pickup':
                booking = RentalBookingService.mark_ready_for_pickup(booking)
            elif action == 'handover':
                booking = RentalBookingService.mark_out_on_rental(booking)
            elif action == 'record_return':
                booking = RentalBookingService.record_return(booking)
            elif action == 'cancel':
                booking = RentalBookingService.cancel_booking(booking, cancelled_by=request.user)
            else:
                return Response({"error": f"Unknown action '{action}'."}, status=status.HTTP_400_BAD_REQUEST)

            serializer = RentalBookingDetailSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminRentalInspectionView(APIView):
    """
    Admin records garment inspection and deposit disposition.
    """
    permission_classes = [IsAdminUser]

    def post(self, request, booking_id):
        try:
            booking = RentalBooking.objects.get(id=booking_id)
        except RentalBooking.DoesNotExist:
            return Response({"error": "Rental booking not found."}, status=status.HTTP_404_NOT_FOUND)

        condition = request.data.get('condition', 'pristine')
        notes = request.data.get('notes', '')
        raw_damage = request.data.get('assessed_damage_fee')
        if raw_damage is None:
            raw_damage = request.data.get('damage_fee', '0.00')
        damage_fee = Decimal(str(raw_damage or '0.00'))
        deposit_action = request.data.get('deposit_action', 'refund_full')

        try:
            inspection = RentalBookingService.record_inspection(
                booking=booking,
                condition=condition,
                notes=notes,
                assessed_damage_fee=damage_fee,
                deposit_action=deposit_action,
                inspected_by=request.user,
            )
            booking.refresh_from_db()
            serializer = RentalBookingDetailSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminRentalProductConfigView(APIView):
    """
    Configures rental settings, pricing, and packages for a product.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, product_id):
        config, _ = RentalProductConfig.objects.get_or_create(product_id=product_id)
        serializer = RentalProductConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, product_id):
        config, _ = RentalProductConfig.objects.get_or_create(product_id=product_id)

        config.is_rental_enabled = request.data.get('is_rental_enabled', config.is_rental_enabled)
        config.rental_inventory_count = int(request.data.get('rental_inventory_count', config.rental_inventory_count))
        config.daily_rate = Decimal(str(request.data.get('daily_rate', config.daily_rate)))
        config.security_deposit = Decimal(str(request.data.get('security_deposit', config.security_deposit)))
        config.delivery_fee = Decimal(str(request.data.get('delivery_fee', config.delivery_fee)))
        config.min_rental_days = int(request.data.get('min_rental_days', config.min_rental_days))
        config.max_rental_days = int(request.data.get('max_rental_days', config.max_rental_days))
        config.cleaning_buffer_days = int(request.data.get('cleaning_buffer_days', config.cleaning_buffer_days))
        config.terms_and_conditions = request.data.get('terms_and_conditions', config.terms_and_conditions)
        config.save()

        # Handle packages if provided
        packages_data = request.data.get('packages')
        if isinstance(packages_data, list):
            # Update or create packages
            for pkg in packages_data:
                pkg_id = pkg.get('id')
                name = pkg.get('name', 'Package')
                duration = int(pkg.get('duration_days', 3))
                price = Decimal(str(pkg.get('price', '0.00')))
                is_active = pkg.get('is_active', True)

                if pkg_id:
                    RentalPackage.objects.filter(id=pkg_id, config=config).update(
                        name=name,
                        duration_days=duration,
                        price=price,
                        is_active=is_active,
                    )
                else:
                    RentalPackage.objects.create(
                        config=config,
                        name=name,
                        duration_days=duration,
                        price=price,
                        is_active=is_active,
                    )

        serializer = RentalProductConfigSerializer(config)
        return Response(serializer.data, status=status.HTTP_200_OK)
