from django.db.models import Q
from apps.products.models import Product

def search_products(
    query=None,
    category=None,
    min_price=None,
    max_price=None,
    color=None,
    gender=None,
    availability=None,
    sort=None,
):
    """
    Unified product search and filtering service.
    Used by both the REST API (frontend) and AI Assistant.
    """
    qs = Product.objects.filter(is_active=True).select_related("category").prefetch_related(
        "media",
        "variants",
        "likes",
        "comments",
        "bookmarks"
    )

    if query:
        qs = qs.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(brand__icontains=query)
        )

    if category:
        categories = [c.strip() for c in category.split(',')]
        category_query = Q()
        for cat in categories:
            category_query |= Q(category__name__icontains=cat)
        qs = qs.filter(category_query)

    if min_price is not None:
        qs = qs.filter(variants__price__gte=min_price)

    if max_price is not None:
        qs = qs.filter(variants__price__lte=max_price)

    if color:
        qs = qs.filter(variants__color__icontains=color)

    if gender:
        # Match gender usually found in category or description
        qs = qs.filter(
            Q(category__name__icontains=gender) |
            Q(description__icontains=gender) |
            Q(name__icontains=gender)
        )

    if availability == "in_stock":
        # Check if any variant has stock > reserved_stock
        qs = qs.filter(variants__stock__gt=0) # simplistic approximation
        
    # Make sure we don't return duplicates if multiple variants match
    qs = qs.distinct()

    if sort == "price_asc":
        qs = qs.order_by("variants__price", "id")
    elif sort == "price_desc":
        qs = qs.order_by("-variants__price", "id")
    elif sort == "newest":
        qs = qs.order_by("-created_at", "id")
    else:
        qs = qs.order_by("display_order", "-created_at", "id")

    return qs
