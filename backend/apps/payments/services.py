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
    # CREATE RENTAL PAYMENT
    # ==========================================================
    @staticmethod
    def create_rental_payment(rental_booking, user, provider="chapa"):
        payment, created = Payment.objects.get_or_create(
            rental_booking=rental_booking,
            defaults={
                "user": user,
                "amount": rental_booking.total_amount,
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
            .select_related("order", "rental_booking")
            .get(pk=payment.pk)
        )

        if payment.status == PaymentStatus.SUCCESS:
            return payment

        payment.status = PaymentStatus.SUCCESS
        payment.save(update_fields=["status"])

        # Handle Rental Booking
        if payment.rental_booking:
            from apps.rentals.services.booking import RentalBookingService
            RentalBookingService.mark_paid(payment.rental_booking)
            return payment

        # Handle Standard Order
        order = payment.order
        if order:
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
            .select_related("order", "rental_booking")
            .get(pk=payment.pk)
        )

        if payment.status == PaymentStatus.FAILED:
            return payment

        payment.status = PaymentStatus.FAILED
        payment.save(update_fields=["status"])

        # Handle Rental Booking
        if payment.rental_booking:
            from apps.rentals.services.booking import RentalBookingService
            RentalBookingService.mark_failed(payment.rental_booking)
            return payment

        # Handle Standard Order
        order = payment.order
        if order:
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