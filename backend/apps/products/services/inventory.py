# ==========================================================
# INVENTORY SERVICE (FINAL PRODUCTION VERSION)
# ==========================================================

from django.db import transaction


class InventoryService:

    # ==========================================================
    # RESERVE (CHECKOUT)
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def reserve(variant, quantity):

        variant = variant.__class__.objects.select_for_update().get(id=variant.id)

        available = variant.stock - variant.reserved_stock

        if quantity > available:
            raise Exception(f"Not enough stock for {variant.name}")

        variant.reserved_stock += quantity
        variant.save(update_fields=["reserved_stock"])

    # ==========================================================
    # CONFIRM (PAYMENT SUCCESS)
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def confirm(variant, quantity):

        variant = variant.__class__.objects.select_for_update().get(id=variant.id)

        variant.reserved_stock -= quantity
        variant.stock -= quantity

        if variant.reserved_stock < 0:
            variant.reserved_stock = 0

        variant.save(update_fields=["stock", "reserved_stock"])

    # ==========================================================
    # RELEASE (PAYMENT FAILED)
    # ==========================================================
    @staticmethod
    @transaction.atomic
    def release(variant, quantity):

        variant = variant.__class__.objects.select_for_update().get(id=variant.id)

        variant.reserved_stock -= quantity

        if variant.reserved_stock < 0:
            variant.reserved_stock = 0

        variant.save(update_fields=["reserved_stock"])