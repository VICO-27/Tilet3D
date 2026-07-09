from rest_framework import generics
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .serializers import (
    CheckoutSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)

from apps.orders.services.checkout import CheckoutService


# ==========================================================
# CHECKOUT
# ==========================================================

class CheckoutAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CheckoutSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        provider = request.data.get(
            "provider",
            "chapa",
        )

        order, payment = CheckoutService.checkout(

            user=request.user,

            checkout_data=serializer.validated_data,

            provider=provider,
        )

        return Response(
            {
                "message": "Checkout initialized successfully.",

                "order_id": str(order.id),

                "payment_id": str(payment.id),

                "checkout_url": payment.checkout_url,
            },
            status=status.HTTP_201_CREATED,
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