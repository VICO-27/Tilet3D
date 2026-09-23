from django.db import models
from common.models import BaseModel


class ProductEmbedding(BaseModel):
    """
    Cached embedding vector for a product, used for similarity-based
    recommendations. Regenerated via `python manage.py embed_products`
    whenever the catalog changes.
    """

    product = models.OneToOneField(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="embedding",
    )

    embedding = models.JSONField(
        help_text="768-dim vector from Gemini's text-embedding-004 model."
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Embedding for {self.product.name}"