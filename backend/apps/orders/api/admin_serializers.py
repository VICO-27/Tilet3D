from rest_framework import serializers
from apps.orders.models import Order, OrderItem, OrderStatus
from apps.orders.services.lifecycle import OrderLifecycle


class AdminOrderItemSerializer(serializers.ModelSerializer):
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


class AdminOrderListSerializer(serializers.ModelSerializer):
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    item_count = serializers.SerializerMethodField()
    allowed_transitions = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "total",
            "subtotal",
            "shipping_fee",
            "full_name",
            "customer_email",
            "item_count",
            "allowed_transitions",
            "created_at",
            "updated_at",
        ]

    def get_item_count(self, obj):
        if hasattr(obj, "items_count"):
            return obj.items_count
        return obj.items.count()

    def get_allowed_transitions(self, obj):
        return OrderLifecycle.ALLOWED_TRANSITIONS.get(obj.status, [])


class AdminOrderDetailSerializer(serializers.ModelSerializer):
    items = AdminOrderItemSerializer(many=True, read_only=True)
    customer_email = serializers.EmailField(source="user.email", read_only=True)
    customer_id = serializers.CharField(source="user.id", read_only=True)
    payment = serializers.SerializerMethodField()
    allowed_transitions = serializers.SerializerMethodField()

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
            "customer_id",
            "customer_email",
            "full_name",
            "phone",
            "region",
            "city",
            "sub_city",
            "woreda",
            "house_no",
            "postal_code",
            "note",
            "avatar_snapshot",
            "items",
            "payment",
            "allowed_transitions",
            "created_at",
            "updated_at",
        ]

    def get_payment(self, obj):
        if hasattr(obj, "payment") and obj.payment:
            p = obj.payment
            return {
                "id": str(p.id),
                "status": p.status,
                "provider": p.provider,
                "amount": str(p.amount),
                "currency": p.currency,
                "transaction_id": p.transaction_id,
                "checkout_url": p.checkout_url,
                "created_at": p.created_at,
            }
        return None

    def get_allowed_transitions(self, obj):
        return OrderLifecycle.ALLOWED_TRANSITIONS.get(obj.status, [])


class AdminOrderTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices, required=True)
