from rest_framework import serializers

from apps.products.models import (
    Product,
    ProductVariant,
    ProductMedia,
    ProductLike,
    ProductComment,
    ProductShare,
)


# ==========================================================
# PRODUCT MEDIA SERIALIZER
# ==========================================================
class ProductMediaSerializer(serializers.ModelSerializer):
    """
    Serializes images/videos belonging to a product variant.
    """

    class Meta:
        model = ProductMedia
        fields = (
            "id",
            "media_type",
            "file",
            "is_primary",
            "display_order",
        )


# ==========================================================
# PRODUCT VARIANT SERIALIZER
# ==========================================================
class ProductVariantSerializer(serializers.ModelSerializer):

    available_stock = serializers.IntegerField(
        read_only=True
    )


    class Meta:

        model = ProductVariant

        fields = (
            "id",
            "name",
            "sku",
            "color",
            "size",
            "price",
            "available_stock",
            "measurements",
        )
# ==========================================================
# PRODUCT SERIALIZER
# ==========================================================
class ProductSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    media = ProductMediaSerializer(
        many=True,
        read_only=True
    )

    variants = ProductVariantSerializer(
        many=True,
        read_only=True
    )

    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()


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
        )


    def get_like_count(self,obj):
        return len(obj.likes.all())


    def get_comment_count(self,obj):
        return len(obj.comments.all())


    def get_is_liked(self,obj):

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return any(
            like.user_id == request.user.id
            for like in obj.likes.all()
        )

# ==========================================================
# PRODUCT LIKE SERIALIZER
# ==========================================================
class ProductLikeSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductLike
        fields = (
            "id",
            "product",
            "created_at",
        )


# ==========================================================
# PRODUCT COMMENT SERIALIZER
# ==========================================================
class ProductCommentSerializer(serializers.ModelSerializer):

    user_email = serializers.CharField(
        source="user.email",
        read_only=True,
    )

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

        read_only_fields = (
            "user",
        )


# ==========================================================
# PRODUCT SHARE SERIALIZER
# ==========================================================
class ProductShareSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductShare
        fields = (
            "id",
            "product",
            "platform",
            "created_at",
        )