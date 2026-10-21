from django.core.exceptions import ImproperlyConfigured
from .base import *

SECRET_KEY = env("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY == "django-insecure-change-this-later":
    raise ImproperlyConfigured("A valid, secure SECRET_KEY environment variable is required in production.")

DEBUG = False

ALLOWED_HOSTS = env.list("ALLOWED_HOSTS", default=[".onrender.com", "localhost", "127.0.0.1", "yourdomain.com"])

CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["https://yourdomain.com"])
CSRF_TRUSTED_ORIGINS = env.list("CSRF_TRUSTED_ORIGINS", default=["https://yourdomain.com"])

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = env.bool("SECURE_SSL_REDIRECT", default=True)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Database support for production environments providing DATABASE_URL (e.g. Render, Railway, Neon, Supabase)
DATABASE_URL = env("DATABASE_URL", default="")
if DATABASE_URL:
    DATABASES["default"] = env.db_url_config(DATABASE_URL)
    if "OPTIONS" not in DATABASES["default"]:
        DATABASES["default"]["OPTIONS"] = {}
    DATABASES["default"]["OPTIONS"].setdefault("sslmode", "require")
    DATABASES["default"].setdefault("CONN_MAX_AGE", env.int("CONN_MAX_AGE", default=60))

# AWS S3 Storage for Media (django-storages)
AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="")
AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
AWS_DEFAULT_ACL = "public-read"
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",
}

if AWS_STORAGE_BUCKET_NAME:
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"
else:
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

# Static files (Whitenoise)
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Ensure WhiteNoise middleware is included
if "whitenoise.middleware.WhiteNoiseMiddleware" not in MIDDLEWARE:
    try:
        sec_idx = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
        MIDDLEWARE.insert(sec_idx + 1, "whitenoise.middleware.WhiteNoiseMiddleware")
    except ValueError:
        MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")