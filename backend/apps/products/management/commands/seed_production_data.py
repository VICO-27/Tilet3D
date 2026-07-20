import os
import random
from django.core.management.base import BaseCommand
from apps.products.models import Category, Product, ProductVariant, ProductMedia
from django.db import transaction

class Command(BaseCommand):
    help = "Seeds the database with the full production media library"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("Clearing existing product data..."))
        
        # Atomic transaction to ensure DB integrity
        with transaction.atomic():
            ProductMedia.objects.all().delete()
            ProductVariant.objects.all().delete()
            Product.objects.all().delete()
            Category.objects.all().delete()

            # 1. Define Categories exactly as requested
            category_names = [
                "Kemis", "Suri", "Scarf", "Shemiz", "Netela", 
                "Shash", "Tuta", "Family", "Couple", "Wedding", 
                "Children", "Gabi", "Accessory"
            ]
            
            categories = {}
            for name in category_names:
                cat, _ = Category.objects.get_or_create(name=name)
                categories[name] = cat

            # 2. Define Media Mapping based on your file structure
            # Logic: (Category Key, Image Folder, Video Folder or List)
            mapping = [
                ("Kemis", "habesha-kemis-section-1", "videos/habesha-kemis"),
                ("Kemis", "habesha-kemis-section-2", None),
                ("Kemis", "habesha-kemis-section-3", None),
                ("Kemis", "habesha-kemis-section-4", None),
                ("Shemiz", "men-shemiz-1", "videos/shemiz"),
                ("Shemiz", "men-shemiz-2", None),
                ("Shemiz", "men-shemiz-3", None),
                ("Suri", "suri-1", None),
                ("Suri", "suri-2", None),
                ("Gabi", "gabi", None),
                ("Netela", "netela", None),
                ("Shash", "shash", None),
                ("Family", "family-habesha-cloth", None),
                ("Couple", "male-and-female", None),
                ("Scarf", "men-scarf", None),
                ("Scarf", "scarf-1", None),
            ]

            # 3. Helper to get all files in a folder (relative to media root)
            def get_files(folder_path):
                full_path = os.path.join("media/products", folder_path)
                if not os.path.exists(full_path):
                    return []
                return [f for f in os.listdir(full_path) if os.path.isfile(os.path.join(full_path, f))]

            # Get generic featured videos for variety
            featured_videos = get_files("featured-section-videos")

            # 4. Processing the mapping
            for cat_name, img_folder, vid_folder in mapping:
                category = categories[cat_name]
                images = get_files(f"Images/{img_folder}")
                
                # Get loop videos for this specific category if available
                category_videos = get_files(vid_folder) if vid_folder else []

                for i, img_name in enumerate(images):
                    # Create Product
                    p = Product.objects.create(
                        category=category,
                        name=f"Premium {cat_name} - {img_name.split('.')[0]}",
                        description=f"Authentic {cat_name} handcrafted by Tilet3D artisans.",
                        brand="Tilet3D",
                        is_featured=(i % 5 == 0) # Every 5th is featured
                    )

                    # Create Variant
                    ProductVariant.objects.create(
                        product=p,
                        name="Custom Fit",
                        sku=f"TLT-{cat_name[:3].upper()}-{p.id.hex[:5]}",
                        price=random.randint(1500, 8000),
                        stock=random.randint(5, 50)
                    )

                    # Add Primary Image
                    ProductMedia.objects.create(
                        product=p,
                        media_type="image",
                        file=f"products/Images/{img_folder}/{img_name}",
                        is_primary=True,
                        display_order=0
                    )

                    # Add Secondary Media (Video if available, else another image, else a random featured video)
                    # This ensures the "Hover Change" feature works on the frontend
                    if category_videos:
                        vid = random.choice(category_videos)
                        ProductMedia.objects.create(
                            product=p,
                            media_type="video",
                            file=f"products/{vid_folder}/{vid}",
                            is_primary=False,
                            display_order=1
                        )
                    elif featured_videos and random.random() > 0.5:
                        vid = random.choice(featured_videos)
                        ProductMedia.objects.create(
                            product=p,
                            media_type="video",
                            file=f"products/featured-section-videos/{vid}",
                            is_primary=False,
                            display_order=1
                        )
                    elif len(images) > 1:
                        # Use a different image from the same folder as hover
                        next_img = images[(i + 1) % len(images)]
                        ProductMedia.objects.create(
                            product=p,
                            media_type="image",
                            file=f"products/Images/{img_folder}/{next_img}",
                            is_primary=False,
                            display_order=1
                        )

            self.stdout.write(self.style.SUCCESS(f"Successfully seeded database with {Product.objects.count()} products!"))