import uuid
from django.db import models
from django.conf import settings
from apps.orders.models import Order


# ==========================================================
# PAYMENT STATUS (STATE MACHINE)
# ==========================================================
class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    INITIATED = "initiated", "Initiated"
    SUCCESS = "success", "Success"
    FAILED = "failed", "Failed"
    CANCELLED = "cancelled", "Cancelled"
    REFUNDED = "refunded", "Refunded"


# ==========================================================
# PAYMENT MODEL (SOURCE OF TRUTH FOR MONEY FLOW)
# ==========================================================
class Payment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name="payment")

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="ETB")

    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING
    )

    provider = models.CharField(max_length=50)  # chapa, stripe

    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    checkout_url = models.URLField(null=True, blank=True)

    # ==========================================================
    # WEBHOOK / DEBUGGING SUPPORT (IMPORTANT FOR REAL SYSTEMS)
    # ==========================================================
    webhook_received = models.BooleanField(default=False)
    webhook_payload = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment({self.id}) - {self.status}"