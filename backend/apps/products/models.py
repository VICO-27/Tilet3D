from django.db import models
from django.utils.text import slugify

from common.models import BaseModel
from common.utils import generate_unique_slug

class Category(BaseModel):
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique category name."
    )

    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        help_text="SEO-friendly URL slug. Automatically generated if left blank."
    )

    description = models.TextField(
        blank=True,
        help_text="Short description of the category."
    )

    image = models.ImageField(
        upload_to="categories/images/",
        blank=True,
        null=True,
        help_text="Thumbnail image displayed for the category."
    )

    banner = models.ImageField(
        upload_to="categories/banners/",
        blank=True,
        null=True,
        help_text="Optional banner image shown on the category page."
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="children",
        blank=True,
        null=True,
        help_text="Parent category for nested categories."
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Controls whether this category is visible to customers."
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Controls the display order in the frontend."
    )

    class Meta:
        ordering = ["display_order", "name"]
        verbose_name = "Category"
        verbose_name_plural = "Categories"

    def save(self, *args, **kwargs):
   
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        """
        Human-readable representation.
        """
        return self.name




class Product(BaseModel):
  
    category = models.ForeignKey(
        "products.Category",
        on_delete=models.PROTECT,
        related_name="products",
        help_text="Category this product belongs to."
    )

    name = models.CharField(
        max_length=150,
        help_text="Product name."
    )

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True,
        help_text="SEO-friendly URL slug."
    )

    description = models.TextField(
        blank=True,
        help_text="Detailed product description."
    )

    brand = models.CharField(
        max_length=120,
        blank=True,
        help_text="Brand or artisan name."
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Controls visibility on frontend."
    )

    is_featured = models.BooleanField(
        default=False,
        help_text="Featured products shown on homepage."
    )

    created_at = models.DateTimeField(auto_now_add=True)  # keep explicit for clarity
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def save(self, *args, **kwargs):
        """
        Auto-generate unique slug if not provided.
        """
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name