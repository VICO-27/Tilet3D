import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tilet3d_backend.settings')
django.setup()

from apps.products.models import ProductMedia
from apps.products.api.serializers import ProductMediaSerializer

media = ProductMedia.objects.filter(product__category__name__in=["Amhara", "Tigray", "Wedding"])
for m in media[:10]:
    print(f"Product: {m.product.name}")
    print(f"DB File: {m.file.name}")
    print(f"Serializer URL: {ProductMediaSerializer(m).data.get('file')}")
