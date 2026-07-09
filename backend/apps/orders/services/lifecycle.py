# ==========================================================
# ORDER LIFECYCLE ENGINE (CORE BUSINESS STATE MACHINE)
# ==========================================================

from apps.orders.models import Order, OrderStatus, PaymentStatus


class OrderLifecycleError(Exception):
    """Custom exception for invalid order state transitions"""
    pass


class OrderLifecycle:

    # ==========================================================
    # ALLOWED STATE TRANSITIONS (VERY IMPORTANT)
    # ==========================================================
    ALLOWED_TRANSITIONS = {
        OrderStatus.PENDING: [
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        ],
        OrderStatus.CONFIRMED: [
            OrderStatus.PROCESSING,
            OrderStatus.CANCELLED,
        ],
        OrderStatus.PROCESSING: [
            OrderStatus.SHIPPED,
            OrderStatus.CANCELLED,
        ],
        OrderStatus.SHIPPED: [
            OrderStatus.DELIVERED,
        ],
        OrderStatus.DELIVERED: [],
        OrderStatus.CANCELLED: [],
    }

    # ==========================================================
    # MAIN STATE TRANSITION METHOD
    # ==========================================================
    @staticmethod
    def transition(order: Order, new_status: str, reason: str = None):
        """
        Safely transitions order state with validation.
        This is the ONLY way order status should be changed.
        """

        current_status = order.status

        # ==================================================
        # VALIDATION: CHECK IF TRANSITION IS ALLOWED
        # ==================================================
        allowed = OrderLifecycle.ALLOWED_TRANSITIONS.get(current_status, [])

        if new_status not in allowed:
            raise OrderLifecycleError(
                f"Invalid transition: {current_status} → {new_status}"
            )

        # ==================================================
        # APPLY TRANSITION
        # ==================================================
        order.status = new_status
        order.save(update_fields=["status"])

        return order

    # ==========================================================
    # PAYMENT-DRIVEN ORDER UPDATE
    # ==========================================================
    @staticmethod
    def mark_paid(order: Order):
        """
        Called ONLY from payment webhook
        """

        order.payment_status = PaymentStatus.PAID

        # automatically move order forward
        if order.status == OrderStatus.PENDING:
            order.status = OrderStatus.CONFIRMED

        order.save(update_fields=["payment_status", "status"])

        return order

    # ==========================================================
    # CANCEL ORDER SAFELY
    # ==========================================================
    @staticmethod
    def cancel(order: Order):
        """
        Cancels order safely (business logic controlled)
        """

        if order.status in [OrderStatus.SHIPPED, OrderStatus.DELIVERED]:
            raise OrderLifecycleError("Cannot cancel shipped/delivered order")

        order.status = OrderStatus.CANCELLED
        order.save(update_fields=["status"])

        return order