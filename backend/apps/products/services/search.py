from django.db.models import Q, F
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
        "media"
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
        try:
            min_val = float(min_price)
            if min_val >= 0:
                qs = qs.filter(variants__price__gte=min_val)
        except ValueError:
            pass

    if max_price is not None:
        try:
            max_val = float(max_price)
            if max_val >= 0:
                qs = qs.filter(variants__price__lte=max_val)
        except ValueError:
            pass

    if color:
        colors = [c.strip() for c in color.split(',')]
        color_query = Q()
        for c in colors:
            color_query |= Q(variants__color__icontains=c)
        qs = qs.filter(color_query)

    if gender:
        genders = [g.strip() for g in gender.split(',')]
        gender_query = Q()
        for g in genders:
            # Use regex word boundaries to prevent 'men' from matching 'women'
            pattern = r'\b' + g + r'\b'
            gender_query |= Q(category__name__iregex=pattern) | Q(description__iregex=pattern) | Q(name__iregex=pattern)
        qs = qs.filter(gender_query)

    if availability == "in_stock":
        # Ensure available_stock (stock - reserved_stock) > 0
        qs = qs.filter(variants__stock__gt=F('variants__reserved_stock'))

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
