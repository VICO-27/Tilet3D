import os
import django
import cloudinary.uploader
from pathlib import Path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.products.models import Product, ProductMedia
from django.conf import settings

def migrate_category(cat_name, local_folders):
    print(f"--- Migrating {cat_name} ---")
    products = Product.objects.filter(category__name=cat_name).order_by('id')
    
    # Track which file we've used from which folder to handle duplicates
    # We will just iterate through the products.
    # The image filename is derived from the product name: "Premium Scarf - s1" -> "s1"
    
    # Pre-scan local folders to know exactly what files exist
    available_files = {}
    for folder in local_folders:
        folder_path = Path(settings.MEDIA_ROOT) / 'products' / 'Images' / folder
        if folder_path.exists():
            for f in folder_path.iterdir():
                if f.is_file():
                    available_files.setdefault(f.stem, []).append(f)
                    
    # Keep track of usage so we don't use the same exact local file twice if there are duplicates
    used_files = set()
    
    for p in products:
        # Example: "Premium Scarf - s1" -> "s1"
        base_name = p.name.split(' - ')[-1].strip()
        
        candidates = available_files.get(base_name, [])
        chosen_file = None
        for c in candidates:
            if str(c) not in used_files:
                chosen_file = c
                break
        
        # If all were used (shouldn't happen), just reuse the first one
        if not chosen_file and candidates:
            chosen_file = candidates[0]
            
        if not chosen_file:
            print(f"Skipping {p.name}, no local file found for {base_name}")
            continue
            
        used_files.add(str(chosen_file))
        
        media = p.media.first()
        if not media:
            continue
            
        print(f"Uploading {chosen_file.name} from {chosen_file.parent.name} for {p.name}...")
        
        # Upload to Cloudinary
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
        print(f"Saved to {new_name}")

if __name__ == "__main__":
    migrate_category("Scarf", ["scarf-1", "men-scarf"])
    migrate_category("Suri", ["suri-1", "suri-2"])
