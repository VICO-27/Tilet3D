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
    help = "Safely seed Cultural products, making EACH image its own separate product"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Cleaning up previous test cultural products..."))
        
        # Prevent duplicates
        Product.objects.filter(category__name__in=["Oromo", "Amhara", "Tigray", "Wedding"]).delete()

        self.stdout.write(self.style.WARNING("Reading folders and creating individual products..."))

        media_root = Path(settings.MEDIA_ROOT)

        # Categories
        oromo_cat, _ = Category.objects.get_or_create(name="Oromo", defaults={"description": "Oromo cultural wear."})
        amhara_cat, _ = Category.objects.get_or_create(name="Amhara", defaults={"description": "Amhara cultural wear."})
        tigray_cat, _ = Category.objects.get_or_create(name="Tigray", defaults={"description": "Tigray cultural wear."})
        wedding_cat, _ = Category.objects.get_or_create(name="Wedding", defaults={"description": "Premium wedding attire."})

        # Product Creator
        def seed_folder_as_products(category, folder_name, base_name, price):
            folder_path = media_root / "products" / folder_name
            
            if not folder_path.exists():
                self.stdout.write(self.style.ERROR(f"Folder not found: {folder_path}"))
                return

            # Grab all images in the folder
            image_files = [
                f.name for f in folder_path.iterdir() 
                if f.is_file() and f.suffix.lower() in ['.png', '.jpg', '.jpeg', '.webp']
            ]

            if not image_files:
                self.stdout.write(self.style.ERROR(f"No images found in {folder_path}"))
                return

            # Create a SEPARATE product for every single image found
            for index, image in enumerate(image_files):
                product = Product.objects.create(
                    category=category,
                    name=f"{base_name} {index + 1}", # e.g., "Oromo Traditional 1", "Oromo Traditional 2"
                    description=f"Authentic {category.name} design.",
                    brand="Tilet3D",
                    is_featured=False,
                )

                ProductMedia.objects.create(
                    product=product,
                    media_type="image",
                    file=f"products/{folder_name}/{image}",
                    is_primary=True,
                    display_order=0,
                )

                ProductVariant.objects.create(
                    product=product,
                    name="Default Variant",
                    sku=f"CULT-{product.id.hex[:8]}",
                    color="Multiple",
                    size="Custom",
                    price=price,
                    stock=20,
                    measurements={
                        "length": 140,
                        "shoulder": 40
                    }
                )
            
            self.stdout.write(self.style.SUCCESS(f"Created {len(image_files)} individual products for {category.name}"))

        # Seed Products
        seed_folder_as_products(wedding_cat, "wedding", "Royal Wedding Attire", 12000)
        seed_folder_as_products(oromo_cat, "oromo", "Oromo Traditional", 4500)
        seed_folder_as_products(tigray_cat, "tigria", "Tigray Zuria", 4200)
        seed_folder_as_products(amhara_cat, "amhara", "Amhara Dress", 4000)

        self.stdout.write(self.style.SUCCESS("All cultural products seeded successfully 🚀"))