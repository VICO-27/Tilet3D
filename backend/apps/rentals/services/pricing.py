import datetime
from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone


class RentalPricingService:
    """
    Server-side authority for all rental quote and price calculations.
    Ensures pricing cannot be manipulated by frontend clients.
    """

    @staticmethod
    def calculate_duration_days(start_date: datetime.date, end_date: datetime.date) -> int:
        """
        Calculates billable rental duration.
        Calendar day convention:
        If pickup is Oct 24 and return is Oct 26: (26 - 24) = 2 days.
        Same day pickup and return (e.g., event) counts as 1 day minimum.
        """
        if not start_date or not end_date:
            raise ValidationError("Both start_date and end_date are required.")

        today = timezone.localdate()
        if start_date < today:
            raise ValidationError("Rental start date cannot be in the past.")

        if end_date < start_date:
            raise ValidationError("Rental return date cannot precede start date.")

        days = (end_date - start_date).days
        return max(days, 1)

    @classmethod
    def quote(
        cls,
        rental_config,
        pricing_mode: str,
        start_date: datetime.date,
        end_date: datetime.date = None,
        package_id: str = None,
        quantity: int = 1,
        fulfillment_method: str = "shop_pickup",
    ) -> dict:
        """
        Computes an authoritative price breakdown.
        """
        if quantity < 1:
            raise ValidationError("Quantity must be at least 1.")

        if not rental_config.is_rental_enabled:
            raise ValidationError("Rentals are currently disabled for this piece.")

        selected_package = None
        duration_days = 0
        rental_subtotal = Decimal('0.00')

        if pricing_mode == 'package':
            if not package_id:
                raise ValidationError("Package ID must be specified for package pricing mode.")
            try:
                selected_package = rental_config.packages.get(id=package_id, is_active=True)
            except Exception:
                raise ValidationError("Specified rental package is invalid or inactive.")

            duration_days = selected_package.duration_days
            # Calculate end_date based on package duration if not explicitly provided
            if not end_date:
                end_date = start_date + datetime.timedelta(days=duration_days)
            rental_subtotal = selected_package.price * quantity

        elif pricing_mode == 'flexible_daily':
            if not end_date:
                raise ValidationError("Return date is required for flexible rental.")

            duration_days = cls.calculate_duration_days(start_date, end_date)

            if duration_days < rental_config.min_rental_days:
                raise ValidationError(f"Minimum rental period is {rental_config.min_rental_days} day(s).")
            if duration_days > rental_config.max_rental_days:
                raise ValidationError(f"Maximum rental period is {rental_config.max_rental_days} days.")

            daily_rate = rental_config.daily_rate
            if daily_rate <= Decimal('0.00'):
                raise ValidationError("Daily rate is not configured for this garment.")

            rental_subtotal = (daily_rate * duration_days) * quantity

        else:
            raise ValidationError(f"Unsupported pricing mode '{pricing_mode}'.")

        # Security Deposit (per piece)
        security_deposit = (rental_config.security_deposit or Decimal('0.00')) * quantity

        # Delivery & collection fee (if requested)
        delivery_fee = Decimal('0.00')
        if fulfillment_method == 'delivery':
            delivery_fee = rental_config.delivery_fee or Decimal('150.00')

        total_amount = rental_subtotal + security_deposit + delivery_fee

        return {
            "pricing_mode": pricing_mode,
            "duration_days": duration_days,
            "start_date": start_date,
            "end_date": end_date,
            "daily_rate": rental_config.daily_rate,
            "package_id": str(selected_package.id) if selected_package else None,
            "package_name": selected_package.name if selected_package else None,
            "rental_subtotal": rental_subtotal.quantize(Decimal('0.01')),
            "deposit_amount": security_deposit.quantize(Decimal('0.01')),
            "delivery_fee": delivery_fee.quantize(Decimal('0.01')),
            "total_amount": total_amount.quantize(Decimal('0.01')),
            "currency": "ETB",
        }
