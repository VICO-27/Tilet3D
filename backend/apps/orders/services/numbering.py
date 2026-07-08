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

from apps.orders.models import Order


class OrderNumberService:
    """
    Generates unique order numbers.

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

        # ==================================================
        # COUNT TODAY'S ORDERS
        # ==================================================

        today_count = Order.objects.filter(
            created_at__date=today
        ).count()

        sequence = today_count + 1

        return f"{cls.PREFIX}-{date_part}-{sequence:06d}"