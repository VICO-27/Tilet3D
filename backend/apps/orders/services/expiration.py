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
from datetime import timedelta
from apps.orders.models import Order
from apps.products.services.inventory import InventoryService
from apps.orders.services.lifecycle import OrderLifecycle, OrderLifecycleError
import logging

logger = logging.getLogger(__name__)

class OrderExpirationService:

    @staticmethod
    def expire_orders():

        now = timezone.now()
        
        # Calculate the threshold (e.g., orders older than 30 minutes expire)
        # Adjust 'minutes=30' to your actual reservation window
        expiration_threshold = now - timedelta(minutes=30)

        # Find orders that are pending and past their reservation window
        expired_orders = Order.objects.filter(
            payment_status="pending",
            created_at__lt=expiration_threshold
        ).select_related("payment")

        for order in expired_orders:
            try:
                # 1. Release inventory first
                for item in order.items.all():
                    InventoryService.release(item.variant, item.quantity)

                # 2. Cancel order using the SAFE Lifecycle Engine
                OrderLifecycle.cancel(order)

                # 3. Mark payment as failed
                order.payment_status = "failed"
                order.save(update_fields=["payment_status"])
                
            except OrderLifecycleError as e:
                # Log the error if a state transition fails, but keep processing other orders
                logger.error(f"Failed to expire order {order.order_number}: {str(e)}")