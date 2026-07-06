from django.contrib import admin

from .models import (
    Category,
    Product,
    ProductVariant,
    ProductMedia,
    ProductLike,
    ProductComment,
    ProductShare,
)


# ==========================================================
# CATEGORY ADMIN
# ==========================================================
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """
    Admin configuration for product categories.
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


# ==========================================================
# PRODUCT ADMIN
# ==========================================================
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """
    Admin configuration for parent products.
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
        "category",
        "is_active",
        "is_featured",
    )

    search_fields = (
        "name",
        "brand",
        "description",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = (
        "-created_at",
    )


# ==========================================================
# PRODUCT VARIANT ADMIN
# ==========================================================
@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    """
    Admin configuration for purchasable product variants.
    """

    list_display = (
        "name",
        "product",
        "color",
        "size",
        "price",
        "stock",
        "is_active",
    )

    list_filter = (
        "product",
        "color",
        "size",
        "is_active",
    )

    search_fields = (
        "name",
        "sku",
        "product__name",
    )

    ordering = (
        "product",
        "price",
    )


# ==========================================================
# PRODUCT MEDIA ADMIN
# ==========================================================
@admin.register(ProductMedia)
class ProductMediaAdmin(admin.ModelAdmin):
    """
    Admin configuration for product media.
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

    search_fields = (
        "variant__name",
    )

    ordering = (
        "variant",
        "display_order",
    )


# ==========================================================
# PRODUCT LIKE ADMIN
# ==========================================================
@admin.register(ProductLike)
class ProductLikeAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "product",
        "created_at",
    )

    search_fields = (
        "user__email",
        "product__name",
    )

    autocomplete_fields = (
        "user",
        "product",
    )


# ==========================================================
# PRODUCT COMMENT ADMIN
# ==========================================================
@admin.register(ProductComment)
class ProductCommentAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "product",
        "created_at",
    )

    search_fields = (
        "user__email",
        "product__name",
        "text",
    )

    autocomplete_fields = (
        "user",
        "product",
    )


# ==========================================================
# PRODUCT SHARE ADMIN
# ==========================================================
@admin.register(ProductShare)
class ProductShareAdmin(admin.ModelAdmin):

    list_display = (
        "user",
        "product",
        "platform",
        "created_at",
    )

    list_filter = (
        "platform",
    )

    search_fields = (
        "user__email",
        "product__name",
    )

    autocomplete_fields = (
        "user",
        "product",
    )