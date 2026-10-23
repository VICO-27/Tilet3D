import uuid
import datetime
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError

from apps.rentals.models import (
    RentalProductConfig,
    RentalBooking,
    RentalBookingStatus,
    RentalPaymentStatus,
    DepositStatus,
    RentalInspection,
    GarmentCondition,
)
from apps.rentals.services.pricing import RentalPricingService
from apps.rentals.services.inventory import RentalInventoryService


class RentalBookingService:
    """
    Orchestration service for rental reservations, payment transitions,
    fulfillment lifecycle, inspections, and deposit releases.
    """

    @staticmethod
    def generate_booking_reference() -> str:
        date_str = timezone.now().strftime("%Y%m%d")
        unique_suffix = uuid.uuid4().hex[:6].upper()
        return f"RNT-{date_str}-{unique_suffix}"

    @classmethod
    @transaction.atomic
    def create_booking(
        cls,
        user,
        product,
        start_date: datetime.date,
        pricing_mode: str,
        variant=None,
        end_date: datetime.date = None,
        package_id: str = None,
        quantity: int = 1,
        fulfillment_method: str = "shop_pickup",
        full_name: str = "",
        phone: str = "",
        address_line: str = "",
        city: str = "",
        special_instructions: str = "",
    ) -> RentalBooking:
        """
        Creates an atomic, concurrency-protected rental booking with an unpaid inventory hold.
        Locks the product rental configuration row to guarantee zero race conditions.
        """
        # 1. Pessimistic Lock on configuration
        try:
            config = (
                RentalProductConfig.objects
                .select_for_update()
                .get(product=product)
            )
        except RentalProductConfig.DoesNotExist:
            raise ValidationError("Rentals are not configured for this product.")

        if not config.is_rental_enabled:
            raise ValidationError("Rentals are currently disabled for this product.")

        # 2. Server-side authoritative pricing quote
        quote = RentalPricingService.quote(
            rental_config=config,
            pricing_mode=pricing_mode,
            start_date=start_date,
            end_date=end_date,
            package_id=package_id,
            quantity=quantity,
            fulfillment_method=fulfillment_method,
        )

        resolved_end_date = quote["end_date"]

        # 3. Concurrency-safe availability check under lock
        is_available, avail_count, msg = RentalInventoryService.check_availability(
            product=product,
            start_date=start_date,
            end_date=resolved_end_date,
            variant=variant,
            requested_quantity=quantity,
        )

        if not is_available:
            raise ValidationError(msg)

        # 4. Generate reference & 30-minute hold window
        ref = cls.generate_booking_reference()
        expires_at = timezone.now() + datetime.timedelta(minutes=30)

        selected_package = None
        if quote.get("package_id"):
            selected_package = config.packages.filter(id=quote["package_id"]).first()

        booking = RentalBooking.objects.create(
            booking_reference=ref,
            user=user,
            product=product,
            variant=variant,
            quantity=quantity,
            start_date=start_date,
            end_date=resolved_end_date,
            pricing_mode=pricing_mode,
            rental_package=selected_package,
            daily_rate_snapshot=quote["daily_rate"],
            rental_subtotal=quote["rental_subtotal"],
            deposit_amount=quote["deposit_amount"],
            delivery_fee=quote["delivery_fee"],
            total_amount=quote["total_amount"],
            status=RentalBookingStatus.PENDING_PAYMENT,
            payment_status=RentalPaymentStatus.PENDING,
            deposit_status=DepositStatus.HELD,
            fulfillment_method=fulfillment_method,
            full_name=full_name or f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip() or user.email,
            phone=phone,
            address_line=address_line,
            city=city,
            special_instructions=special_instructions,
            reservation_expires_at=expires_at,
        )

        return booking

    @classmethod
    @transaction.atomic
    def mark_paid(cls, booking: RentalBooking) -> RentalBooking:
        """
        Transition booking to CONFIRMED upon verified payment from Chapa gateway.
        """
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )

        if booking.payment_status == RentalPaymentStatus.PAID:
            return booking

        booking.payment_status = RentalPaymentStatus.PAID
        booking.status = RentalBookingStatus.CONFIRMED
        booking.reservation_expires_at = None  # Lock confirmed permanently
        booking.save(update_fields=["payment_status", "status", "reservation_expires_at", "updated_at"])
        return booking

    @classmethod
    @transaction.atomic
    def mark_failed(cls, booking: RentalBooking) -> RentalBooking:
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )
        booking.payment_status = RentalPaymentStatus.FAILED
        booking.status = RentalBookingStatus.CANCELLED
        booking.save(update_fields=["payment_status", "status", "updated_at"])
        return booking

    @classmethod
    @transaction.atomic
    def mark_ready_for_pickup(cls, booking: RentalBooking) -> RentalBooking:
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )
        if booking.status != RentalBookingStatus.CONFIRMED:
            raise ValidationError(f"Cannot transition from {booking.status} to ready_for_pickup.")

        booking.status = RentalBookingStatus.READY_FOR_PICKUP
        booking.save(update_fields=["status", "updated_at"])
        return booking

    @classmethod
    @transaction.atomic
    def mark_out_on_rental(cls, booking: RentalBooking) -> RentalBooking:
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )
        allowed = [RentalBookingStatus.CONFIRMED, RentalBookingStatus.READY_FOR_PICKUP]
        if booking.status not in allowed:
            raise ValidationError(f"Cannot handover item when status is {booking.status}.")

        booking.status = RentalBookingStatus.OUT_ON_RENTAL
        booking.picked_up_at = timezone.now()
        booking.save(update_fields=["status", "picked_up_at", "updated_at"])
        return booking

    @classmethod
    @transaction.atomic
    def record_return(cls, booking: RentalBooking) -> RentalBooking:
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )
        if booking.status not in [RentalBookingStatus.OUT_ON_RENTAL, RentalBookingStatus.OVERDUE]:
            raise ValidationError("Can only return garments that are currently out on rental or overdue.")

        booking.status = RentalBookingStatus.RETURNED_PENDING_INSPECTION
        booking.returned_at = timezone.now()
        booking.save(update_fields=["status", "returned_at", "updated_at"])
        return booking

    @classmethod
    @transaction.atomic
    def record_inspection(
        cls,
        booking: RentalBooking,
        condition: str,
        notes: str = "",
        assessed_damage_fee: Decimal = Decimal('0.00'),
        deposit_action: str = 'refund_full',
        inspected_by = None,
    ) -> RentalInspection:
        """
        Staff inspection workflow. Assesses condition and resolves deposit.
        """
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )

        inspection, _ = RentalInspection.objects.update_or_create(
            booking=booking,
            defaults={
                "condition": condition,
                "notes": notes,
                "assessed_damage_fee": assessed_damage_fee,
                "deposit_action": deposit_action,
                "inspected_by": inspected_by,
            }
        )

        # Update deposit status and booking status
        if deposit_action == 'refund_full':
            booking.deposit_status = DepositStatus.RELEASED
            booking.deposit_refunded_amount = booking.deposit_amount
            booking.status = RentalBookingStatus.COMPLETED
        elif deposit_action == 'deduct_damage':
            booking.deposit_status = DepositStatus.PARTIALLY_REFUNDED
            refund_amt = max(Decimal('0.00'), booking.deposit_amount - assessed_damage_fee)
            booking.deposit_refunded_amount = refund_amt
            booking.damage_fee = assessed_damage_fee
            booking.status = RentalBookingStatus.COMPLETED
        elif deposit_action == 'forfeit_all':
            booking.deposit_status = DepositStatus.FORFEITED
            booking.deposit_refunded_amount = Decimal('0.00')
            booking.damage_fee = booking.deposit_amount
            booking.status = RentalBookingStatus.DAMAGE_REVIEW

        booking.save(update_fields=[
            "deposit_status",
            "deposit_refunded_amount",
            "damage_fee",
            "status",
            "updated_at",
        ])

        return inspection

    @classmethod
    @transaction.atomic
    def cancel_booking(cls, booking: RentalBooking, cancelled_by=None) -> RentalBooking:
        booking = (
            RentalBooking.objects
            .select_for_update()
            .get(pk=booking.pk)
        )
        if booking.status in [RentalBookingStatus.OUT_ON_RENTAL, RentalBookingStatus.COMPLETED]:
            raise ValidationError(f"Cannot cancel a booking that is {booking.status}.")

        booking.status = RentalBookingStatus.CANCELLED
        booking.save(update_fields=["status", "updated_at"])
        return booking

    @classmethod
    def expire_stale_holds(cls) -> int:
        """
        Releases unpaid reservations that have exceeded their 30-minute hold window.
        Idempotent; safe to run via cron or beat.
        """
        now = timezone.now()
        expired_count = RentalBooking.objects.filter(
            status=RentalBookingStatus.PENDING_PAYMENT,
            reservation_expires_at__lt=now,
        ).update(
            status=RentalBookingStatus.CANCELLED,
            payment_status=RentalPaymentStatus.FAILED,
        )
        return expired_count
