import os
import urllib.request
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.core.cache import cache
import cloudinary
import cloudinary.uploader

from apps.products.models import Category, Product, ProductVariant, ProductMedia
from apps.products.cache_utils import bump_catalog_version

KEMIS_PRODUCTS_METADATA = [
    {
        "base": "blue-kemis",
        "name": "Azure Blue Habesha Kemis",
        "slug": "azure-blue-kemis-bespoke",
        "price": 25000,
        "description": "Luminous azure blue hand-spun Habesha Kemis with fine geometric silver tilet embroidery.",
        "front": "blue-kemis-front.png",
        "back": "blue-kemis-back.png",
        "top": None,
        "video": "blue-kemis.mp4",
        "display_order": 21,
    },
    {
        "base": "coffee-kemis",
        "name": "Buna Coffee Ceremonial Kemis",
        "slug": "coffee-ceremonial-kemis-bespoke",
        "price": 27500,
        "description": "Warm mocha-coffee shaded ceremonial gown woven from pure organic Arba Minch cotton.",
        "front": "coffee-kemis-front.png",
        "back": "coffee-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 22,
    },
    {
        "base": "dark-kemis",
        "name": "Midnight Dark Habesha Kemis",
        "slug": "dark-kemis-bespoke",
        "price": 26500,
        "description": "Midnight dark handwoven Habesha Kemis featuring striking contrast embroidery and delicate bespoke hemline detailing.",
        "front": "dark-kemis-front.png",
        "back": "dark-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 23,
    },
    {
        "base": "fenan-kemis",
        "name": "Fenan Royal Gold Kemis",
        "slug": "fenan-royal-kemis-bespoke",
        "price": 29000,
        "description": "Opulent Fenan couture wedding dress crowned with multi-tiered gold-thread embroidery.",
        "front": "fenana-kemis-front.png",
        "back": "fenan-kemis-back.png",
        "top": "fenan-kemis-top.png",
        "video": "fenan-kemis.mp4",
        "display_order": 24,
    },
    {
        "base": "green-kemis",
        "name": "Emerald Green Habesha Kemis",
        "slug": "emerald-green-kemis-bespoke",
        "price": 24500,
        "description": "Vibrant emerald green ceremonial dress handcrafted by master weavers in Shiro Meda.",
        "front": "green-kemis-front.png",
        "back": "green-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 25,
    },
    {
        "base": "greenraya-kemis",
        "name": "Green Raya Ceremonial Kemis",
        "slug": "greenraya-kemis-bespoke",
        "price": 24000,
        "description": "Traditional Raya ceremonial Habesha Kemis in vibrant olive-green weave with handcrafted geometric tilet accents.",
        "front": "greenraya-kemis-front.png",
        "back": "greenraya-kemis-back.png",
        "top": None,
        "video": "raya-kemis.mp4",
        "display_order": 26,
    },
    {
        "base": "lightred-kemis",
        "name": "Crimson Blush Habesha Kemis",
        "slug": "crimson-blush-kemis-bespoke",
        "price": 23500,
        "description": "Subtle crimson blush spun-cotton gown with intricate border tapestry.",
        "front": "lightred-kemis-front.png",
        "back": "lightred-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 27,
    },
    {
        "base": "nayo-kemis",
        "name": "Nayo Heritage Couture Kemis",
        "slug": "nayo-heritage-kemis-bespoke",
        "price": 31000,
        "description": "Authentic Nayo bespoke wedding gown woven with gold thread and traditional cross-motif chest piece.",
        "front": "nayo-kemis-front.jpg",
        "back": "nayo-kemis-back.jpg",
        "top": "nayo-kemis-top.jpg",
        "video": "nayo-kemis-.mp4",
        "display_order": 28,
    },
    {
        "base": "pink-kemis",
        "name": "Rose Pink Festive Kemis",
        "slug": "rose-pink-kemis-bespoke",
        "price": 23000,
        "description": "Soft rose pink bridal Kemis with floral-geometric tibeb embroidery along the cuffs and hem.",
        "front": "pink-kemis-front.png",
        "back": "pink-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 29,
    },
    {
        "base": "red-kemis",
        "name": "Ruby Scarlet Habesha Kemis",
        "slug": "ruby-scarlet-kemis-bespoke",
        "price": 26000,
        "description": "Vibrant ruby scarlet ceremonial dress featuring majestic golden yellow border accents.",
        "front": "red-kemis-front.png",
        "back": "red-kemis-back.png",
        "top": None,
        "video": "red-kemis.mp4",
        "display_order": 30,
    },
    {
        "base": "redwhite-kemis",
        "name": "Crimson White Habesha Kemis",
        "slug": "redwhite-kemis-bespoke",
        "price": 24500,
        "description": "Pure white woven cotton dress with bold ruby red horizontal and diagonal striping.",
        "front": "redwhite-kemis-front.png",
        "back": "redwhite-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 31,
    },
    {
        "base": "reyal-kemis",
        "name": "Royal Reyal Heritage Kemis",
        "slug": "reyal-kemis-bespoke",
        "price": 27000,
        "description": "Aristocratic Reyal traditional gown with detailed symmetric chest paneling and hand-knotted borders.",
        "front": "reyal-kemis-front.png",
        "back": "reyal-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 32,
    },
    {
        "base": "selam-kemis",
        "name": "Selam Grace Habesha Kemis",
        "slug": "selam-kemis-bespoke",
        "price": 25500,
        "description": "Graceful Selam design in pristine white cotton adorned with silver and royal blue geometric weave.",
        "front": "selam-kemis-front.png",
        "back": "selam-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 33,
    },
    {
        "base": "selamraya-kemis",
        "name": "Selam Raya Fusion Kemis",
        "slug": "selamraya-kemis-bespoke",
        "price": 26000,
        "description": "Dynamic fusion of Raya embroidery lines and Selam flowing cotton silhouette.",
        "front": "selamray-kemis-front.png",
        "back": "selamraya-kemis-back.png",
        "top": None,
        "video": None,
        "display_order": 34,
    },
    {
        "base": "white-kemis",
        "name": "Pure Albaso White Kemis",
        "slug": "pure-albaso-white-kemis-bespoke",
        "price": 28000,
        "description": "Classic Albaso ceremonial dress with triple-tier gold and black borders woven from pure Ethiopian cotton.",
        "front": "white-kemis-front.png",
        "back": "white-kemis-back.png",
        "top": "white-kemis-top.png",
        "video": "white-green-kemis.mp4",
        "display_order": 35,
    },
    {
        "base": "yellow-kemis",
        "name": "Golden Adey Abeba Kemis",
        "slug": "golden-adey-kemis-bespoke",
        "price": 27000,
        "description": "Celebratory Adey Abeba golden yellow Kemis inspired by Ethiopian springtime blossoms.",
        "front": "yellow-kemis-front.png",
        "back": "yellow-kemis-back.png",
        "top": "yellow-kemis-top.png",
        "video": "yellow-kemis.mp4",
        "display_order": 36,
    },
    {
        "base": "dardar-kemis",
        "name": "Dardar Royal Habesha Kemis",
        "slug": "dardar-royal-kemis-bespoke",
        "price": 27000,
        "description": "Regal handcrafted Habesha Kemis adorned with intricate gold and crimson dardar embroidery motifs.",
        "front": "dardar-kemis.jpg",
        "back": None,
        "top": None,
        "video": "dardar-kemis.mp4",
        "display_order": 37,
    },
    {
        "base": "enkutatash-kemis",
        "name": "Enkutatash Celebration Kemis",
        "slug": "enkutatash-celebration-kemis-bespoke",
        "price": 26000,
        "description": "Vibrant New Year festival Habesha Kemis with bright yellow Adey Abeba inspired border weaves.",
        "front": "enkutatash-kemis.jpg",
        "back": None,
        "top": None,
        "video": "enkutatash-kemis.mp4",
        "display_order": 38,
    },
    {
        "base": "lidiana-kemis",
        "name": "Lidiana Modern Habesha Kemis",
        "slug": "lidiana-modern-kemis-bespoke",
        "price": 28500,
        "description": "Haute-couture Lidiana bridal Habesha Kemis tailored with sheer chiffon accents and silver tilet piping.",
        "front": "lidiana-kemis.jpg",
        "back": None,
        "top": None,
        "video": "lidiana-kemis.mp4",
        "display_order": 39,
    },
    {
        "base": "short-kemis",
        "name": "Short Contemporary Habesha Kemis",
        "slug": "short-contemporary-kemis-bespoke",
        "price": 22000,
        "description": "Modern knee-length contemporary Habesha dress featuring traditional tilet borders and light cotton drape.",
        "front": "short-kemis.jpg",
        "back": None,
        "top": None,
        "video": "short-kemis.mp4",
        "display_order": 40,
    },
]

