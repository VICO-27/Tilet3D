import time
from django.core.cache import cache

def get_catalog_version():
    version = cache.get('catalog_version')
    if not version:
        version = int(time.time() * 1000)
        cache.set('catalog_version', version, timeout=None)
    return version

def bump_catalog_version():
    cache.set('catalog_version', int(time.time() * 1000), timeout=None)
