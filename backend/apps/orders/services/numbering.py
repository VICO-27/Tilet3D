# ==========================================================
# ORDER NUMBER GENERATION SERVICE
# ==========================================================
#
# Responsible ONLY for generating human-friendly,
# unique order numbers.
#
# Example:
#
# TLT-20260706-000001
# TLT-20260706-000002
#
# ==========================================================

from django.utils import timezone
from django.db import transaction
from apps.orders.models import OrderSequence

class OrderNumberService:
    """
    Generates unique order numbers safely under concurrency.

    Format:
        TLT-YYYYMMDD-XXXXXX

    Example:
        TLT-20260706-000001
    """

    PREFIX = "TLT"

    @classmethod
    def generate(cls):
        today = timezone.localdate()
        date_part = today.strftime("%Y%m%d")

        with transaction.atomic():
            # Get or create the sequence row for today
            seq, created = OrderSequence.objects.select_for_update().get_or_create(date=today)
            
            # Increment and save
            seq.last_value += 1
            seq.save(update_fields=['last_value'])

            sequence = seq.last_value

        return f"{cls.PREFIX}-{date_part}-{sequence:06d}"