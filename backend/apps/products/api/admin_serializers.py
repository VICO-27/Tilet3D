from decimal import Decimal
import uuid
import cloudinary.utils
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from apps.products.models import Category, Product, ProductVariant, ProductMedia
from .serializers import ProductVariantSerializer, ProductMediaSerializer


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class AdminProductListSerializer(serializers.ModelSerializer):
    category = AdminCategorySerializer(read_only=True)
    price = serializers.SerializerMethodField()
    total_stock = serializers.SerializerMethodField()
    variants_count = serializers.SerializerMethodField()
    primary_image = serializers.SerializerMethodField()
    default_variant = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "category",
            "is_active",
            "is_featured",
            "display_order",
            "price",
            "total_stock",
            "variants_count",
            "primary_image",
            "default_variant",
            "created_at",
            "updated_at",
        )

    def get_price(self, obj):
        first_variant = obj.variants.filter(is_active=True).first() or obj.variants.first()
        return str(first_variant.price) if first_variant else "0.00"

    def get_total_stock(self, obj):
        return sum(v.stock for v in obj.variants.all())

    def get_variants_count(self, obj):
        return obj.variants.count()

    def get_primary_image(self, obj):
        media = (
            obj.media.filter(is_primary=True, media_type="image").first()
            or obj.media.filter(media_type="image").first()
        )
        if not media or not media.file:
            return None
        url, _ = cloudinary.utils.cloudinary_url(
            str(media.file.name),
            resource_type="image",
            secure=True,
        )
        return url

    def get_default_variant(self, obj):
        variant = obj.variants.first()
        if not variant:
            return None
        return {
            "id": str(variant.id),
            "sku": variant.sku,
            "price": str(variant.price),
            "stock": variant.stock,
            "color": variant.color,
            "size": variant.size,
        }


class AdminProductDetailSerializer(serializers.ModelSerializer):
    category = AdminCategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "category",
            "is_active",
            "is_featured",
            "display_order",
            "variants",
            "media",
            "primary_image",
            "created_at",
            "updated_at",
        )

    def get_primary_image(self, obj):
        media = (
            obj.media.filter(is_primary=True, media_type="image").first()
            or obj.media.filter(media_type="image").first()
        )
        if not media or not media.file:
            return None
        url, _ = cloudinary.utils.cloudinary_url(
            str(media.file.name),
            resource_type="image",
            secure=True,
        )
        return url


class AdminProductCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.UUIDField(write_only=True, required=True)
    price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal("0.01"),
        required=True,
        write_only=True,
    )
    stock = serializers.IntegerField(
        min_value=0,
        required=False,
        default=10,
        write_only=True,
    )
    sku = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
        write_only=True,
    )
    color = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True,
        default="",
        write_only=True,
    )
    size = serializers.CharField(
        max_length=30,
        required=False,
        allow_blank=True,
        default="",
        write_only=True,
    )
    is_active = serializers.BooleanField(required=False, default=True)
    image_file = serializers.FileField(required=False, write_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Product
        fields = (
            "name",
            "category_id",
            "description",
            "brand",
            "is_active",
            "is_featured",
            "display_order",
            "price",
            "stock",
            "sku",
            "color",
            "size",
            "image_file",
            "image_url",
        )

    def validate_category_id(self, value):
        try:
            return Category.objects.get(id=value)
        except Category.DoesNotExist:
            raise serializers.ValidationError("Selected category does not exist.")

    def validate_price(self, value):
        if value <= Decimal("0.00"):
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_sku(self, value):
        if not value:
            return value
        sku_val = value.strip().upper()
        # On update, allow current product's variants to keep their SKU
        qs = ProductVariant.objects.filter(sku=sku_val)
        if self.instance:
            qs = qs.exclude(product=self.instance)
        if qs.exists():
            raise serializers.ValidationError(f"SKU '{sku_val}' is already in use by another product variant.")
        return sku_val

    def create(self, validated_data):
        category = validated_data.pop("category_id")
        price = validated_data.pop("price")
        stock = validated_data.pop("stock", 10)
        sku = validated_data.pop("sku", None)
        color = validated_data.pop("color", "")
        size = validated_data.pop("size", "")
        image_file = validated_data.pop("image_file", None)
        image_url = validated_data.pop("image_url", None)

        with transaction.atomic():
            product = Product.objects.create(
                category=category,
                **validated_data,
            )

            if not sku:
                prefix = slugify(product.name)[:8].upper() or "PROD"
                sku = f"{prefix}-{uuid.uuid4().hex[:6].upper()}"

            ProductVariant.objects.create(
                product=product,
                name=f"{product.name} - Default",
                sku=sku,
                price=price,
                stock=stock,
                color=color,
                size=size,
                is_active=True,
            )

            if image_file:
                ProductMedia.objects.create(
                    product=product,
                    media_type="image",
                    file=image_file,
                    is_primary=True,
                    display_order=0,
                    alt_text=f"{product.name} Primary Image",
                )
            elif image_url and image_url.strip():
                ProductMedia.objects.create(
                    product=product,
                    media_type="image",
                    file=image_url.strip(),
                    is_primary=True,
                    display_order=0,
                    alt_text=f"{product.name} Primary Image",
                )

        return product

    def update(self, instance, validated_data):
        category = validated_data.pop("category_id", None)
        if category:
            instance.category = category

        price = validated_data.pop("price", None)
        stock = validated_data.pop("stock", None)
        sku = validated_data.pop("sku", None)
        color = validated_data.pop("color", None)
        size = validated_data.pop("size", None)
        image_file = validated_data.pop("image_file", None)
        image_url = validated_data.pop("image_url", None)

        with transaction.atomic():
            for attr, val in validated_data.items():
                setattr(instance, attr, val)
            instance.save()

            # Update or create primary variant if variant data supplied
            variant = instance.variants.first()
            if variant:
                if price is not None:
                    variant.price = price
                if stock is not None:
                    variant.stock = stock
                if sku:
                    variant.sku = sku
                if color is not None:
                    variant.color = color
                if size is not None:
                    variant.size = size
                variant.save()
            elif price is not None:
                # If product had no variants, create one now
                prefix = slugify(instance.name)[:8].upper() or "PROD"
                auto_sku = sku or f"{prefix}-{uuid.uuid4().hex[:6].upper()}"
                ProductVariant.objects.create(
                    product=instance,
                    name=f"{instance.name} - Default",
                    sku=auto_sku,
                    price=price,
                    stock=stock if stock is not None else 10,
                    color=color or "",
                    size=size or "",
                    is_active=True,
                )

            if image_file:
                # Mark previous media as non-primary
                instance.media.filter(is_primary=True).update(is_primary=False)
                ProductMedia.objects.create(
                    product=instance,
                    media_type="image",
                    file=image_file,
                    is_primary=True,
                    display_order=0,
                    alt_text=f"{instance.name} Primary Image",
                )
            elif image_url and image_url.strip():
                instance.media.filter(is_primary=True).update(is_primary=False)
                ProductMedia.objects.create(
                    product=instance,
                    media_type="image",
                    file=image_url.strip(),
                    is_primary=True,
                    display_order=0,
                    alt_text=f"{instance.name} Primary Image",
                )

        return instance


class AdminCategoryDetailSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "is_active",
            "display_order",
            "product_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "slug", "created_at", "updated_at")

    def get_product_count(self, obj):
        return obj.products.count()


class AdminInventoryVariantSerializer(serializers.ModelSerializer):
    product_id = serializers.UUIDField(source="product.id", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    available_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "product_id",
            "product_name",
            "name",
            "sku",
            "color",
            "size",
            "price",
            "stock",
            "reserved_stock",
            "available_stock",
            "is_active",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "product_id",
            "product_name",
            "sku",
            "reserved_stock",
            "available_stock",
            "updated_at",
        )


class AdminInventoryAdjustSerializer(serializers.Serializer):
    stock = serializers.IntegerField(required=True, min_value=0)
    reason = serializers.CharField(required=False, allow_blank=True, max_length=255)

