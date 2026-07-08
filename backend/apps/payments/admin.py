from django.contrib import admin
from .models import Payment


# ==========================================================
# PAYMENT ADMIN PANEL (FOR DEBUGGING + MONITORING)
# ==========================================================
@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "order", "amount", "status", "provider")
    list_filter = ("status", "provider")
    search_fields = ("id", "transaction_id", "user__email")