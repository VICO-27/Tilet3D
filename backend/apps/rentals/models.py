import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

from common.models import BaseModel


class PricingMode(models.TextChoices):
    PACKAGE = 'package', 'Fixed Package'
    FLEXIBLE_DAILY = 'flexible_daily', 'Flexible Date-Based'


class FulfillmentMethod(models.TextChoices):
    SHOP_PICKUP = 'shop_pickup', 'Shop Pickup & Return'
    DELIVERY = 'delivery', 'Delivery & Collection'


class RentalBookingStatus(models.TextChoices):
    PENDING_PAYMENT = 'pending_payment', 'Pending Payment'
    CONFIRMED = 'confirmed', 'Confirmed'
    READY_FOR_PICKUP = 'ready_for_pickup', 'Ready for Pickup / Dispatch'
    OUT_ON_RENTAL = 'out_on_rental', 'Out on Rental'
    RETURNED_PENDING_INSPECTION = 'returned_pending_inspection', 'Returned (Pending Inspection)'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'
    OVERDUE = 'overdue', 'Overdue'
    DAMAGE_REVIEW = 'damage_review', 'Damage Review'


class RentalPaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PAID = 'paid', 'Paid'
    FAILED = 'failed', 'Failed'
    REFUNDED = 'refunded', 'Refunded'


class DepositStatus(models.TextChoices):
    HELD = 'held', 'Held'
    RELEASED = 'released', 'Released / Refunded'
    PARTIALLY_REFUNDED = 'partially_refunded', 'Partially Refunded'
    FORFEITED = 'forfeited', 'Forfeited'
    WAIVED = 'waived', 'Waived'


class GarmentCondition(models.TextChoices):
    PRISTINE = 'pristine', 'Pristine / Excellent'
    MINOR_WEAR = 'minor_wear', 'Minor Wear (Acceptable)'
    REPAIRABLE_DAMAGE = 'repairable_damage', 'Repairable Damage'
    SEVERE_DAMAGE = 'severe_damage', 'Severe / Irreparable Damage'
    LOST = 'lost', 'Item Lost / Unreturned'


# ==========================================================
# RENTAL PRODUCT CONFIGURATION
# ==========================================================

class RentalProductConfig(BaseModel):
    """
    Rental configuration attached to a Product.
    Defines whether rental is permitted, pricing policies, deposits, and buffers.
    """
    product = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='rental_config',
        help_text="Product associated with this rental configuration."
    )

    is_rental_enabled = models.BooleanField(
        default=False,
        help_text="Controls if customer-facing rental is available."
    )

    rental_inventory_count = models.PositiveIntegerField(
        default=1,
        help_text="Total physical pieces in rental rotation."
    )

    daily_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Per calendar day rate in ETB for flexible bookings."
    )

    security_deposit = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Refundable deposit held against damage or non-return."
    )

    delivery_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('150.00'),
        help_text="Fee for 2-way delivery and return collection."
    )

    min_rental_days = models.PositiveIntegerField(
        default=1,
        help_text="Minimum allowed rental interval."
    )

    max_rental_days = models.PositiveIntegerField(
        default=30,
        help_text="Maximum allowed rental interval."
    )

    cleaning_buffer_days = models.PositiveIntegerField(
        default=1,
        help_text="Operational turnaround buffer for inspection and eco-dry-cleaning."
    )

    terms_and_conditions = models.TextField(
        blank=True,
        default=(
            "Traditional Ethiopian cultural garments require gentle care. "
            "Please avoid machine wash or direct flame. Security deposits are released upon successful inspection."
        ),
        help_text="Terms shown to customer at rental checkout."
    )

    class Meta:
        verbose_name = 'Rental Product Configuration'
        verbose_name_plural = 'Rental Product Configurations'

    def clean(self):
        if self.min_rental_days > self.max_rental_days:
            raise ValidationError("min_rental_days cannot exceed max_rental_days.")
        if self.is_rental_enabled and self.daily_rate <= 0 and not self.packages.filter(is_active=True).exists():
            # Warning or validation: must have valid daily rate or at least one package
            pass

    def __str__(self):
        status = "Active" if self.is_rental_enabled else "Disabled"
        return f"RentalConfig({self.product.name}) [{status}]"


# ==========================================================
# RENTAL PACKAGE (FIXED DURATION)
# ==========================================================

class RentalPackage(BaseModel):
    """
    Fixed-duration pricing bundle (e.g., 3-Day Wedding Special, 7-Day Holiday).
    """
    config = models.ForeignKey(
        RentalProductConfig,
        on_delete=models.CASCADE,
        related_name='packages'
    )

    name = models.CharField(max_length=120)
    duration_days = models.PositiveIntegerField(help_text="Duration in calendar days.")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Total price for this duration in ETB.")
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'duration_days']
        verbose_name = 'Rental Package'
        verbose_name_plural = 'Rental Packages'

    def __str__(self):
        return f"{self.name} ({self.duration_days} days - {self.price} ETB)"


