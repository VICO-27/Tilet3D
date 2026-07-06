from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.models import Cart, CartItem

from .serializers import (
    CartSerializer,
    AddToCartSerializer,
    UpdateCartItemSerializer,
)


# ==========================================================
# GET CART
# ==========================================================
class CartView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CartSerializer

    def get_object(self):
        cart, _ = (
            Cart.objects.prefetch_related(
                "items__variant__product",
                "items__variant__media",
            ).get_or_create(
                user=self.request.user
            )
        )
        return cart

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context


# ==========================================================
# ADD TO CART
# ==========================================================
class AddToCartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AddToCartSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"message": "Item added successfully."},
            status=status.HTTP_201_CREATED,
        )


# ==========================================================
# UPDATE CART ITEM
# ==========================================================
class UpdateCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        item = get_object_or_404(
            CartItem.objects.select_related(
                "variant",
                "variant__product",
            ),
            id=item_id,
            cart__user=request.user,
        )

        serializer = UpdateCartItemSerializer(
            data=request.data,
            context={"item": item},
        )

        serializer.is_valid(raise_exception=True)

        result = serializer.save()

        if result is None:
            return Response(
                {"message": "Item removed successfully."},
                status=status.HTTP_200_OK,
            )

        return Response(
            {"message": "Cart updated successfully."},
            status=status.HTTP_200_OK,
        )


# ==========================================================
# REMOVE CART ITEM
# ==========================================================
class RemoveCartItemView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        item = get_object_or_404(
            CartItem,
            id=item_id,
            cart__user=request.user,
        )

        item.delete()

        return Response(
            {"message": "Item removed successfully."},
            status=status.HTTP_200_OK,
        )