from django.conf import settings
from django.db import models

from common.models import BaseModel

from apps.products.models import Product, ProductVariant


class OrderStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    CONFIRMED = "confirmed", "Confirmed"
    PROCESSING = "processing", "Processing"
    SHIPPED = "shipped", "Shipped"
    DELIVERED = "delivered", "Delivered"
    CANCELLED = "cancelled", "Cancelled"


class PaymentStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    PAID = "paid", "Paid"
    FAILED = "failed", "Failed"
    REFUNDED = "refunded", "Refunded"


class Order(BaseModel):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="orders",
    )

    order_number = models.CharField(
        max_length=20,
        unique=True,
    )

    status = models.CharField(
        max_length=20,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    shipping_fee = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    tax = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    full_name = models.CharField(max_length=200)

    phone = models.CharField(max_length=30)

    region = models.CharField(max_length=100)

    city = models.CharField(max_length=100)

    sub_city = models.CharField(
        max_length=100,
        blank=True,
    )

    woreda = models.CharField(
        max_length=100,
        blank=True,
    )

    house_no = models.CharField(
        max_length=100,
        blank=True,
    )

    postal_code = models.CharField(
        max_length=30,
        blank=True,
    )

    note = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.order_number


class OrderItem(BaseModel):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
    )

    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
    )

    product_name = models.CharField(
        max_length=200,
    )

    variant_name = models.CharField(
        max_length=200,
    )

    sku = models.CharField(
        max_length=100,
    )

    color = models.CharField(
        max_length=50,
        blank=True,
    )

    size = models.CharField(
        max_length=30,
        blank=True,
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    quantity = models.PositiveIntegerField()

    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.order.order_number} - {self.product_name}"
    

# ==========================================================
# SAFE STATUS CHECK (OPTIONAL SAFETY LAYER)
# ==========================================================
def can_transition(self, new_status):
    from apps.orders.services.lifecycle import OrderLifecycle

    allowed = OrderLifecycle.ALLOWED_TRANSITIONS.get(self.status, [])
    return new_status in allowed