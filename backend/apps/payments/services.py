# ==========================================================
# PAYMENT SERVICE
# ==========================================================
#
# Responsibilities
# - Create payment records
# - Handle payment state transitions
# - Synchronize order status
# - Synchronize inventory
#
# Business logic only.
# No external API calls.
#
# ==========================================================

from django.db import transaction

from apps.orders.models import (
    OrderStatus,
    PaymentStatus as OrderPaymentStatus,
)

from apps.products.services.inventory import InventoryService

from .models import (
    Payment,
    PaymentStatus,
)


class PaymentService:

    # ==========================================================
    # CREATE PAYMENT
    # ==========================================================
    @staticmethod
    def create_payment(order, user, provider="chapa"):

        payment, created = Payment.objects.get_or_create(

            order=order,

            defaults={
                "user": user,
                "amount": order.total,
                "currency": "ETB",
                "provider": provider,
                "status": PaymentStatus.INITIATED,
            },
        )

        return payment

    # ==========================================================
    # PAYMENT SUCCESS
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def mark_success(payment):

        payment = (
            Payment.objects
            .select_for_update()
            .select_related("order")
            .get(pk=payment.pk)
        )

        if payment.status == PaymentStatus.SUCCESS:
            return payment

        payment.status = PaymentStatus.SUCCESS
        payment.save(update_fields=["status"])

        order = payment.order

        # --------------------------------------------------
        # FIX 1: Routing via Lifecycle State Machine
        # --------------------------------------------------
        from apps.orders.services.lifecycle import OrderLifecycle
        
        OrderLifecycle.mark_paid(order)
        OrderLifecycle.transition(
            order,
            OrderStatus.PROCESSING,
        )

        # Confirm Inventory Reservations
        for item in order.items.select_related("variant"):
            InventoryService.confirm(
                variant=item.variant,
                quantity=item.quantity,
            )

        return payment

    # ==========================================================
    # PAYMENT FAILED
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def mark_failed(payment):

        payment = (
            Payment.objects
            .select_for_update()
            .select_related("order")
            .get(pk=payment.pk)
        )

        if payment.status == PaymentStatus.FAILED:
            return payment

        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])

        order = payment.order

        # --------------------------------------------------
        # FIX 2: Routing Failures via Lifecycle State Machine
        # --------------------------------------------------
        order.payment_status = OrderPaymentStatus.FAILED
        order.save(update_fields=["payment_status"])
        
        from apps.orders.services.lifecycle import OrderLifecycle
        OrderLifecycle.cancel(order)

        # Release Reserved Inventory Back to Stock
        for item in order.items.select_related("variant"):
            InventoryService.release(
                variant=item.variant,
                quantity=item.quantity,
            )

        return payment