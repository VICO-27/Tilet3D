import datetime
from decimal import Decimal
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.utils import timezone
from rest_framework.test import APIClient

from apps.payments.models import Payment, PaymentStatus
from apps.products.models import Category, Product, ProductVariant
from apps.rentals.models import (
    RentalProductConfig,
    RentalPackage,
    RentalBooking,
    RentalBookingStatus,
    RentalPaymentStatus,
    DepositStatus,
    GarmentCondition,
)
from apps.rentals.services.pricing import RentalPricingService
from apps.rentals.services.inventory import RentalInventoryService
from apps.rentals.services.booking import RentalBookingService

User = get_user_model()


@pytest.fixture
def test_user(db):
    return User.objects.create_user(
        email="customer@example.com",
        password="TestPassword123!",
    )


@pytest.fixture
def other_user(db):
    return User.objects.create_user(
        email="other@example.com",
        password="TestPassword123!",
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        email="staff@example.com",
        password="StaffPassword123!",
        is_staff=True,
    )


@pytest.fixture
def sample_product(db):
    cat = Category.objects.create(name="Traditional Kemis", slug="traditional-kemis")
    product = Product.objects.create(
        category=cat,
        name="Royal Gondar Kemis",
        slug="royal-gondar-kemis",
        brand="Tilet Atelier",
    )
    ProductVariant.objects.create(
        product=product,
        name="Standard M",
        sku="RNT-GON-M",
        size="M",
        price=Decimal('15000.00'),
        stock=5,
    )
    return product


@pytest.fixture
def rental_config(sample_product):
    config = RentalProductConfig.objects.create(
        product=sample_product,
        is_rental_enabled=True,
        rental_inventory_count=2,  # 2 rentable pieces in atelier rotation
        daily_rate=Decimal('800.00'),
        security_deposit=Decimal('1500.00'),
        delivery_fee=Decimal('200.00'),
        min_rental_days=2,
        max_rental_days=14,
        cleaning_buffer_days=1,
    )
    RentalPackage.objects.create(
        config=config,
        name="3-Day Weekend Celebration",
        duration_days=3,
        price=Decimal('2100.00'),  # Discounted bundle price
        is_active=True,
    )
    RentalPackage.objects.create(
        config=config,
        name="7-Day Holiday Special",
        duration_days=7,
        price=Decimal('4500.00'),
        is_active=True,
    )
    return config


@pytest.mark.django_db
class TestRentalPricingEngine:

    def test_flexible_date_quote(self, rental_config):
        today = timezone.localdate()
        start = today + datetime.timedelta(days=2)
        end = today + datetime.timedelta(days=5)  # 3 calendar days

        quote = RentalPricingService.quote(
            rental_config=rental_config,
            pricing_mode='flexible_daily',
            start_date=start,
            end_date=end,
            quantity=1,
            fulfillment_method='shop_pickup',
        )

        assert quote['duration_days'] == 3
        assert quote['rental_subtotal'] == Decimal('2400.00')  # 3 * 800
        assert quote['deposit_amount'] == Decimal('1500.00')
        assert quote['delivery_fee'] == Decimal('0.00')
        assert quote['total_amount'] == Decimal('3900.00')

    def test_package_quote(self, rental_config):
        today = timezone.localdate()
        start = today + datetime.timedelta(days=3)
        package = rental_config.packages.first()

        quote = RentalPricingService.quote(
            rental_config=rental_config,
            pricing_mode='package',
            start_date=start,
            package_id=str(package.id),
            quantity=1,
            fulfillment_method='delivery',
        )

        assert quote['duration_days'] == 3
        assert quote['rental_subtotal'] == Decimal('2100.00')
        assert quote['deposit_amount'] == Decimal('1500.00')
        assert quote['delivery_fee'] == Decimal('200.00')
        assert quote['total_amount'] == Decimal('3800.00')

    def test_minimum_duration_enforced(self, rental_config):
        today = timezone.localdate()
        start = today + datetime.timedelta(days=1)
        end = today + datetime.timedelta(days=1)  # 0 or 1 day, while min is 2

        with pytest.raises(ValidationError) as exc:
            RentalPricingService.quote(
                rental_config=rental_config,
                pricing_mode='flexible_daily',
                start_date=start,
                end_date=end,
            )
        assert "Minimum rental period" in str(exc.value)

    def test_past_date_rejected(self, rental_config):
        yesterday = timezone.localdate() - datetime.timedelta(days=1)
        today = timezone.localdate()

        with pytest.raises(ValidationError) as exc:
            RentalPricingService.quote(
                rental_config=rental_config,
                pricing_mode='flexible_daily',
                start_date=yesterday,
                end_date=today,
            )
        assert "past" in str(exc.value)


