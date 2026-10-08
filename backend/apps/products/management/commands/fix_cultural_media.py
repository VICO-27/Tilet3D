import os
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.products.models import ProductMedia
import cloudinary.uploader

class Command(BaseCommand):
    help = 'Migrates cultural product media to Cloudinary with unique names/folders'

    def handle(self, *args, **options):
        media_items = ProductMedia.objects.filter(product__category__name__in=["Oromo", "Amhara", "Tigray", "Wedding"])
        
        for media in media_items:
            old_name = media.file.name
            old_path = os.path.join(settings.MEDIA_ROOT, old_name)
            
            if os.path.exists(old_path) and not old_name.startswith('tilet3d/'):
                self.stdout.write(f"Migrating {old_name}...")
                
                # Derive target folder from old_name e.g. products/oromo -> tilet3d/products/oromo
                folder_path = 'tilet3d/' + os.path.dirname(old_name)
                
                with open(old_path, 'rb') as f:
                    response = cloudinary.uploader.upload(
                        f, 
                        folder=folder_path,
                        use_filename=True,
                        unique_filename=True,  # IMPORTANT: keeps them distinct even if named identically
                        resource_type='image'
                    )
                
                fmt = response.get('format', '')
                new_name = response['public_id']
                if fmt:
                    new_name += '.' + fmt
                    
                media.file.name = new_name
                media.save()
                self.stdout.write(self.style.SUCCESS(f"Saved as {new_name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Skipping {old_name}"))
                
        self.stdout.write(self.style.SUCCESS('Done fixing cultural media.'))
