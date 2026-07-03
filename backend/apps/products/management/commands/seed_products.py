from django.core.management.base import BaseCommand
from faker import Faker
import random

from apps.products.models import Category, Product, ProductVariant, ProductMedia


fake = Faker()


class Command(BaseCommand):
    help = "Seed fake products for development"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding data...")

        # -------------------------
        # 1. CREATE CATEGORIES
        # -------------------------
        categories = []
        for name in ["Women", "Men", "Children", "Accessories"]:
            cat, _ = Category.objects.get_or_create(
                name=name,
                defaults={"is_active": True}
            )
            categories.append(cat)

        # -------------------------
        # 2. CREATE PRODUCTS
        # -------------------------
        products = []

        for _ in range(10):
            product = Product.objects.create(
                name=fake.word().capitalize() + " Habesha Set",
                category=random.choice(categories),
                description=fake.text(),
                brand="Tilet3D",
                is_active=True,
                is_featured=random.choice([True, False]),
            )
            products.append(product)

        # -------------------------
        # 3. CREATE VARIANTS
        # -------------------------
        colors = ["White", "Black", "Gold", "Blue"]
        sizes = ["S", "M", "L"]

        variants = []

        for product in products:
            for _ in range(3):
                variant = ProductVariant.objects.create(
                    product=product,
                    name=f"{random.choice(colors)} - {random.choice(sizes)}",
                    sku=fake.unique.uuid4()[:8],
                    color=random.choice(colors),
                    size=random.choice(sizes),
                    price=random.randint(1500, 5000),
                    stock=random.randint(1, 50),
                    measurements={
                        "chest": random.randint(80, 120),
                        "waist": random.randint(60, 100),
                        "length": random.randint(90, 150),
                    }
                )
                variants.append(variant)

        # -------------------------
        # 4. CREATE MEDIA
        # (placeholder URLs for now)
        # -------------------------
        for variant in variants:
            for i in range(3):
                ProductMedia.objects.create(
                    variant=variant,
                    media_type="image",
                    file="products/sample.jpg",  # placeholder
                    is_primary=(i == 0),
                    display_order=i
                )

        self.stdout.write(self.style.SUCCESS("Seeding complete 🚀"))