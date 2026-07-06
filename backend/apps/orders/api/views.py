from decimal import Decimal
import uuid

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart
from apps.orders.models import Order, OrderItem
from .serializers import (
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)


# ==========================================================
# MY ORDERS
# ==========================================================
class OrderListAPIView(generics.ListAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = OrderListSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )


# ==========================================================
# ORDER DETAIL
# ==========================================================
class OrderDetailAPIView(generics.RetrieveAPIView):

    permission_classes = [IsAuthenticated]
    serializer_class = OrderDetailSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related("items")
        )


# ==========================================================
# CHECKOUT
# ==========================================================
class CheckoutAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):

        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart = get_object_or_404(
            Cart.objects.prefetch_related(
                "items__variant__product"
            ),
            user=request.user,
        )

        if not cart.items.exists():
            return Response(
                {"error": "Your cart is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subtotal = Decimal("0.00")

        # -----------------------------
        # Validate Stock
        # -----------------------------
        for item in cart.items.all():

            variant = item.variant

            if not variant.is_active:
                return Response(
                    {
                        "error": f"{variant.name} is unavailable."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if item.quantity > variant.stock:
                return Response(
                    {
                        "error": f"Only {variant.stock} left for {variant.name}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subtotal += variant.price * item.quantity

        shipping_fee = Decimal("0.00")
        tax = Decimal("0.00")
        discount = Decimal("0.00")

        total = (
            subtotal
            + shipping_fee
            + tax
            - discount
        )

        order = Order.objects.create(
            user=request.user,
            order_number=uuid.uuid4().hex[:12].upper(),

            subtotal=subtotal,
            shipping_fee=shipping_fee,
            tax=tax,
            discount=discount,
            total=total,

            **serializer.validated_data,
        )

        # -----------------------------
        # Create Order Items
        # -----------------------------
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

            # Reduce Stock
            variant.stock -= item.quantity
            variant.save(update_fields=["stock"])

        # -----------------------------
        # Clear Cart
        # -----------------------------
        cart.items.all().delete()

        return Response(
            {
                "message": "Order placed successfully.",
                "order": OrderDetailSerializer(order).data,
            },
            status=status.HTTP_201_CREATED,
        )