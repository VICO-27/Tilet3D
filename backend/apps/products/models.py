from django.db import models
from django.utils.text import slugify
from common.models import BaseModel
from common.utils import generate_unique_slug
from django.conf import settings

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
    



class ProductVariant(BaseModel):
    """
    Represents a purchasable version of a product.

    This is what users actually buy.
    A Product can have many Variants.
    """

    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="variants",
        help_text="Parent product"
    )

    name = models.CharField(
        max_length=150,
        help_text="Variant label (e.g. White - M - Cotton)"
    )

    sku = models.CharField(
        max_length=100,
        unique=True,
        help_text="Stock Keeping Unit (unique identifier)"
    )

    color = models.CharField(
        max_length=50,
        blank=True,
        help_text="Color of this variant"
    )

    size = models.CharField(
        max_length=30,
        blank=True,
        help_text="Size (S, M, L, XL or numeric)"
    )

    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price of this variant"
    )

    stock = models.PositiveIntegerField(
        default=0,
        help_text="Available quantity in inventory"
    )

    is_active = models.BooleanField(
        default=True,
        help_text="If false, variant is hidden"
    )

    # 🔥 IMPORTANT FOR YOUR 3D SYSTEM (future use)
    measurements = models.JSONField(
        default=dict,
        blank=True,
        help_text="Body/garment measurements for 3D try-on"
    )

    class Meta:
        ordering = ["price"]
        verbose_name = "Product Variant"
        verbose_name_plural = "Product Variants"

    def __str__(self):
        return f"{self.product.name} - {self.name}"
    



class ProductMedia(BaseModel):
    """
    Media assets for a product variant.

    This supports:
    - Images (front, back, side)
    - Videos (product showcase)
    - Future 360/AR assets
    """

    MEDIA_TYPES = (
        ("image", "Image"),
        ("video", "Video"),
    )

    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="media",
        help_text="Variant this media belongs to"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES,
        default="image",
        help_text="Type of media"
    )

    file = models.FileField(
        upload_to="products/media/",
        help_text="Image or video file"
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True,
        help_text="Accessibility / SEO text"
    )

    is_primary = models.BooleanField(
        default=False,
        help_text="Main image shown on product card"
    )

    display_order = models.PositiveIntegerField(
        default=0,
        help_text="Controls ordering in gallery / animation"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order"]
        verbose_name = "Product Media"
        verbose_name_plural = "Product Media"

    def __str__(self):
        return f"{self.variant.name} - {self.media_type}"
    


class Cart(BaseModel):
    """
    One active cart per user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart"
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Cart - {self.user.email}"



class CartItem(BaseModel):
    """
    Each item represents a selected product variant.
    """

    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items"
    )

    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="cart_items"
    )

    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("cart", "variant")

    def __str__(self):
        return f"{self.variant.name} x {self.quantity}"





class ProductLike(BaseModel):
    """
    User likes a product (wishlist-style).
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
    User comments on a product.
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
    Tracks product sharing (virality metric).
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
        help_text="e.g. WhatsApp, Telegram, Facebook"
    )

    def __str__(self):
        return f"{self.user.email} shared {self.product.name}"