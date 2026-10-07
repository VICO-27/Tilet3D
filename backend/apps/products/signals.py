from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Product, ProductVariant, ProductMedia, Category
from .cache_utils import bump_catalog_version

@receiver([post_save, post_delete], sender=Product)
@receiver([post_save, post_delete], sender=ProductVariant)
@receiver([post_save, post_delete], sender=ProductMedia)
@receiver([post_save, post_delete], sender=Category)
def invalidate_catalog_cache(sender, instance, **kwargs):
    bump_catalog_version()
