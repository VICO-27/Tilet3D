from django.contrib import admin
from .models import Category, Product


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



@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
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