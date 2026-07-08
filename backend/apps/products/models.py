from django.db import models
from django.conf import settings

from common.models import BaseModel
from common.utils import generate_unique_slug


class Category(BaseModel):
    """
    Product category.
    Supports nested categories.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique category name."
    )

    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        help_text="SEO-friendly URL slug."
    )

    description = models.TextField(
        blank=True,
        help_text="Short category description."
    )

    image = models.ImageField(
        upload_to="categories/images/",
        blank=True,
        null=True,
        help_text="Category thumbnail."
    )

    banner = models.ImageField(
        upload_to="categories/banners/",
        blank=True,
        null=True,
        help_text="Category banner."
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="children",
        blank=True,
        null=True,
        help_text="Parent category."
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Visible to customers."
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Frontend ordering."
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
        return self.name


class Product(BaseModel):
    """
    Parent product.
    """

    category = models.ForeignKey(
        "products.Category",
        on_delete=models.PROTECT,
        related_name="products"
    )

    name = models.CharField(max_length=150)

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True
    )

    description = models.TextField(blank=True)

    brand = models.CharField(
        max_length=120,
        blank=True
    )

    is_active = models.BooleanField(default=True)

    is_featured = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductVariant(BaseModel):
    """
    Purchasable version of a product.
    """
    reserved_stock = models.PositiveIntegerField(default=0)

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="variants"
    )

    name = models.CharField(max_length=150)

    sku = models.CharField(
        max_length=100,
        unique=True
    )

    color = models.CharField(
        max_length=50,
        blank=True
    )

    size = models.CharField(
        max_length=30,
        blank=True
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    stock = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    measurements = models.JSONField(
        default=dict,
        blank=True,
        help_text="3D garment measurements."
    )

    class Meta:
        ordering = ["price"]
        verbose_name = "Product Variant"
        verbose_name_plural = "Product Variants"

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductMedia(BaseModel):
    """
    Images/videos belonging to a product variant.
    """

    MEDIA_TYPES = (
        ("image", "Image"),
        ("video", "Video"),
    )

    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="media"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES,
        default="image"
    )

    file = models.FileField(
        upload_to="products/media/"
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True
    )

    is_primary = models.BooleanField(default=False)

    display_order = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order"]
        verbose_name = "Product Media"
        verbose_name_plural = "Product Media"

    def __str__(self):
        return f"{self.variant.name} - {self.media_type}"


class ProductLike(BaseModel):
    """
    Wishlist / like.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_likes"
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="likes"
    )

    class Meta:
        unique_together = ("user", "product")

    def __str__(self):
        return f"{self.user.email} likes {self.product.name}"


class ProductComment(BaseModel):
    """
    Product comments.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_comments"
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="comments"
    )

    text = models.TextField()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email}: {self.text[:30]}"


class ProductShare(BaseModel):
    """
    Product share analytics.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="product_shares"
    )

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="shares"
    )

    platform = models.CharField(
        max_length=50,
        blank=True,
        help_text="WhatsApp, Telegram, Facebook, etc."
    )

    def __str__(self):
        return f"{self.user.email} shared {self.product.name}"