import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import Category, ProductMedia
import cloudinary.uploader
from django.core.files.storage import default_storage

class Command(BaseCommand):
    help = 'Migrates existing local product and category media to Cloudinary in an idempotent way.'

    def handle(self, *args, **options):
        # 1. Migrate Categories
        categories = Category.objects.all()
        for cat in categories:
            if cat.image and not str(cat.image.name).startswith('tilet3d/categories/images/'):
                self.stdout.write(f"Migrating image for category {cat.name}...")
                old_name = cat.image.name
                old_path = os.path.join(settings.MEDIA_ROOT, old_name)
                if os.path.exists(old_path):
                    with open(old_path, 'rb') as f:
                        response = cloudinary.uploader.upload(
                            f, 
                            folder='tilet3d/categories/images',
                            use_filename=True,
                            unique_filename=False,
                            resource_type='image'
                        )
                    cat.image.name = response['public_id'] + '.' + response['format']
                    cat.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully migrated {old_name} to {cat.image.name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"File not found: {old_path}"))

            if cat.banner and not str(cat.banner.name).startswith('tilet3d/categories/banners/'):
                self.stdout.write(f"Migrating banner for category {cat.name}...")
                old_name = cat.banner.name
                old_path = os.path.join(settings.MEDIA_ROOT, old_name)
                if os.path.exists(old_path):
                    with open(old_path, 'rb') as f:
                        response = cloudinary.uploader.upload(
                            f, 
                            folder='tilet3d/categories/banners',
                            use_filename=True,
                            unique_filename=False,
                            resource_type='image'
                        )
                    cat.banner.name = response['public_id'] + '.' + response['format']
                    cat.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully migrated {old_name} to {cat.banner.name}"))

        # 2. Migrate ProductMedia
        media_items = ProductMedia.objects.all()
        for media in media_items:
            if media.file and not str(media.file.name).startswith('tilet3d/products/media/'):
                self.stdout.write(f"Migrating file for ProductMedia ID {media.id} ({media.media_type})...")
                old_name = media.file.name
                old_path = os.path.join(settings.MEDIA_ROOT, old_name)
                if os.path.exists(old_path):
                    with open(old_path, 'rb') as f:
                        response = cloudinary.uploader.upload(
                            f, 
                            folder='tilet3d/products/media',
                            use_filename=True,
                            unique_filename=False,
                            resource_type='auto'
                        )
                    # Extract extension from response or keep original if not present
                    fmt = response.get('format', '')
                    new_name = response['public_id']
                    if fmt:
                        new_name += '.' + fmt
                    media.file.name = new_name
                    media.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully migrated {old_name} to {media.file.name}"))
                else:
                    self.stdout.write(self.style.WARNING(f"File not found: {old_path}"))

        self.stdout.write(self.style.SUCCESS('Migration complete.'))
