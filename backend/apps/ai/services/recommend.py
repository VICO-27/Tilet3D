import math

from apps.ai.models import ProductEmbedding
from apps.products.models import Product


def _cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    dot = sum(a * b for a, b in zip(vec_a, vec_b))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def get_similar_products(product: Product, limit: int = 6):
    """
    Content-based recommendation via embedding similarity.
    MVP: ranks in Python — fine up to a few thousand products.
    Swap for pgvector's native distance operator once the catalog grows.
    """
    try:
        source = ProductEmbedding.objects.get(product=product)
    except ProductEmbedding.DoesNotExist:
        return Product.objects.filter(
            category=product.category, is_active=True
        ).exclude(id=product.id)[:limit]

    candidates = (
        ProductEmbedding.objects.select_related("product")
        .exclude(product=product)
        .filter(product__is_active=True)
    )

    scored = [
        (_cosine_similarity(source.embedding, c.embedding), c.product)
        for c in candidates
    ]
    scored.sort(key=lambda pair: pair[0], reverse=True)

    return [product for _, product in scored[:limit]]


def semantic_search_products(query: str, limit: int = 12):
    from apps.ai.services.gemini_client import embed_text

    query_vector = embed_text(query, task_type="RETRIEVAL_QUERY")

    candidates = ProductEmbedding.objects.select_related("product").filter(
        product__is_active=True
    )
    scored = [
        (_cosine_similarity(query_vector, c.embedding), c.product)
        for c in candidates
    ]
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [product for score, product in scored[:limit] if score > 0.3]