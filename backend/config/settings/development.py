from .base import *

DEBUG = True

ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# ADD THESE LINES:
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Development Email: use console backend if no SMTP credentials configured
if not env("EMAIL_HOST_USER", default=""):
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"