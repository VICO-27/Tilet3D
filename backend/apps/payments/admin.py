from django.contrib import admin
from .models import Payment


# ==========================================================
# PAYMENT ADMIN PANEL (FOR DEBUGGING + MONITORING)
# ==========================================================
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
    "id",
    "order",
    "user",
    "provider",
    "status",
    "amount",
    "transaction_id",
    "created_at",
)
    list_filter = ("status", "provider")
    search_fields = ("id", "transaction_id", "user__email")

    readonly_fields = (
    "transaction_id",
    "checkout_url",
    "webhook_received",
    "webhook_payload",
    "created_at",
    "updated_at",
)
    

    autocomplete_fields = (
    "user",
    "order",
)