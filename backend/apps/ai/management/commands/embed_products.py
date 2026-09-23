from django.core.management.base import BaseCommand

from apps.ai.models import ProductEmbedding
from apps.ai.services.gemini_client import embed_text
from apps.products.models import Product


class Command(BaseCommand):
    help = "Generate/update Gemini embeddings for all active products."

    def handle(self, *args, **options):
        products = Product.objects.filter(is_active=True)
        total = products.count()

        for i, product in enumerate(products, start=1):
            text = f"{product.name}. {product.category.name}. {product.description}"
            vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")

            ProductEmbedding.objects.update_or_create(
                product=product, defaults={"embedding": vector}
            )
            self.stdout.write(f"[{i}/{total}] embedded: {product.name}")

        self.stdout.write(self.style.SUCCESS(f"Done. {total} products embedded."))