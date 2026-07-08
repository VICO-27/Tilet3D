from rest_framework import serializers
from apps.orders.models import Order


# ==========================================================
# PAYMENT CREATION REQUEST VALIDATION
# ==========================================================
class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    provider = serializers.CharField(default="chapa")

    def validate_order_id(self, value):
        try:
            Order.objects.get(id=value)
        except Order.DoesNotExist:
            raise serializers.ValidationError("Order not found")
        return value