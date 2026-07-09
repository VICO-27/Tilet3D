from django.contrib import admin

# Register your models here.
from django.contrib import admin

from .models import Order, OrderItem


# ==========================================================
# ORDER ITEM INLINE
# ==========================================================
class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = (
        "product",
        "variant",
        "product_name",
        "variant_name",
        "sku",
        "color",
        "size",
        "price",
        "quantity",
        "subtotal",
    )

    can_delete = False


# ==========================================================
# ORDER ADMIN
# ==========================================================
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):

    list_display = (
        "order_number",
        "user",
        "status",
        "payment_status",
        "total",
        "created_at",
    )

    list_filter = (
        "status",
        "payment_status",
        "created_at",
    )

    search_fields = (
        "order_number",
        "user__email",
        "full_name",
        "phone",
    )

    ordering = (
        "-created_at",
    )

    readonly_fields = (
        "order_number",
        "subtotal",
        "shipping_fee",
        "tax",
        "discount",
        "total",
        "created_at",
        "updated_at",
    )

    inlines = [
        OrderItemInline,
    ]

    autocomplete_fields = (
    "user",
)


# ==========================================================
# ORDER ITEM ADMIN
# ==========================================================
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "order",
        "product_name",
        "variant_name",
        "quantity",
        "price",
        "subtotal",
    )

    search_fields = (
        "order__order_number",
        "product_name",
        "sku",
    )

    readonly_fields = (
        "order",
        "product",
        "variant",
        "product_name",
        "variant_name",
        "sku",
        "color",
        "size",
        "price",
        "quantity",
        "subtotal",
        "created_at",
        "updated_at",
    )