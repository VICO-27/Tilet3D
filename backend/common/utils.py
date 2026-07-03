"""
Common utility functions used across the project.
"""

from django.utils.text import slugify


def generate_unique_slug(instance, value, slug_field="slug"):
    """
    Generate a unique slug for a Django model instance.

    If the generated slug already exists, append an incrementing
    number until a unique slug is found.

    Examples
    --------
    Habesha Kemis
        → habesha-kemis

    Habesha Kemis
        → habesha-kemis-1

    Habesha Kemis
        → habesha-kemis-2
    """

    slug = slugify(value)
    unique_slug = slug

    model = instance.__class__

    counter = 1

    while model.objects.filter(**{slug_field: unique_slug}).exclude(pk=instance.pk).exists():
        unique_slug = f"{slug}-{counter}"
        counter += 1

    return unique_slug