class Command(BaseCommand):
    help = "Uploads untracked local Kemis media to Cloudinary and synchronizes Supabase product catalog"

    def handle(self, *args, **options):
        media_root = settings.MEDIA_ROOT
        kemis_dir = os.path.join(media_root, "kemis")
        videos_dir = os.path.join(media_root, "videos")
        avatars_dir = os.path.join(media_root, "avatars")

        self.stdout.write(self.style.NOTICE("Verifying media directories..."))
        if not os.path.exists(kemis_dir):
            self.stdout.write(self.style.ERROR(f"Directory {kemis_dir} does not exist."))
            return

        # 1. Upload Images
        self.stdout.write("Uploading Kemis images to Cloudinary...")
        for fname in sorted(os.listdir(kemis_dir)):
            fpath = os.path.join(kemis_dir, fname)
            if os.path.isfile(fpath):
                stem, _ = os.path.splitext(fname)
                public_id = f"tilet3d/products/media/{stem}"
                cloudinary.uploader.upload(
                    fpath,
                    public_id=public_id,
                    overwrite=True,
                    resource_type="image",
                )

        # 2. Upload Videos
        if os.path.exists(videos_dir):
            self.stdout.write("Uploading Kemis runway videos to Cloudinary...")
            for fname in sorted(os.listdir(videos_dir)):
                fpath = os.path.join(videos_dir, fname)
                if os.path.isfile(fpath):
                    stem, _ = os.path.splitext(fname)
                    public_id = f"tilet3d/products/media/{stem}"
                    cloudinary.uploader.upload(
                        fpath,
                        public_id=public_id,
                        overwrite=True,
                        resource_type="video",
                    )

        # 3. Upload Avatars
        if os.path.exists(avatars_dir):
            self.stdout.write("Uploading Avatars to Cloudinary...")
            for fname in sorted(os.listdir(avatars_dir)):
                fpath = os.path.join(avatars_dir, fname)
                if os.path.isfile(fpath):
                    stem, _ = os.path.splitext(fname)
                    public_id = f"tilet3d/avatars/{stem}"
                    cloudinary.uploader.upload(
                        fpath,
                        public_id=public_id,
                        overwrite=True,
                        resource_type="image",
                    )

        # 4. Synchronize Database
        self.stdout.write("Synchronizing bespoke products in Supabase...")
        kemis_category, _ = Category.objects.get_or_create(
            name="Kemis",
            defaults={"description": "Authentic Ethiopian traditional Kemis couture."},
        )

        with transaction.atomic():
            for item in KEMIS_PRODUCTS_METADATA:
                product, created = Product.objects.get_or_create(
                    slug=item["slug"],
                    defaults={
                        "name": item["name"],
                        "category": kemis_category,
                        "description": item["description"],
                        "brand": "TILET3D",
                        "display_order": item["display_order"],
                        "is_active": True,
                        "is_featured": True,
                    },
                )
                if not created:
                    product.name = item["name"]
                    product.description = item["description"]
                    product.display_order = item["display_order"]
                    product.is_active = True
                    product.is_featured = True
                    product.save()

                product.media.all().delete()

                # Front
                if item.get("front"):
                    ProductMedia.objects.create(
                        product=product,
                        media_type="image",
                        file=f"tilet3d/products/media/{item['front']}",
                        is_primary=True,
                        display_order=0,
                        alt_text=f"{item['name']} - Front View",
                    )

                # Back
                if item.get("back"):
                    ProductMedia.objects.create(
                        product=product,
                        media_type="image",
                        file=f"tilet3d/products/media/{item['back']}",
                        is_primary=False,
                        display_order=1,
                        alt_text=f"{item['name']} - Back View",
                    )

                # Top
                if item.get("top"):
                    ProductMedia.objects.create(
                        product=product,
                        media_type="image",
                        file=f"tilet3d/products/media/{item['top']}",
                        is_primary=False,
                        display_order=2,
                        alt_text=f"{item['name']} - Top Detailing View",
                    )

                # Video
                if item.get("video"):
                    ProductMedia.objects.create(
                        product=product,
                        media_type="video",
                        file=f"tilet3d/products/media/{item['video']}",
                        is_primary=False,
                        display_order=3,
                        alt_text=f"{item['name']} - Runway Simulation Video",
                    )

                # Variant
                sku = f"KMS-{item['display_order']:02d}-BESPOKE"
                variant, _ = ProductVariant.objects.get_or_create(
                    product=product,
                    sku=sku,
                    defaults={
                        "name": "Bespoke Tailored",
                        "color": item["name"].split()[0],
                        "size": "Custom",
                        "price": item["price"],
                        "stock": 15,
                        "is_active": True,
                    },
                )
                variant.price = item["price"]
                variant.is_active = True
                variant.save()

            # Attach videos to matching items
            oromo_2 = Product.objects.filter(slug="oromo-2").first()
            if oromo_2:
                oromo_2.media.filter(media_type="video").delete()
                ProductMedia.objects.create(
                    product=oromo_2,
                    media_type="video",
                    file="tilet3d/products/media/oromo-2-kemis.mp4",
                    is_primary=False,
                    display_order=10,
                    alt_text="Authentic Oromo Cultural Runway Simulation #2",
                )

        bump_catalog_version()
        cache.clear()
        self.stdout.write(self.style.SUCCESS("All bespoke media successfully deployed to Cloudinary and synchronized with database!"))
