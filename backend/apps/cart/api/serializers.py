from rest_framework import serializers

from apps.cart.models import Cart, CartItem
from apps.products.models import ProductVariant


# ==========================================================
# PRODUCT INFO
# ==========================================================
class ProductInfoSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="variant.product.id")
    name = serializers.CharField(source="variant.product.name")
    slug = serializers.CharField(source="variant.product.slug")


# ==========================================================
# VARIANT INFO
# ==========================================================
class VariantInfoSerializer(serializers.Serializer):
    id = serializers.UUIDField(source="variant.id")
    name = serializers.CharField(source="variant.name")
    sku = serializers.CharField(source="variant.sku")
    color = serializers.CharField(source="variant.color")
    size = serializers.CharField(source="variant.size")

    price = serializers.DecimalField(
        source="variant.price",
        max_digits=10,
        decimal_places=2,
    )

    stock = serializers.IntegerField(source="variant.stock")


# ==========================================================
# CART ITEM
# ==========================================================
class CartItemSerializer(serializers.ModelSerializer):

    product = ProductInfoSerializer(source="*")
    variant = VariantInfoSerializer(source="*")

    image = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "quantity",
            "subtotal",
            "product",
            "variant",
            "image",
        ]

    def get_image(self, obj):
        media = obj.variant.media.filter(is_primary=True).first()

        if not media:
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(media.file.url)

        return media.file.url

    def get_subtotal(self, obj):
        return obj.quantity * obj.variant.price


# ==========================================================
# CART
# ==========================================================
class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    total_items = serializers.SerializerMethodField()
    unique_items = serializers.SerializerMethodField()

    subtotal = serializers.SerializerMethodField()
    shipping = serializers.SerializerMethodField()
    tax = serializers.SerializerMethodField()
    discount = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "total_items",
            "unique_items",
            "subtotal",
            "shipping",
            "tax",
            "discount",
            "grand_total",
            "items",
        ]

    def get_total_items(self, obj):
        return sum(item.quantity for item in obj.items.all())

    def get_unique_items(self, obj):
        return obj.items.count()

    def get_subtotal(self, obj):
        return sum(
            item.quantity * item.variant.price
            for item in obj.items.all()
        )

    def get_shipping(self, obj):
        return 0

    def get_tax(self, obj):
        return 0

    def get_discount(self, obj):
        return 0

    def get_grand_total(self, obj):
        return (
            self.get_subtotal(obj)
            + self.get_shipping(obj)
            + self.get_tax(obj)
            - self.get_discount(obj)
        )


# ==========================================================
# ADD TO CART
# ==========================================================
class AddToCartSerializer(serializers.Serializer):

    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)

    def validate_variant_id(self, value):
        try:
            variant = ProductVariant.objects.get(id=value)
        except ProductVariant.DoesNotExist:
            raise serializers.ValidationError(
                "Product variant not found."
            )

        if not variant.is_active:
            raise serializers.ValidationError(
                "This product variant is unavailable."
            )

        return value

    def validate(self, attrs):
        variant = ProductVariant.objects.get(
            id=attrs["variant_id"]
        )

        quantity = attrs["quantity"]

        if quantity > variant.stock:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"Only {variant.stock} item(s) are available."
                    )
                }
            )

        attrs["variant"] = variant
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user

        cart, _ = Cart.objects.get_or_create(user=user)

        variant = self.validated_data["variant"]
        quantity = self.validated_data["quantity"]

        item, created = CartItem.objects.get_or_create(
            cart=cart,
            variant=variant,
            defaults={"quantity": quantity},
        )

        if not created:

            new_quantity = item.quantity + quantity

            if new_quantity > variant.stock:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            f"Only {variant.stock} item(s) are available."
                        )
                    }
                )

            item.quantity = new_quantity
            item.save()

        return item


# ==========================================================
# UPDATE CART ITEM
# ==========================================================
class UpdateCartItemSerializer(serializers.Serializer):

    quantity = serializers.IntegerField(min_value=0)

    def validate(self, attrs):

        item = self.context["item"]

        quantity = attrs["quantity"]

        if quantity > item.variant.stock:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"Only {item.variant.stock} item(s) are available."
                    )
                }
            )

        return attrs

    def save(self, **kwargs):

        item = self.context["item"]

        quantity = self.validated_data["quantity"]

        if quantity == 0:
            item.delete()
            return None

        item.quantity = quantity
        item.save()

        return item