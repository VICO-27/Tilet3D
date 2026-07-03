from django.contrib import admin
from .models import Category, Product, ProductVariant, ProductMedia


# -------------------------
# CATEGORY ADMIN
# -------------------------
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin configuration for Category.
    """

    list_display = (
        "name",
        "parent",
        "is_active",
        "display_order",
        "created_at",
    )

    list_filter = (
        "is_active",
        "parent",
    )

    search_fields = (
        "name",
        "description",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = (
        "display_order",
        "name",
    )


# -------------------------
# PRODUCT ADMIN
# -------------------------
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Admin configuration for Product.
    """

    list_display = (
        "name",
        "category",
        "brand",
        "is_active",
        "is_featured",
        "created_at",
    )

    list_filter = (
        "is_active",
        "is_featured",
        "category",
    )

    search_fields = (
        "name",
        "description",
        "brand",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }


# -------------------------
# PRODUCT VARIANT ADMIN
# -------------------------
@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """
    Admin configuration for Product Variants.
    """

    list_display = (
        "name",
        "product",
        "price",
        "stock",
        "is_active",
    )

    list_filter = (
        "is_active",
        "product",
    )

    search_fields = (
        "name",
        "sku",
        "color",
        "size",
    )


# -------------------------
# PRODUCT MEDIA ADMIN
# -------------------------
@admin.register(ProductMedia)
class ProductMediaAdmin(admin.ModelAdmin):
    """
    Admin configuration for Product Media.
    """

    list_display = (
        "variant",
        "media_type",
        "is_primary",
        "display_order",
    )

    list_filter = (
        "media_type",
        "is_primary",
    )