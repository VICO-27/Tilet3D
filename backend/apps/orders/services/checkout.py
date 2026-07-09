# ==========================================================
# CHECKOUT SERVICE
# ==========================================================
#
# Single source of truth for checkout.
#
# Responsibilities:
# - Validate cart
# - Reserve inventory
# - Create order
# - Create order items
# - Clear cart
# - Create payment record
# - Delegate gateway initialization to PaymentService
#
# ==========================================================

from decimal import Decimal

from django.db import transaction

from apps.cart.models import Cart
from apps.orders.models import Order, OrderItem
from apps.orders.services.numbering import OrderNumberService

from apps.products.services.inventory import InventoryService

from apps.payments.services import PaymentService

from apps.payments.gateway_factory import GatewayFactory
class CheckoutService:

    @staticmethod
    @transaction.atomic
    def checkout(user, checkout_data, provider="chapa"):

        cart = (
            Cart.objects
            .select_for_update()
            .prefetch_related("items__variant__product")
            .get(user=user)
        )

        if not cart.items.exists():
            raise Exception("Your cart is empty.")

        subtotal = Decimal("0.00")

        # ==========================================================
        # VALIDATE INVENTORY
        # ==========================================================

        for item in cart.items.all():

            variant = item.variant

            if not variant.is_active:
                raise Exception(f"{variant.name} is unavailable.")

            InventoryService.reserve(
                variant=variant,
                quantity=item.quantity,
            )

            subtotal += variant.price * item.quantity

        shipping_fee = Decimal("0.00")
        tax = Decimal("0.00")
        discount = Decimal("0.00")

        total = subtotal + shipping_fee + tax - discount

        # ==========================================================
        # CREATE ORDER
        # ==========================================================

        order = Order.objects.create(

            user=user,

            order_number=OrderNumberService.generate(),

            subtotal=subtotal,
            shipping_fee=shipping_fee,
            tax=tax,
            discount=discount,
            total=total,

            full_name=checkout_data["full_name"],
            phone=checkout_data["phone"],
            region=checkout_data["region"],
            city=checkout_data["city"],
            sub_city=checkout_data.get("sub_city", ""),
            woreda=checkout_data.get("woreda", ""),
            house_no=checkout_data.get("house_no", ""),
            postal_code=checkout_data.get("postal_code", ""),
            note=checkout_data.get("note", ""),
        )

        # ==========================================================
        # CREATE ORDER ITEMS
        # ==========================================================

        for item in cart.items.all():

            variant = item.variant
            product = variant.product

            OrderItem.objects.create(

                order=order,

                product=product,
                variant=variant,

                product_name=product.name,
                variant_name=variant.name,

                sku=variant.sku,
                color=variant.color,
                size=variant.size,

                price=variant.price,
                quantity=item.quantity,

                subtotal=variant.price * item.quantity,
            )

        # ==========================================================
        # CLEAR CART
        # ==========================================================

        cart.items.all().delete()
        # ==========================================================
        # CREATE PAYMENT
        # ==========================================================

        payment = PaymentService.create_payment(
            order=order,
            user=user,
            provider=provider,
        )

        from apps.payments.gateway_factory import GatewayFactory

        gateway = GatewayFactory.get_gateway(provider)

        gateway_response = gateway.create_payment(payment)

        payment.checkout_url = gateway_response["checkout_url"]
        payment.transaction_id = gateway_response["transaction_id"]

        payment.save(
            update_fields=[
                "checkout_url",
                "transaction_id",
            ]
        )

        return order, payment


