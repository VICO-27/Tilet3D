from django.db import transaction
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.products.models import Category, Product, ProductVariant
from .admin_serializers import (
    AdminCategorySerializer,
    AdminCategoryDetailSerializer,
    AdminProductListSerializer,
    AdminProductDetailSerializer,
    AdminProductCreateUpdateSerializer,
    AdminInventoryVariantSerializer,
    AdminInventoryAdjustSerializer,
)


class AdminProductPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminInventoryPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminCategoryListView(generics.ListCreateAPIView):
    """
    Staff-only endpoint returning all catalog categories with product counts,
    and supporting creation of new categories.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminCategoryDetailSerializer
    queryset = Category.objects.all().order_by("display_order", "name")
    pagination_class = None


class AdminCategoryDetailView(generics.RetrieveUpdateAPIView):
    """
    Staff-only endpoint for retrieving and updating category details.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminCategoryDetailSerializer
    queryset = Category.objects.all()
    lookup_field = "id"



class AdminProductListCreateView(generics.ListCreateAPIView):
    """
    Staff-only endpoint for listing all products (active and inactive) and creating new products.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    pagination_class = AdminProductPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return AdminProductCreateUpdateSerializer
        return AdminProductListSerializer

    def get_queryset(self):
        queryset = (
            Product.objects.all()
            .select_related("category")
            .prefetch_related("variants", "media")
            .order_by("-created_at")
        )

        # 1. Search filter
        search = self.request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(description__icontains=search)
                | Q(category__name__icontains=search)
                | Q(variants__sku__icontains=search)
            ).distinct()

        # 2. Category filter
        category = self.request.query_params.get("category", "").strip()
        if category:
            queryset = queryset.filter(
                Q(category__id__iexact=category) | Q(category__name__iexact=category)
            )

        # 3. Status filter (is_active)
        status_param = self.request.query_params.get("status", "").strip().lower()
        if status_param in ["active", "true", "1"]:
            queryset = queryset.filter(is_active=True)
        elif status_param in ["inactive", "false", "0"]:
            queryset = queryset.filter(is_active=False)

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        response_serializer = AdminProductDetailSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(generics.RetrieveUpdateAPIView):
    """
    Staff-only endpoint for retrieving and modifying a specific product and its variants.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    lookup_field = "id"
    queryset = (
        Product.objects.all()
        .select_related("category")
        .prefetch_related("variants", "media")
    )

    def get_serializer_class(self):
        if self.request.method in ["PUT", "PATCH"]:
            return AdminProductCreateUpdateSerializer
        return AdminProductDetailSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        response_serializer = AdminProductDetailSerializer(product, context={"request": request})
        return Response(response_serializer.data, status=status.HTTP_200_OK)


class AdminProductToggleActiveView(APIView):
    """
    Staff-only endpoint for safely deactivating or reactivating a product.
    Does not delete database records or break existing customer order history.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, id):
        try:
            product = Product.objects.get(id=id)
        except Product.DoesNotExist:
            return Response(
                {"detail": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        product.is_active = not product.is_active
        product.save(update_fields=["is_active"])

        from apps.products.cache_utils import bump_catalog_version
        bump_catalog_version()

        return Response(
            {
                "id": str(product.id),
                "name": product.name,
                "is_active": product.is_active,
                "message": (
                    f"Product '{product.name}' is now {'active and visible in store' if product.is_active else 'deactivated and hidden from customers'}."
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminInventoryListView(generics.ListAPIView):
    """
    Staff-only endpoint for inventory oversight across all product variants.
    Shows total physical stock, reserved stock, and available stock with filtering.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = AdminInventoryVariantSerializer
    pagination_class = AdminInventoryPagination

    def get_queryset(self):
        qs = ProductVariant.objects.select_related("product").order_by("product__name", "name")
        search = self.request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(product__name__icontains=search)
            )
        status_filter = self.request.query_params.get("status", "").strip()
        if status_filter == "out_of_stock":
            qs = qs.filter(stock=0)
        elif status_filter == "low_stock":
            qs = qs.filter(stock__gt=0, stock__lte=5)
        elif status_filter == "in_stock":
            qs = qs.filter(stock__gt=5)
        return qs


class AdminInventoryAdjustView(APIView):
    """
    Staff-only endpoint for safely adjusting physical stock.
    Rejects adjustments that would drop physical stock below currently reserved stock.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, id):
        try:
            with transaction.atomic():
                variant = ProductVariant.objects.select_for_update().get(id=id)
                serializer = AdminInventoryAdjustSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                new_stock = serializer.validated_data["stock"]

                if new_stock < variant.reserved_stock:
                    return Response(
                        {
                            "detail": (
                                f"Cannot set physical stock to {new_stock}. "
                                f"There are currently {variant.reserved_stock} units reserved for pending checkouts/orders."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                old_stock = variant.stock
                variant.stock = new_stock
                variant.save(update_fields=["stock"])

                response_serializer = AdminInventoryVariantSerializer(variant)
                return Response(
                    {
                        "message": f"Stock for {variant.product.name} ({variant.name}) updated from {old_stock} to {new_stock}.",
                        "variant": response_serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
        except ProductVariant.DoesNotExist:
            return Response({"detail": "Product variant not found."}, status=status.HTTP_404_NOT_FOUND)

