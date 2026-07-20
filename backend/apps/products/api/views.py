from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import (
    Product,
    ProductLike,
    ProductComment,
    ProductShare,
)

from .serializers import ProductSerializer, ProductCommentSerializer





# ==========================================================
# LIST COMMENTS FOR A PRODUCT
# ==========================================================
class ProductCommentsListView(generics.ListAPIView):
    serializer_class = ProductCommentSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return ProductComment.objects.filter(
            product_id=self.kwargs["id"]
        ).select_related("user")







# ==========================================================
# PRODUCT LIST
# ==========================================================
class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Product.objects.filter(
            is_active=True
        ).prefetch_related(
            "media",
            "variants",
            "likes",
            "comments",
        )

    def get_serializer_context(self):
        return {"request": self.request}


# ==========================================================
# PRODUCT DETAIL
# ==========================================================
class ProductDetailAPIView(generics.RetrieveAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    lookup_field = "id"
    lookup_url_kwarg = "id"

    def get_queryset(self):
        return (
            Product.objects.filter(is_active=True)
            .prefetch_related(
    "media",
    "variants",
    "likes",
    "comments",
)
        )

    def get_serializer_context(self):
        return {"request": self.request}

# ==========================================================
# LIKE TOGGLE
# ==========================================================
class ToggleLikeView(APIView):
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


# ==========================================================
# ADD COMMENT
# ==========================================================
class AddCommentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")
        text = request.data.get("text")

        comment = ProductComment.objects.create(
            user=request.user,
            product_id=product_id,
            text=text
        )

        serializer = ProductCommentSerializer(comment)
        return Response(serializer.data)

# ==========================================================
# SHARE PRODUCT
# ==========================================================
class ShareProductView(APIView):
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