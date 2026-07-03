from rest_framework import serializers
from apps.products.models import Product, ProductVariant, ProductMedia


# -------------------------
# MEDIA SERIALIZER
# -------------------------
class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = [
            "id",
            "media_type",
            "file",
            "is_primary",
            "display_order",
        ]


# -------------------------
# VARIANT SERIALIZER
# -------------------------
class ProductVariantSerializer(serializers.ModelSerializer):
    media = ProductMediaSerializer(many=True, read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            "id",
            "name",
            "sku",
            "color",
            "size",
            "price",
            "stock",
            "measurements",
            "media",
        ]


# -------------------------
# PRODUCT SERIALIZER
# -------------------------
class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "is_featured",
            "category",
            "category_name",
            "variants",
        ]