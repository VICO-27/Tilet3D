from django.core.management.base import BaseCommand
from apps.products.models import Product, ProductMedia
from django.conf import settings
from pathlib import Path
import cloudinary.uploader

class Command(BaseCommand):
    help = "Fix Scarf and Suri media collision"

    def migrate_category(self, cat_name, local_folders):
        self.stdout.write(f"--- Migrating {cat_name} ---")
        products = Product.objects.filter(category__name=cat_name).order_by('id')
        
        available_files = {}
        for folder in local_folders:
            folder_path = Path(settings.MEDIA_ROOT) / 'products' / 'Images' / folder
            if folder_path.exists():
                for f in folder_path.iterdir():
                    if f.is_file():
                        available_files.setdefault(f.stem, []).append(f)
                        
        used_files = set()
        
        for p in products:
            base_name = p.name.split(' - ')[-1].strip()
            
            candidates = available_files.get(base_name, [])
            chosen_file = None
            for c in candidates:
                if str(c) not in used_files:
                    chosen_file = c
                    break
            
            if not chosen_file and candidates:
                chosen_file = candidates[0]
                
            if not chosen_file:
                self.stdout.write(self.style.WARNING(f"Skipping {p.name}, no local file found for {base_name}"))
                continue
                
            used_files.add(str(chosen_file))
            
            media = p.media.first()
            if not media:
                continue
                
            self.stdout.write(f"Uploading {chosen_file.name} from {chosen_file.parent.name} for {p.name}...")
            
            upload_folder = f"tilet3d/products/{cat_name.lower()}"
            response = cloudinary.uploader.upload(
                str(chosen_file),
                folder=upload_folder,
                resource_type='image',
                use_filename=True,
                unique_filename=True
            )
            
            fmt = response.get('format', '')
            new_name = response['public_id']
            if fmt:
                new_name += '.' + fmt
                
            media.file.name = new_name
            media.save()
            self.stdout.write(self.style.SUCCESS(f"Saved to {new_name}"))

    def handle(self, *args, **options):
        self.migrate_category("Scarf", ["scarf-1", "men-scarf"])
        self.migrate_category("Suri", ["suri-1", "suri-2"])
