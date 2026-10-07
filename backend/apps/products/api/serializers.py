# backend/apps/products/api/serializers.py
from rest_framework import serializers

from apps.products.models import (
    Product,
    ProductVariant,
    ProductMedia,
    ProductLike,
    ProductComment,
    ProductShare,
)


class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = (
            "id",
            "media_type",
            "file",
            "is_primary",
            "display_order",
        )


class ProductVariantSerializer(serializers.ModelSerializer):
    available_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "name",
            "sku",
            "color",
            "size",
            "price",
            "default_variant_id",
            "available_stock",
            "measurements",
        )



class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    default_variant_id = serializers.SerializerMethodField()
    
    def get_default_variant_id(self, obj):
        return getattr(obj, 'default_variant_id_annotated', None)

    
    def get_price(self, obj):
        annotated = getattr(obj, "min_price", None)
        if annotated is not None:
            return annotated
        first_variant = obj.variants.first()
        return first_variant.price if first_variant else 0

    
    like_count = serializers.IntegerField(source="like_count_annotated", read_only=True, default=0)
    comment_count = serializers.IntegerField(source="comment_count_annotated", read_only=True, default=0)
    
    # We will use an Exists subquery for is_liked and is_saved
    is_liked = serializers.BooleanField(source="is_liked_annotated", read_only=True, default=False)
    is_saved = serializers.BooleanField(source="is_saved_annotated", read_only=True, default=False)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "is_featured",
            "category_name",
            "price",
            "default_variant_id",
            "media",
            "like_count",
            "comment_count",
            "is_liked",
            "is_saved",
        )


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    media = ProductMediaSerializer(many=True, read_only=True)
    price = serializers.SerializerMethodField()
    default_variant_id = serializers.SerializerMethodField()
    
    def get_default_variant_id(self, obj):
        return getattr(obj, 'default_variant_id_annotated', None)

    
    def get_price(self, obj):
        annotated = getattr(obj, "min_price", None)
        if annotated is not None:
            return annotated
        first_variant = obj.variants.first()
        return first_variant.price if first_variant else 0

    variants = ProductVariantSerializer(many=True, read_only=True)

    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "brand",
            "is_featured",
            "category_name",
            "media",
            "variants",
            "like_count",
            "comment_count",
            "is_liked",
            "is_saved",
        )

    def get_like_count(self, obj):
        # FIX: use the DB-side annotation from ProductListAPIView when
        # present. Falls back to the old prefetch-based count for views
        # that don't annotate (detail view, liked-products view) — those
        # keep working exactly as before.
        annotated = getattr(obj, "like_count_annotated", None)
        if annotated is not None:
            return annotated
        return len(obj.likes.all())

    def get_comment_count(self, obj):
        annotated = getattr(obj, "comment_count_annotated", None)
        if annotated is not None:
            return annotated
        return len(obj.comments.all())

    def get_is_liked(self, obj):
        annotated = getattr(obj, "is_liked_annotated", None)
        if annotated is not None:
            return annotated

        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        return any(
            like.user_id == request.user.id
            for like in obj.likes.all()
        )

    def get_is_saved(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        # If prefetched
        if hasattr(obj, 'bookmarks'):
            return any(
                bookmark.user_id == request.user.id
                for bookmark in obj.bookmarks.all()
            )
        
        # Fallback to DB query
        from apps.products.models import ProductBookmark
        return ProductBookmark.objects.filter(product=obj, user=request.user).exists()


class ProductLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductLike
        fields = (
            "id",
            "product",
            "created_at",
        )


class ProductCommentSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ProductComment
        fields = (
            "id",
            "product",
            "user",
            "user_email",
            "text",
            "created_at",
        )
        read_only_fields = ("user",)


class ProductShareSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductShare
        fields = (
            "id",
            "product",
            "platform",
            "created_at",
        )