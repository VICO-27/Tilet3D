# ==========================================================
# CHECKOUT SERVICE (INVENTORY SAFE VERSION)
# ==========================================================
#
# Flow:
# 1. Lock cart
# 2. Validate stock
# 3. Reserve inventory (NOT deduct)
# 4. Create order snapshot
# 5. Create payment
# 6. Initialize gateway
# 7. Return checkout URL
#
# ==========================================================

from decimal import Decimal
from django.db import transaction

from apps.cart.models import Cart
from apps.orders.models import Order, OrderItem
from apps.orders.services.numbering import OrderNumberService

from apps.payments.services import PaymentService
from apps.payments.gateway_factory import GatewayFactory

from apps.products.services.inventory import InventoryService


class CheckoutService:

    # ==========================================================
    # MAIN CHECKOUT PIPELINE
    # ==========================================================
    @staticmethod
    def checkout(user, provider="chapa"):

        with transaction.atomic():

            # ==================================================
            # 1. GET LOCKED CART
            # ==================================================
            cart = (
                Cart.objects
                .select_for_update()
                .prefetch_related("items__variant__product")
                .get(user=user)
            )

            if not cart.items.exists():
                raise Exception("Cart is empty")

            # ==================================================
            # 2. VALIDATE + RESERVE STOCK
            # ==================================================
            subtotal = Decimal("0.00")

            for item in cart.items.all():
                variant = item.variant

                if not variant.is_active:
                    raise Exception(f"{variant.name} is inactive")

                # 🔒 RESERVE instead of deduct
                InventoryService.reserve(variant, item.quantity)

                subtotal += variant.price * item.quantity

            # ==================================================
            # 3. ORDER TOTALS
            # ==================================================
            shipping_fee = Decimal("0.00")
            tax = Decimal("0.00")
            discount = Decimal("0.00")

            total = subtotal + shipping_fee + tax - discount

            # ==================================================
            # 4. CREATE ORDER
            # ==================================================
            order = Order.objects.create(
                user=user,
                order_number=OrderNumberService.generate(),

                subtotal=subtotal,
                shipping_fee=shipping_fee,
                tax=tax,
                discount=discount,
                total=total,

                full_name=user.profile.full_name if hasattr(user, "profile") else "",
                phone="",
                region="",
                city="",
                sub_city="",
                woreda="",
                house_no="",
                postal_code="",
                note="",
            )

            # ==================================================
            # 5. CREATE ORDER ITEMS (SNAPSHOT)
            # ==================================================
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

            # ==================================================
            # 6. CLEAR CART
            # ==================================================
            cart.items.all().delete()

            # ==================================================
            # 7. CREATE PAYMENT (DB ONLY)
            # ==================================================
            payment = PaymentService.create_payment(
                order=order,
                user=user,
                provider=provider
            )

            # ==================================================
            # 8. INITIALIZE GATEWAY
            # ==================================================
            gateway = GatewayFactory.get_gateway(provider)
            gateway_response = gateway.create_payment(payment)

            # ==================================================
            # 9. STORE GATEWAY DATA
            # ==================================================
            payment.checkout_url = gateway_response["checkout_url"]
            payment.transaction_id = gateway_response["transaction_id"]
            payment.save(update_fields=["checkout_url", "transaction_id"])

            # ==================================================
            # 10. RETURN RESPONSE
            # ==================================================
            return order, payment