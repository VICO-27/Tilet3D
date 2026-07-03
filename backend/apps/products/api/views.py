from rest_framework import generics
from apps.products.models import Product
from .serializers import ProductSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny


class ProductListAPIView(generics.ListAPIView):
    permission_classes = [AllowAny]

    serializer_class = ProductSerializer

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related(
            "variants__media"
        )
    
class ProductDetailAPIView(generics.RetrieveAPIView):
    """
    Returns full product details including:
    - variants
    - media
    - category info
    """

    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return Product.objects.filter(is_active=True).prefetch_related(
            "variants__media",
            "category"
        )