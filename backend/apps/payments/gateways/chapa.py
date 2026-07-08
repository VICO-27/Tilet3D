# ==========================================================
# CHAPA PAYMENT GATEWAY (CLEAN VERSION)
# ==========================================================
#
# Responsibility:
# - ONLY communicate with Chapa API
# - NO database operations
# - NO business logic
#
# ==========================================================

import requests
from django.conf import settings
from .base import BaseGateway


class ChapaGateway(BaseGateway):

    BASE_URL = "https://api.chapa.co/v1/transaction/initialize"

    def create_payment(self, payment):
        """
        Initializes payment on Chapa and returns response data.
        DOES NOT modify database.
        """

        payload = {
            "amount": str(payment.amount),
            "currency": payment.currency,
            "email": payment.user.email,
            "tx_ref": str(payment.id),

            # should be configurable in production
            "callback_url": getattr(
                settings,
                "CHAPA_CALLBACK_URL",
                "http://localhost:8000/api/payments/webhook/"
            ),
        }

        headers = {
            "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            self.BASE_URL,
            json=payload,
            headers=headers,
            timeout=15
        )

        data = response.json()

        if response.status_code != 200:
            raise Exception(f"Chapa HTTP Error: {data}")

        if "data" not in data:
            raise Exception(f"Invalid Chapa response: {data}")

        return {
            "checkout_url": data["data"]["checkout_url"],
            "transaction_id": data["data"]["tx_ref"],
            "raw": data
        }