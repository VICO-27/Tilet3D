from django.contrib import admin

from .models import Cart, CartItem


# ==========================================================
# CART ITEM INLINE
# ==========================================================
class CartItemInline(admin.TabularInline):
    """
    Display cart items directly inside the Cart admin page.
    """

    model = CartItem
    extra = 0


# ==========================================================
# CART ADMIN
# ==========================================================
@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    """
    Admin configuration for shopping carts.
    """

    list_display = (
        "user",
        "is_active",
        "created_at",
    )

    list_filter = (
        "is_active",
    )

    search_fields = (
        "user__email",
    )

    autocomplete_fields = (
        "user",
    )

    inlines = [
        CartItemInline,
    ]


# ==========================================================
# CART ITEM ADMIN
# ==========================================================
@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    """
    Admin configuration for cart items.
    """

    list_display = (
        "cart",
        "variant",
        "quantity",
        "created_at",
    )

    search_fields = (
        "cart__user__email",
        "variant__name",
        "variant__sku",
    )

    autocomplete_fields = (
        "cart",
        "variant",
    )