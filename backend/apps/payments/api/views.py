# ==========================================================
# PAYMENTS API
# ==========================================================

from django.db import transaction

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.orders.models import Order

from .serializers import PaymentCreateSerializer

from ..gateway_factory import GatewayFactory
from ..models import Payment
from ..services import PaymentService
from ..models import PaymentStatus


# ==========================================================
# CREATE PAYMENT
# ==========================================================

class CreatePaymentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = PaymentCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        order = Order.objects.get(
            id=serializer.validated_data["order_id"]
        )

        provider = serializer.validated_data.get(
            "provider",
            "chapa",
        )

        payment = PaymentService.create_payment(
            order=order,
            user=request.user,
            provider=provider,
        )

        gateway = GatewayFactory.get_gateway(provider)

        gateway_response = gateway.create_payment(payment)

        payment.checkout_url = gateway_response["checkout_url"]
        payment.transaction_id = gateway_response["transaction_id"]

        payment.save(
            update_fields=[
                "checkout_url",
                "transaction_id",
            ]
        )

        return Response(
            {
                "payment_id": str(payment.id),
                "checkout_url": payment.checkout_url,
            },
            status=status.HTTP_201_CREATED,
        )


# ==========================================================
# PAYMENT WEBHOOK
# ==========================================================

class PaymentWebhookView(APIView):

    authentication_classes = []
    permission_classes = []

    @transaction.atomic
    def post(self, request):

        payload = request.data

        tx_ref = payload.get("tx_ref")
        gateway_status = payload.get("status")

        if not tx_ref:
            return Response(
                {
                    "error": "Missing tx_ref"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:

            payment = (
                Payment.objects
                .select_related("order")
                .get(id=tx_ref)
            )

        except Payment.DoesNotExist:

            return Response(
                {
                    "error": "Payment not found"
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ======================================================
        # IDEMPOTENCY
        # ======================================================

        if payment.status == PaymentStatus.SUCCESS:

            return Response(
                {
                    "message": "Already processed"
                },
                status=status.HTTP_200_OK,
            )

        payment.webhook_received = True
        payment.webhook_payload = payload

        payment.save(
            update_fields=[
                "webhook_received",
                "webhook_payload",
            ]
        )

        if gateway_status == "success":
            PaymentService.mark_success(payment)
        else:
            PaymentService.mark_failed(payment)

        return Response(
            {
                "message": "Webhook processed"
            },
            status=status.HTTP_200_OK,
        )