@pytest.mark.django_db
class TestRentalInventoryConcurrency:

    def test_prevent_double_booking_beyond_capacity(self, test_user, other_user, rental_config):
        product = rental_config.product
        today = timezone.localdate()
        start = today + datetime.timedelta(days=5)
        end = today + datetime.timedelta(days=8)

        # Capacity is 2 garments
        b1 = RentalBookingService.create_booking(
            user=test_user,
            product=product,
            start_date=start,
            end_date=end,
            pricing_mode='flexible_daily',
            quantity=1,
        )
        b2 = RentalBookingService.create_booking(
            user=other_user,
            product=product,
            start_date=start,
            end_date=end,
            pricing_mode='flexible_daily',
            quantity=1,
        )

        assert b1.status == RentalBookingStatus.PENDING_PAYMENT
        assert b2.status == RentalBookingStatus.PENDING_PAYMENT

        # 3rd booking for overlapping dates must fail
        with pytest.raises(ValidationError) as exc:
            RentalBookingService.create_booking(
                user=test_user,
                product=product,
                start_date=start,
                end_date=end,
                pricing_mode='flexible_daily',
                quantity=1,
            )
        assert "available" in str(exc.value).lower()

    def test_cleaning_buffer_blocks_immediate_next_day(self, test_user, other_user, rental_config):
        product = rental_config.product
        today = timezone.localdate()
        start1 = today + datetime.timedelta(days=5)
        end1 = today + datetime.timedelta(days=8)

        # Book all 2 garments
        RentalBookingService.create_booking(
            user=test_user,
            product=product,
            start_date=start1,
            end_date=end1,
            pricing_mode='flexible_daily',
            quantity=2,
        )

        # Attempt to book on day 9 (end1 is day 8, but cleaning_buffer_days=1 blocks day 9)
        start2 = today + datetime.timedelta(days=9)
        end2 = today + datetime.timedelta(days=12)

        with pytest.raises(ValidationError) as exc:
            RentalBookingService.create_booking(
                user=other_user,
                product=product,
                start_date=start2,
                end_date=end2,
                pricing_mode='flexible_daily',
                quantity=1,
            )
        assert "available" in str(exc.value).lower()

    def test_expired_hold_releases_inventory(self, test_user, other_user, rental_config):
        product = rental_config.product
        today = timezone.localdate()
        start = today + datetime.timedelta(days=5)
        end = today + datetime.timedelta(days=8)

        b1 = RentalBookingService.create_booking(
            user=test_user,
            product=product,
            start_date=start,
            end_date=end,
            pricing_mode='flexible_daily',
            quantity=2,
        )

        # Manually backdate reservation_expires_at to simulate expiry
        b1.reservation_expires_at = timezone.now() - datetime.timedelta(minutes=5)
        b1.save()

        # Run expiration cleanup
        RentalBookingService.expire_stale_holds()

        # Now other user can book!
        b2 = RentalBookingService.create_booking(
            user=other_user,
            product=product,
            start_date=start,
            end_date=end,
            pricing_mode='flexible_daily',
            quantity=1,
        )
        assert b2.booking_reference is not None


