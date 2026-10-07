from django.db.models import Min
from django.db.models import Count, Exists, OuterRef, Subquery
# backend/apps/products/api/views.py
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

from .serializers import ProductSerializer, ProductListSerializer, ProductCommentSerializer


# ==========================================================
# USER LIKED PRODUCTS LIST
# ==========================================================
class UserLikedProductsAPIView(generics.ListAPIView):
    """
    Returns a list of all active products liked by the current authenticated user.
    """
    serializer_class = ProductListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(
            likes__user=self.request.user,
            is_active=True
        ).prefetch_related("media", "variants", "likes", "comments", "bookmarks")

    def get_serializer_context(self):
        return {"request": self.request}


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
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.filter(
            is_active=True
        ).select_related(
            "category",
        ).prefetch_related(
            "media",
        ).order_by(
            "display_order", "-created_at", "id",
        )

        categories_param = self.request.query_params.get("categories", None)
        if categories_param:
            category_list = [cat.strip() for cat in categories_param.split(",")]
            queryset = queryset.filter(category__name__in=category_list)

        user_id = self.request.user.id if self.request.user.is_authenticated else None
        
        queryset = queryset.annotate(
            like_count_annotated=Count('likes', distinct=True),
            min_price=Min('variants__price'),
            comment_count_annotated=Count('comments', distinct=True),
        )
        from apps.products.models import ProductVariant
        default_var = ProductVariant.objects.filter(product=OuterRef('pk')).order_by('id').values('id')[:1]
        queryset = queryset.annotate(
            default_variant_id_annotated=Subquery(default_var)
        )

        
        if user_id:
            from apps.products.models import ProductLike, ProductBookmark
            queryset = queryset.annotate(
                is_liked_annotated=Exists(ProductLike.objects.filter(product=OuterRef('pk'), user_id=user_id)),
                is_saved_annotated=Exists(ProductBookmark.objects.filter(product=OuterRef('pk'), user_id=user_id)),
            )
        else:
            from django.db.models import Value, BooleanField
            queryset = queryset.annotate(
                is_liked_annotated=Value(False, output_field=BooleanField()),
                is_saved_annotated=Value(False, output_field=BooleanField()),
            )

        return queryset

    def get_serializer_context(self):
        return {"request": self.request}


# ==========================================================
# UNIFIED PRODUCT SEARCH (PAGINATED)
# ==========================================================
from rest_framework.pagination import PageNumberPagination
from apps.products.services.search import search_products

class ProductSearchPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 50

class ProductSearchAPIView(generics.ListAPIView):
    """
    Unified search endpoint that supports query strings for filtering,
    sorting, and returns paginated results.
    """
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    pagination_class = ProductSearchPagination

    def get_queryset(self):
        qs = search_products(
            query=self.request.query_params.get("q"),
            category=self.request.query_params.get("category"),
            min_price=self.request.query_params.get("min_price"),
            max_price=self.request.query_params.get("max_price"),
            color=self.request.query_params.get("color"),
            gender=self.request.query_params.get("gender"),
            availability=self.request.query_params.get("availability"),
            sort=self.request.query_params.get("sort"),
        )
        
        user_id = self.request.user.id if self.request.user.is_authenticated else None
        
        qs = qs.annotate(
            like_count_annotated=Count('likes', distinct=True),
            min_price=Min('variants__price'),
            comment_count_annotated=Count('comments', distinct=True),
        )
        
        if user_id:
            from apps.products.models import ProductLike, ProductBookmark
            qs = qs.annotate(
                is_liked_annotated=Exists(ProductLike.objects.filter(product=OuterRef('pk'), user_id=user_id)),
                is_saved_annotated=Exists(ProductBookmark.objects.filter(product=OuterRef('pk'), user_id=user_id)),
            )
        else:
            from django.db.models import Value, BooleanField
            qs = qs.annotate(
                is_liked_annotated=Value(False, output_field=BooleanField()),
                is_saved_annotated=Value(False, output_field=BooleanField()),
            )
            
        return qs

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
        return Product.objects.filter(is_active=True).select_related(
            "category"
        ).prefetch_related(
            "media",
            "variants",
            "likes",
            "comments",
            "bookmarks",
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
# BOOKMARK TOGGLE
# ==========================================================
from apps.products.models import ProductBookmark

class ToggleBookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product_id")

        bookmark, created = ProductBookmark.objects.get_or_create(
            user=request.user,
            product_id=product_id
        )

        if not created:
            bookmark.delete()
            return Response({"status": "unsaved"})

        return Response({"status": "saved"})


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