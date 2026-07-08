# ==========================================================
# ORDER EXPIRATION SERVICE
# ==========================================================
#
# Purpose:
# - Automatically release reserved stock if payment is not completed
# - Prevent stock locking forever
#
# ==========================================================

from django.utils import timezone
from apps.orders.models import Order
from apps.products.services.inventory import InventoryService


class OrderExpirationService:

    @staticmethod
    def expire_orders():

        now = timezone.now()

        expired_orders = Order.objects.filter(
            payment_status="pending",
            reserved_until__lt=now
        ).select_related("payment")

        for order in expired_orders:

            # Release inventory
            for item in order.items.all():
                InventoryService.release(item.variant, item.quantity)

            order.status = "cancelled"
            order.payment_status = "failed"
            order.save()