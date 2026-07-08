# ==========================================================
# PAYMENT SERVICE (FINAL INTEGRATION VERSION)
# ==========================================================

from django.db import transaction

from .models import Payment, PaymentStatus
from apps.products.services.inventory import InventoryService


class PaymentService:

    @staticmethod
    def create_payment(order, user, provider="chapa"):

        existing = Payment.objects.filter(order=order).first()
        if existing:
            return existing

        return Payment.objects.create(
            order=order,
            user=user,
            amount=order.total,
            currency="ETB",
            provider=provider,
            status=PaymentStatus.INITIATED,
        )

    # ==========================================================
    # SUCCESS FLOW (CONFIRM INVENTORY)
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def mark_success(payment):

        payment = Payment.objects.select_for_update().get(id=payment.id)

        if payment.status == PaymentStatus.SUCCESS:
            return payment

        payment.status = PaymentStatus.SUCCESS
        payment.save(update_fields=["status"])

        order = payment.order
        order.payment_status = "paid"
        order.status = "processing"
        order.save(update_fields=["payment_status", "status"])

        # ======================================================
        # CONFIRM STOCK (FINAL DEDUCTION)
        # ======================================================
        for item in order.items.all():
            InventoryService.confirm(item.variant, item.quantity)

        return payment

    # ==========================================================
    # FAILURE FLOW (RELEASE INVENTORY)
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def mark_failed(payment):

        payment = Payment.objects.select_for_update().get(id=payment.id)

        if payment.status == PaymentStatus.FAILED:
            return payment

        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])

        order = payment.order
        order.payment_status = "failed"
        order.status = "cancelled"
        order.save(update_fields=["payment_status", "status"])

        # ======================================================
        # RELEASE STOCK BACK
        # ======================================================
        for item in order.items.all():
            InventoryService.release(item.variant, item.quantity)

        return payment