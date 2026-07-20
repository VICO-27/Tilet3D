from django.core.management.base import BaseCommand
from apps.products.models import (
    Category,
    Product,
    ProductVariant,
    ProductMedia,
)

from pathlib import Path
from django.conf import settings


class Command(BaseCommand):

    help = "Seed Tilet3D products with real media"


    def handle(self, *args, **kwargs):

        self.stdout.write(
            self.style.WARNING(
                "Clearing old product data..."
            )
        )


        # Remove old product data
        ProductMedia.objects.all().delete()
        ProductVariant.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()



        # ==============================
        # MEDIA ROOT
        # ==============================

        media_root = Path(settings.MEDIA_ROOT)


        # ==============================
        # CATEGORY
        # ==============================

        kemis_category, _ = Category.objects.get_or_create(
            name="Habesha Kemis",
            description="Traditional Ethiopian women's clothing."
        )


        shemiz_category, _ = Category.objects.get_or_create(
            name="Men Traditional Wear",
            description="Traditional Ethiopian men's clothing."
        )


        scarf_category, _ = Category.objects.get_or_create(
            name="Accessories",
            description="Traditional accessories."
        )



        # ==============================
        # PRODUCT CREATOR
        # ==============================

        def create_product(
            category,
            name,
            description,
            price,
            image_folder,
            image_files
        ):

            product = Product.objects.create(
                category=category,
                name=name,
                description=description,
                brand="Tilet3D",
                is_featured=True,
            )


            for index, image in enumerate(image_files):

                ProductMedia.objects.create(
                    product=product,
                    media_type="image",
                    file=f"products/Images/{image_folder}/{image}",
                    is_primary=index == 0,
                    display_order=index,
                )


            ProductVariant.objects.create(
                product=product,
                name="Default Variant",
                sku=f"TLT-{product.id.hex[:8]}",
                color="Multiple",
                size="Custom",
                price=price,
                stock=20,
                measurements={
                    "length": 140,
                    "shoulder": 40
                }
            )


            return product



        # ==============================
        # PRODUCTS
        # ==============================


        create_product(
            kemis_category,
            "Elegant Habesha Kemis Collection",
            "Premium Ethiopian traditional dress with modern design.",
            3500,
            "habesha-kemis-section-1",
            [
                "habesha-kemis1-1.jpg",
                "habesha-kemis1-2.jpg",
                "habesha-kemis1-3.jpg",
            ]
        )



        create_product(
            kemis_category,
            "Colorful Habesha Kemis",
            "Beautiful handmade Habesha Kemis available in many colors.",
            4200,
            "habesha-kemis-section-4",
            [
                "black-habesha-kemis.jpeg",
                "blue-habesha-kemis.png",
                "gold-habesha-kemis.png",
            ]
        )



        create_product(
            shemiz_category,
            "Modern Ethiopian Shemiz",
            "Traditional men's wear designed for celebrations.",
            3000,
            "men-shemiz-1",
            [
                "blue-shemiz.png",
                "gold-shemiz.png",
                "red-shemiz.png",
            ]
        )



        create_product(
            scarf_category,
            "Traditional Netela",
            "Authentic Ethiopian cotton Netela.",
            800,
            "netela",
            [
                "n1.png",
                "n2.png",
                "n3.png",
            ]
        )



        self.stdout.write(
            self.style.SUCCESS(
                "Products seeded successfully 🚀"
            )
        )