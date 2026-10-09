import os
import django
import requests
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tilet3d_backend.settings')
django.setup()

from apps.products.models import ProductMedia
from apps.products.api.serializers import ProductMediaSerializer

media = ProductMedia.objects.filter(product__category__name__in=["Amhara", "Tigray", "Wedding"])
for m in media:
    url = ProductMediaSerializer(m).data.get('file')
    if url:
        resp = requests.head(url)
        if resp.status_code != 200:
            print(f"FAILED {resp.status_code}: {url}")
