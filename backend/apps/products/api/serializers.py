from rest_framework import serializers
from apps.products.models import Product, ProductComment, ProductLike, ProductShare, ProductVariant, ProductMedia, Cart, CartItem


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

    like_count = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_liked = serializers.SerializerMethodField()

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
            "like_count",
            "comment_count",
            "is_liked",
        ]

    # -------------------------
    # 🔥 METHODS MUST GO HERE
    # -------------------------

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_comment_count(self, obj):
        return obj.comments.count()

    def get_is_liked(self, obj):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            return False

        return obj.likes.filter(user=request.user).exists()

class CartItemSerializer(serializers.ModelSerializer):
    variant_name = serializers.CharField(source="variant.name", read_only=True)
    price = serializers.DecimalField(source="variant.price", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id",
            "variant",
            "variant_name",
            "quantity",
            "price",
        ]

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total_price",
        ]

    def get_total_price(self, obj):
        return sum(
            item.quantity * item.variant.price
            for item in obj.items.all()
        )

class ProductLikeSerializer(serializers.ModelSerializer):
    """
    Serializes product likes (wishlist behavior).
    """

    class Meta:
        model = ProductLike
        fields = [
            "id",
            "product",
            "created_at",
        ]
    
    


class ProductCommentSerializer(serializers.ModelSerializer):
    """
    Product comments for UI display.
    """

    user_email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = ProductComment
        fields = [
            "id",
            "product",
            "user",
            "user_email",
            "text",
            "created_at",
        ]
        read_only_fields = ["user"]
    




class ProductShareSerializer(serializers.ModelSerializer):
    """
    Tracks product sharing events.
    """

    class Meta:
        model = ProductShare
        fields = [
            "id",
            "product",
            "platform",
            "created_at",
        ]