# ==========================================================
# RENTAL BOOKING
# ==========================================================

class RentalBooking(BaseModel):
    """
    Core rental booking entity.
    Maintains a strict state machine, date-based availability hold, and frozen pricing snapshots.
    """
    booking_reference = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        help_text="Human-readable booking reference e.g. RNT-20261023-XXXX"
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='rental_bookings'
    )

    product = models.ForeignKey(
        'products.Product',
        on_delete=models.PROTECT,
        related_name='rental_bookings'
    )

    variant = models.ForeignKey(
        'products.ProductVariant',
        on_delete=models.PROTECT,
        related_name='rental_bookings',
        null=True,
        blank=True
    )

    quantity = models.PositiveIntegerField(default=1)

    start_date = models.DateField(help_text="Pickup or delivery date.")
    end_date = models.DateField(help_text="Return date.")

    pricing_mode = models.CharField(
        max_length=20,
        choices=PricingMode.choices,
        default=PricingMode.FLEXIBLE_DAILY
    )

    rental_package = models.ForeignKey(
        RentalPackage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='bookings'
    )

    # 🔒 Pricing snapshots (frozen at reservation creation)
    daily_rate_snapshot = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    rental_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    damage_fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))

    # Lifecycle state
    status = models.CharField(
        max_length=32,
        choices=RentalBookingStatus.choices,
        default=RentalBookingStatus.PENDING_PAYMENT,
        db_index=True
    )

    payment_status = models.CharField(
        max_length=20,
        choices=RentalPaymentStatus.choices,
        default=RentalPaymentStatus.PENDING,
        db_index=True
    )

    deposit_status = models.CharField(
        max_length=20,
        choices=DepositStatus.choices,
        default=DepositStatus.HELD
    )

    deposit_refunded_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    # Fulfillment
    fulfillment_method = models.CharField(
        max_length=20,
        choices=FulfillmentMethod.choices,
        default=FulfillmentMethod.SHOP_PICKUP
    )

    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30)
    address_line = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    special_instructions = models.TextField(blank=True)

    # Temporary hold expiry (e.g. 30 mins) before payment is verified
    reservation_expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Unpaid booking hold expiration timestamp."
    )

    picked_up_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)
    internal_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.booking_reference} ({self.product.name}) [{self.status}]"

    @property
    def duration_days(self):
        if self.start_date and self.end_date:
            days = (self.end_date - self.start_date).days
            return max(days, 1)
        return 0

    @property
    def is_hold_active(self):
        """Returns True if booking currently locks inventory."""
        if self.status in [
            RentalBookingStatus.CONFIRMED,
            RentalBookingStatus.READY_FOR_PICKUP,
            RentalBookingStatus.OUT_ON_RENTAL,
            RentalBookingStatus.RETURNED_PENDING_INSPECTION,
            RentalBookingStatus.OVERDUE,
            RentalBookingStatus.DAMAGE_REVIEW,
        ]:
            return True
        if self.status == RentalBookingStatus.PENDING_PAYMENT:
            return bool(self.reservation_expires_at and self.reservation_expires_at > timezone.now())
        return False

    @property
    def is_overdue(self):
        """Derived overdue flag if current date is past end_date and item is not yet returned."""
        if self.status in [RentalBookingStatus.OUT_ON_RENTAL, RentalBookingStatus.OVERDUE]:
            today = timezone.localdate()
            return today > self.end_date
        return self.status == RentalBookingStatus.OVERDUE


# ==========================================================
# RENTAL RETURN INSPECTION
# ==========================================================

class RentalInspection(BaseModel):
    """
    Staff return inspection log.
    Records garment condition, assesses damage fees, and resolves deposit disposition.
    """
    booking = models.OneToOneField(
        RentalBooking,
        on_delete=models.CASCADE,
        related_name='inspection'
    )

    condition = models.CharField(
        max_length=30,
        choices=GarmentCondition.choices,
        default=GarmentCondition.PRISTINE
    )

    notes = models.TextField(blank=True)
    assessed_damage_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00')
    )

    deposit_action = models.CharField(
        max_length=30,
        choices=[
            ('refund_full', 'Refund Full Deposit'),
            ('deduct_damage', 'Deduct Damage Fee & Refund Balance'),
            ('forfeit_all', 'Forfeit Entire Deposit'),
        ],
        default='refund_full'
    )

    inspected_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='rental_inspections'
    )

    inspected_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Inspection for {self.booking.booking_reference}: {self.condition}"
