import time
from django.core.management.base import BaseCommand

from apps.ai.models import ProductEmbedding
from apps.ai.services.gemini_client import embed_text
from apps.products.models import Product


class Command(BaseCommand):
    help = "Generate/update Gemini embeddings for all active products."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=None, help="Max number of products to embed.")
        parser.add_argument("--delay", type=float, default=1.0, help="Delay in seconds between requests.")
        parser.add_argument("--force", action="store_true", help="Re-embed products even if an embedding already exists.")

    def handle(self, *args, **options):
        limit = options.get("limit")
        delay = options.get("delay", 1.0)
        force = options.get("force", False)

        qs = Product.objects.filter(is_active=True).select_related("category")
        if not force:
            already_embedded_ids = ProductEmbedding.objects.values_list("product_id", flat=True)
            qs = qs.exclude(id__in=already_embedded_ids)

        total = qs.count()
        if limit:
            qs = qs[:limit]
            self.stdout.write(f"Embedding up to {limit} of {total} products (delay: {delay}s)...")
        else:
            self.stdout.write(f"Embedding {total} products (delay: {delay}s)...")

        success_count = 0
        for i, product in enumerate(qs, start=1):
            category_name = product.category.name if product.category else "Cultural Attire"
            text = f"{product.name}. {category_name}. {product.description or ''}"
            
            # Retry up to 3 times on rate limit
            retries = 3
            vector = None
            while retries > 0:
                try:
                    vector = embed_text(text, task_type="RETRIEVAL_DOCUMENT")
                    break
                except Exception as exc:
                    if "429" in str(exc) or "RESOURCE_EXHAUSTED" in str(exc):
                        self.stdout.write(self.style.WARNING(f"Rate limited on {product.name}. Pausing 20s..."))
                        time.sleep(20)
                        retries -= 1
                    else:
                        self.stdout.write(self.style.ERROR(f"Error on {product.name}: {exc}"))
                        break

            if vector:
                ProductEmbedding.objects.update_or_create(
                    product=product, defaults={"embedding": vector}
                )
                success_count += 1
                self.stdout.write(f"[{i}] embedded: {product.name}")
            else:
                self.stdout.write(self.style.WARNING(f"[{i}] skipped (failed): {product.name}"))

            if delay > 0:
                time.sleep(delay)

        self.stdout.write(self.style.SUCCESS(f"Finished embedding batch. {success_count} products updated."))