@pytest.mark.django_db
class TestRentalLifecycleAndPermissions:

    def test_customer_cannot_view_other_customer_booking(self, test_user, other_user, rental_config):
        today = timezone.localdate()
        booking = RentalBookingService.create_booking(
            user=test_user,
            product=rental_config.product,
            start_date=today + datetime.timedelta(days=3),
            end_date=today + datetime.timedelta(days=6),
            pricing_mode='flexible_daily',
        )

        client = APIClient()
        client.force_authenticate(user=other_user)

        response = client.get(f"/api/rentals/my-rentals/{booking.id}/")
        assert response.status_code == 404

    def test_admin_operational_lifecycle(self, test_user, staff_user, rental_config):
        today = timezone.localdate()
        booking = RentalBookingService.create_booking(
            user=test_user,
            product=rental_config.product,
            start_date=today + datetime.timedelta(days=3),
            end_date=today + datetime.timedelta(days=6),
            pricing_mode='flexible_daily',
        )

        # Confirm payment
        RentalBookingService.mark_paid(booking)
        booking.refresh_from_db()
        assert booking.status == RentalBookingStatus.CONFIRMED

        client = APIClient()
        client.force_authenticate(user=staff_user)

        # Mark ready for pickup
        res = client.post(f"/api/rentals/admin/bookings/{booking.id}/transition/", {"action": "ready_for_pickup"})
        assert res.status_code == 200
        assert res.data['status'] == RentalBookingStatus.READY_FOR_PICKUP

        # Handover
        res = client.post(f"/api/rentals/admin/bookings/{booking.id}/transition/", {"action": "handover"})
        assert res.status_code == 200
        assert res.data['status'] == RentalBookingStatus.OUT_ON_RENTAL

        # Return
        res = client.post(f"/api/rentals/admin/bookings/{booking.id}/transition/", {"action": "record_return"})
        assert res.status_code == 200
        assert res.data['status'] == RentalBookingStatus.RETURNED_PENDING_INSPECTION

        # Inspection with pristine condition -> full deposit release
        inspect_res = client.post(f"/api/rentals/admin/bookings/{booking.id}/inspect/", {
            "condition": "pristine",
            "notes": "Returned in immaculate state.",
            "deposit_action": "refund_full"
        })
        assert inspect_res.status_code == 200
        assert inspect_res.data['status'] == RentalBookingStatus.COMPLETED
        assert inspect_res.data['deposit_status'] == DepositStatus.RELEASED

    def test_payment_model_integrity_constraint(self, test_user, rental_config):
        today = timezone.localdate()
        booking = RentalBookingService.create_booking(
            user=test_user,
            product=rental_config.product,
            start_date=today + datetime.timedelta(days=2),
            end_date=today + datetime.timedelta(days=5),
            pricing_mode='flexible_daily',
        )

        # 1. Payment with neither order nor rental_booking must fail
        with pytest.raises((IntegrityError, ValidationError)):
            p = Payment(
                user=test_user,
                amount=Decimal('100.00'),
                order=None,
                rental_booking=None,
            )
            p.full_clean()
            p.save()

        # 2. Payment with valid rental_booking succeeds
        valid_payment = Payment.objects.create(
            user=test_user,
            amount=Decimal('2500.00'),
            rental_booking=booking,
        )
        assert valid_payment.rental_booking == booking
        assert valid_payment.order is None

    def test_customer_cannot_perform_admin_mutations(self, test_user, rental_config):
        today = timezone.localdate()
        booking = RentalBookingService.create_booking(
            user=test_user,
            product=rental_config.product,
            start_date=today + datetime.timedelta(days=2),
            end_date=today + datetime.timedelta(days=5),
            pricing_mode='flexible_daily',
        )

        client = APIClient()
        client.force_authenticate(user=test_user)

        res = client.post(f"/api/rentals/admin/bookings/{booking.id}/transition/", {"action": "handover"})
        assert res.status_code in [401, 403]

        inspect_res = client.post(f"/api/rentals/admin/bookings/{booking.id}/inspect/", {
            "condition": "pristine",
            "deposit_action": "refund_full"
        })
        assert inspect_res.status_code in [401, 403]

    def test_deposit_settlement_deductions_and_damage_inspection(self, test_user, staff_user, rental_config):
        today = timezone.localdate()
        booking = RentalBookingService.create_booking(
            user=test_user,
            product=rental_config.product,
            start_date=today + datetime.timedelta(days=1),
            end_date=today + datetime.timedelta(days=4),
            pricing_mode='flexible_daily',
        )
        RentalBookingService.mark_paid(booking)
        booking.status = RentalBookingStatus.RETURNED_PENDING_INSPECTION
        booking.save()

        client = APIClient()
        client.force_authenticate(user=staff_user)

        # Deduct damage fee from deposit
        res = client.post(f"/api/rentals/admin/bookings/{booking.id}/inspect/", {
            "condition": "repairable_damage",
            "notes": "Hem tore during event.",
            "deposit_action": "deduct_damage",
            "damage_fee": 500.00,
        })
        assert res.status_code == 200
        booking.refresh_from_db()
        assert booking.status == RentalBookingStatus.COMPLETED
        assert booking.deposit_status == DepositStatus.PARTIALLY_REFUNDED
        assert booking.damage_fee == Decimal('500.00')
