# ==========================================================
# CHAPA PAYMENT GATEWAY
# ==========================================================

import json
import requests

from django.conf import settings

from .base import BaseGateway


class ChapaGateway(BaseGateway):

    BASE_URL = "https://api.chapa.co/v1/transaction/initialize"

    def create_payment(self, payment):

        payload = {
            "amount": str(payment.amount),
            "currency": payment.currency,
            "email": payment.user.email,
            "tx_ref": str(payment.id),

            "callback_url": getattr(
                settings,
                "CHAPA_CALLBACK_URL",
                "http://localhost:8000/api/payments/webhook/",
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
            timeout=15,
        )

        data = response.json()

        # ======================================================
        # DEBUG (TEMPORARY)
        # ======================================================
        print("\n" + "=" * 80)
        print("CHAPA RESPONSE")
        print(json.dumps(data, indent=4))
        print("=" * 80 + "\n")

        if response.status_code != 200:
            raise Exception(f"Chapa HTTP Error: {data}")

        if "data" not in data:
            raise Exception(f"Invalid Chapa response: {data}")

        checkout_url = data["data"].get("checkout_url")

        # Some Chapa responses don't return tx_ref,
        # so fall back to our own payment id.
        transaction_id = data["data"].get(
            "tx_ref",
            str(payment.id),
        )

        return {
            "checkout_url": checkout_url,
            "transaction_id": transaction_id,
            "raw": data,
        }