from decimal import Decimal
from rest_framework import serializers

from apps.rentals.models import (
    RentalProductConfig,
    RentalPackage,
    RentalBooking,
    RentalInspection,
    PricingMode,
    FulfillmentMethod,
    RentalBookingStatus,
    RentalPaymentStatus,
    DepositStatus,
    GarmentCondition,
)
from apps.products.models import Product, ProductVariant
from apps.rentals.services.pricing import RentalPricingService
from apps.rentals.services.inventory import RentalInventoryService


class RentalPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = RentalPackage
        fields = [
            'id',
            'name',
            'duration_days',
            'price',
            'is_active',
            'display_order',
        ]


class RentalProductConfigSerializer(serializers.ModelSerializer):
    packages = serializers.SerializerMethodField()

    class Meta:
        model = RentalProductConfig
        fields = [
            'id',
            'is_rental_enabled',
            'rental_inventory_count',
            'daily_rate',
            'security_deposit',
            'delivery_fee',
            'min_rental_days',
            'max_rental_days',
            'cleaning_buffer_days',
            'terms_and_conditions',
            'packages',
        ]

    def get_packages(self, obj):
        active_pkgs = obj.packages.filter(is_active=True).order_by('display_order', 'duration_days')
        return RentalPackageSerializer(active_pkgs, many=True).data


class RentalQuoteRequestSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    pricing_mode = serializers.ChoiceField(choices=PricingMode.choices)
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False, allow_null=True)
    package_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(default=1, min_value=1)
    fulfillment_method = serializers.ChoiceField(
        choices=FulfillmentMethod.choices,
        default=FulfillmentMethod.SHOP_PICKUP
    )


class RentalInspectionSerializer(serializers.ModelSerializer):
    inspected_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RentalInspection
        fields = [
            'id',
            'condition',
            'notes',
            'assessed_damage_fee',
            'deposit_action',
            'inspected_by',
            'inspected_by_name',
            'inspected_at',
        ]

    def get_inspected_by_name(self, obj):
        if obj.inspected_by:
            first = getattr(obj.inspected_by, 'first_name', '')
            last = getattr(obj.inspected_by, 'last_name', '')
            return f"{first} {last}".strip() or obj.inspected_by.email
        return None


class RentalBookingListSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = RentalBooking
        fields = [
            'id',
            'booking_reference',
            'product_name',
            'product_image',
            'variant_name',
            'start_date',
            'end_date',
            'duration_days',
            'quantity',
            'status',
            'payment_status',
            'deposit_status',
            'total_amount',
            'rental_subtotal',
            'deposit_amount',
            'delivery_fee',
            'fulfillment_method',
            'is_overdue',
            'created_at',
        ]

    def get_product_image(self, obj):
        primary = obj.product.media.filter(media_type='image').first()
        return str(primary.file.url) if primary and primary.file else None

    def get_variant_name(self, obj):
        if obj.variant:
            return obj.variant.size or obj.variant.color or obj.variant.name
        return None


class RentalBookingDetailSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()
    variant_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='user.email', read_only=True)
    inspection = RentalInspectionSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    duration_days = serializers.IntegerField(read_only=True)

    class Meta:
        model = RentalBooking
        fields = [
            'id',
            'booking_reference',
            'product',
            'product_name',
            'product_image',
            'variant',
            'variant_name',
            'user',
            'customer_name',
            'customer_email',
            'quantity',
            'start_date',
            'end_date',
            'duration_days',
            'pricing_mode',
            'daily_rate_snapshot',
            'rental_subtotal',
            'deposit_amount',
            'delivery_fee',
            'late_fee',
            'damage_fee',
            'total_amount',
            'status',
            'payment_status',
            'deposit_status',
            'deposit_refunded_amount',
            'fulfillment_method',
            'full_name',
            'phone',
            'address_line',
            'city',
            'special_instructions',
            'reservation_expires_at',
            'picked_up_at',
            'returned_at',
            'inspection',
            'is_overdue',
            'internal_notes',
            'created_at',
            'updated_at',
        ]

    def get_product_image(self, obj):
        primary = obj.product.media.filter(media_type='image').first()
        return str(primary.file.url) if primary and primary.file else None

    def get_variant_name(self, obj):
        if obj.variant:
            return obj.variant.size or obj.variant.color or obj.variant.name
        return None

    def get_customer_name(self, obj):
        first = getattr(obj.user, 'first_name', '')
        last = getattr(obj.user, 'last_name', '')
        return f"{first} {last}".strip() or obj.user.email


class RentalBookingCreateSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    pricing_mode = serializers.ChoiceField(choices=PricingMode.choices)
    start_date = serializers.DateField()
    end_date = serializers.DateField(required=False, allow_null=True)
    package_id = serializers.UUIDField(required=False, allow_null=True)
    quantity = serializers.IntegerField(default=1, min_value=1)
    fulfillment_method = serializers.ChoiceField(
        choices=FulfillmentMethod.choices,
        default=FulfillmentMethod.SHOP_PICKUP
    )
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=30)
    address_line = serializers.CharField(max_length=255, required=False, allow_blank=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    special_instructions = serializers.CharField(required=False, allow_blank=True)
