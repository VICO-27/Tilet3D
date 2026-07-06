from rest_framework import serializers

from apps.orders.models import Order, OrderItem


# ==========================================================
# ORDER ITEM
# ==========================================================
class OrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_name",
            "variant_name",
            "sku",
            "color",
            "size",
            "price",
            "quantity",
            "subtotal",
        ]


# ==========================================================
# ORDER LIST
# ==========================================================
class OrderListSerializer(serializers.ModelSerializer):

    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "total",
            "item_count",
            "created_at",
        ]

    def get_item_count(self, obj):
        return obj.items.count()


# ==========================================================
# ORDER DETAIL
# ==========================================================
class OrderDetailSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "subtotal",
            "shipping_fee",
            "tax",
            "discount",
            "total",
            "full_name",
            "phone",
            "region",
            "city",
            "sub_city",
            "woreda",
            "house_no",
            "postal_code",
            "note",
            "items",
            "created_at",
        ]


# ==========================================================
# CHECKOUT
# ==========================================================
class CheckoutSerializer(serializers.Serializer):

    full_name = serializers.CharField(max_length=200)

    phone = serializers.CharField(max_length=30)

    region = serializers.CharField(max_length=100)

    city = serializers.CharField(max_length=100)

    sub_city = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    woreda = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    house_no = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True,
    )

    postal_code = serializers.CharField(
        max_length=30,
        required=False,
        allow_blank=True,
    )

    note = serializers.CharField(
        required=False,
        allow_blank=True,
    )