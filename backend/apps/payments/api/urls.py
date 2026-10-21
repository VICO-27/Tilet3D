from django.urls import path
from .views import CreatePaymentView, PaymentWebhookView, VerifyPaymentView


# ==========================================================
# PAYMENT ROUTES
# ==========================================================
urlpatterns = [
    path("create/", CreatePaymentView.as_view(), name="create-payment"),
    path("verify/", VerifyPaymentView.as_view(), name="verify-payment"),
    path("webhook/", PaymentWebhookView.as_view(), name="payment-webhook"),
]