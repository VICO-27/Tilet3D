from rest_framework import serializers

from apps.orders.models import Order


# ==========================================================
# PAYMENT CREATION REQUEST VALIDATION
# ==========================================================
class PaymentCreateSerializer(serializers.Serializer):

    order_id = serializers.UUIDField()

    provider = serializers.ChoiceField(
        choices=[
            ("chapa", "Chapa"),
        ],
        default="chapa",
    )

    # ==========================================================
    # VALIDATE ORDER
    # ==========================================================
    def validate_order_id(self, value):

        # --------------------------------------------------
        # IMPROVED VALIDATION: Fetch, Verify existence, & Check Duplicates
        # --------------------------------------------------
        order = Order.objects.filter(id=value).first()

        if order is None:
            raise serializers.ValidationError("Order not found.")

        if hasattr(order, "payment"):
            raise serializers.ValidationError(
                "Payment already exists for this order."
            )

        # Returning the object passes the instance forward into validated_data
        return order