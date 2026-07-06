from django.conf import settings
from django.db import models

from common.models import BaseModel


class Cart(BaseModel):
    """
    Shopping cart belonging to one user.

    Each user has one active cart.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
        help_text="Owner of this shopping cart."
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Inactive after checkout."
    )

    class Meta:
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self):
        return f"{self.user.email}'s Cart"


class CartItem(BaseModel):
    """
    Represents one product variant inside a shopping cart.
    """

    cart = models.ForeignKey(
        "cart.Cart",
        on_delete=models.CASCADE,
        related_name="items",
        help_text="Cart containing this item."
    )

    variant = models.ForeignKey(
        "products.ProductVariant",
        on_delete=models.CASCADE,
        related_name="cart_items",
        help_text="Selected product variant."
    )

    quantity = models.PositiveIntegerField(
        default=1,
        help_text="Selected quantity."
    )

    class Meta:
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        unique_together = ("cart", "variant")

    def __str__(self):
        return f"{self.variant.name} × {self.quantity}"