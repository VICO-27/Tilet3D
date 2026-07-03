from rest_framework import generics

from apps.products.models import (
    Product, 
    Cart, 
    CartItem, 
    ProductVariant, 
    ProductLike, 
    ProductComment, 
    ProductShare )

from .serializers import CartSerializer, ProductSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related(
            "variants__media", "likes", "comments"
        )

    # ✅ ADD THIS HERE
    def get_serializer_context(self):
        return {"request": self.request}

class ProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related(
            "variants__media", "likes", "comments", "category"
        )

    # ✅ ADD THIS HERE TOO
    def get_serializer_context(self):
        return {"request": self.request}
    

class CartView(APIView):
    """
    Get user's cart (auto-create if not exists)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)

        serializer = CartSerializer(cart)
        return Response(serializer.data)




class UpdateCartItemView(APIView):
    """
    Update quantity of cart item
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, item_id):
        quantity = int(request.data.get("quantity", 1))

        item = CartItem.objects.get(
            id=item_id,
            cart__user=request.user
        )

        item.quantity = quantity
        item.save()

        return Response({"message": "Quantity updated"})




class RemoveCartItemView(APIView):
    """
    Remove item from cart
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id):
        cart = Cart.objects.get(user=request.user)

        CartItem.objects.filter(
            id=item_id,
            cart=cart
        ).delete()

        return Response({"message": "Item removed"})




class AddToCartView(APIView):
    """
    Add product variant to cart
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        variant_id = request.data.get("variant_id")
        quantity = int(request.data.get("quantity", 1))

        variant = ProductVariant.objects.get(id=variant_id)

        cart, _ = Cart.objects.get_or_create(user=request.user)

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={"quantity": quantity}
        )

        if not created:
            item.quantity += quantity
            item.save()

        return Response({"message": "Item added to cart"})


class ToggleLikeView(APIView):
    """
    Like or unlike a product (toggle system).
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")

        like, created = ProductLike.objects.get_or_create(
            user=request.user,
            product_id=product_id
        )

        if not created:
            like.delete()
            return Response({"liked": False})

        return Response({"liked": True})



class AddCommentView(APIView):
    """
    Add comment to product
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        text = request.data.get("text")

        comment = ProductComment.objects.create(
            user=request.user,
            product_id=product_id,
            text=text
        )

        return Response({
            "message": "Comment added",
            "comment_id": comment.id
        })


class ShareProductView(APIView):
    """
    Track product sharing
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        platform = request.data.get("platform", "")

        ProductShare.objects.create(
            user=request.user,
            product_id=product_id,
            platform=platform
        )

        return Response({"message": "Share recorded"})