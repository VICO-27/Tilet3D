import os
from collections import defaultdict
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from apps.products.models import Category, Product, ProductVariant, ProductMedia

class Command(BaseCommand):
    help = "Safely add new Habesha Kemis products by automatically grouping images"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Scanning for new Habesha Kemis products..."))

        # 1. Ensure the Category exists safely
        kemis_category, _ = Category.objects.get_or_create(
            name="Habesha Kemis",
            defaults={"description": "Traditional Ethiopian women's clothing."}
        )

        folder_name = "habesha-kemis-section-1"
        folder_path = Path(settings.MEDIA_ROOT) / "products" / "Images" / folder_name

        if not folder_path.exists():
            self.stdout.write(self.style.ERROR(f"Folder not found: {folder_path}"))
            return

        # 2. Group images by their base name (e.g. 'habesha-kemis8-1.png' -> 'habesha-kemis8')
        product_groups = defaultdict(list)

        for f in folder_path.iterdir():
            if f.is_file() and f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']:
                # Splits 'habesha-kemis8-1' into ['habesha-kemis8', '1'] and grabs the first part
                base_name = f.stem.rsplit('-', 1)[0] 
                product_groups[base_name].append(f.name)

        # 3. Create a product for each group
        for base_name, images in product_groups.items():
            # Sort so that image '-1' is always the primary, and '-2' is the hover/secondary
            images.sort()
            
            # Make a clean name: 'habesha-kemis8' -> 'Habesha Kemis8'
            display_name = base_name.replace('-', ' ').title()

            # get_or_create prevents duplicates if you run this script twice!
            product, created = Product.objects.get_or_create(
                name=display_name,
                category=kemis_category,
                defaults={
                    "description": "Premium Ethiopian traditional dress with modern design.",
                    "brand": "Tilet3D",
                    "is_featured": True, # Adds them to your homepage Featured slider!
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Creating product: {display_name} with {len(images)} images"))
                
                # Add the images to the product
                for index, img_name in enumerate(images):
                    ProductMedia.objects.create(
                        product=product,
                        media_type="image",
                        file=f"products/Images/{folder_name}/{img_name}",
                        is_primary=(index == 0),
                        display_order=index,
                    )

                # Add the variant pricing and stock
                ProductVariant.objects.create(
                    product=product,
                    name="Default Variant",
                    sku=f"TLT-{product.id.hex[:8]}",
                    color="Multiple",
                    size="Custom",
                    price=3500,
                    stock=20,
                    measurements={
                        "length": 140,
                        "shoulder": 40
                    }
                )
            else:
                self.stdout.write(self.style.WARNING(f"Product {display_name} already exists. Skipping..."))

        self.stdout.write(self.style.SUCCESS("Successfully processed all new Habesha Kemis products! 🚀"))