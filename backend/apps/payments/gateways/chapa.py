# ==========================================================
# CHAPA PAYMENT GATEWAY
# ==========================================================

import json
import requests
from django.conf import settings
from .base import BaseGateway

class ChapaGateway(BaseGateway):

    BASE_URL = "https://api.chapa.co/v1/transaction/initialize"
    VERIFY_URL = "https://api.chapa.co/v1/transaction/verify/{}"

    def create_payment(self, payment):
        payload = {
            "amount": str(payment.amount),
            "currency": payment.currency,
            "email": payment.user.email,
            "tx_ref": str(payment.id),
            
            # Where Chapa sends the server-to-server confirmation behind the scenes
            "callback_url": getattr(
                settings,
                "CHAPA_CALLBACK_URL",
                "http://localhost:8000/api/payments/webhook/",
            ),
            
            # Where Chapa redirects the user's browser after they pay
            "return_url": getattr(
                settings,
                "CHAPA_RETURN_URL",
                f"http://localhost:3000/checkout/success?order_id={payment.order.id}" 
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

        if response.status_code != 200:
            raise Exception(f"Chapa HTTP Error: {data}")

        if "data" not in data:
            raise Exception(f"Invalid Chapa response: {data}")

        checkout_url = data["data"].get("checkout_url")
        transaction_id = data["data"].get("tx_ref", str(payment.id))

        return {
            "checkout_url": checkout_url,
            "transaction_id": transaction_id,
            "raw": data,
        }

    def verify_payment(self, tx_ref: str) -> bool:
        """
        Calls Chapa to verify if a transaction was actually successful.
        This prevents users from spoofing the webhook.
        """
        headers = {
            "Authorization": f"Bearer {settings.CHAPA_SECRET_KEY}",
        }
        
        response = requests.get(
            self.VERIFY_URL.format(tx_ref), 
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            # Chapa returns status: "success" in the data object if paid
            if data.get("status") == "success" or data.get("data", {}).get("status") == "success":
                return True
                
        return False