# ==========================================================
# PAYMENTS API LAYER
# ==========================================================
#
# Responsibilities:
# - Trigger payment initialization via CheckoutService flow
# - Handle webhook updates from Chapa
# - NEVER contain business logic
#
# ==========================================================

from django.db import transaction

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import PaymentCreateSerializer
from ..models import Payment
from ..services import PaymentService
from ..gateways.chapa import ChapaGateway
from ..gateway_factory import GatewayFactory


# ==========================================================
# CREATE PAYMENT (LEGACY / DIRECT ENTRY POINT)
# ==========================================================
class CreatePaymentView(APIView):

    def post(self, request):
        """
        NOTE:
        In modern flow, checkout endpoint should be used.
        This endpoint exists for flexibility / testing.
        """

        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order = serializer.validated_data["order_id"]
        provider = serializer.validated_data.get("provider", "chapa")

        # Create DB payment safely
        payment = PaymentService.create_payment(
            order=order,
            user=request.user,
            provider=provider
        )

        # Initialize gateway
        gateway = GatewayFactory.get_gateway(provider)
        gateway_response = gateway.create_payment(payment)

        # Save gateway response
        payment.checkout_url = gateway_response["checkout_url"]
        payment.transaction_id = gateway_response["transaction_id"]
        payment.save(update_fields=["checkout_url", "transaction_id"])

        return Response(
            {
                "payment_id": str(payment.id),
                "checkout_url": payment.checkout_url
            },
            status=status.HTTP_201_CREATED
        )


# ==========================================================
# WEBHOOK HANDLER (CHAPA CALLBACK)
# ==========================================================
class PaymentWebhookView(APIView):

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        """
        Handles asynchronous payment confirmation from Chapa
        """

        payload = request.data
        tx_ref = payload.get("tx_ref")
        status_str = payload.get("status")

        if not tx_ref:
            return Response(
                {"error": "Missing tx_ref"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            payment = Payment.objects.select_related("order").get(id=tx_ref)
        except Payment.DoesNotExist:
            return Response(
                {"error": "Payment not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ==================================================
        # IDEMPOTENCY PROTECTION
        # ==================================================
        if payment.status == "success":
            return Response(
                {"message": "Already processed"},
                status=status.HTTP_200_OK
            )

        with transaction.atomic():

            payment.webhook_received = True
            payment.webhook_payload = payload

            if status_str == "success":
                PaymentService.mark_success(payment)
            else:
                PaymentService.mark_failed(payment)

        return Response(
            {"message": "Webhook processed"},
            status=status.HTTP_200_OK
        )