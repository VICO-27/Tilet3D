from pathlib import Path
from datetime import timedelta
import environ
import os


# ==========================================================
# BASE DIRECTORY
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent.parent


# ==========================================================
# ENVIRONMENT CONFIGURATION
# ==========================================================

env = environ.Env()

# Load .env file
environ.Env.read_env(BASE_DIR / ".env")


# ==========================================================
# CORE SETTINGS
# ==========================================================

# Provide a default for local dev, but production should override or fail
SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-change-this-later"
)

DEBUG = env.bool(
    "DEBUG",
    default=False
)

ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS", 
    default=["*"]
)


# ==========================================================
# INSTALLED APPS
# ==========================================================

INSTALLED_APPS = [

    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",


    # Third party
    "corsheaders",
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",


    # Local apps
    "apps.accounts",
    "apps.products",
    "apps.cart",
    "apps.orders",
    "apps.payments",
    'apps.avatars',  
    "apps.ai",# <-- Add this line


    # Extensions
    'django_extensions',
]


# ==========================================================
# DATABASE
# ==========================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",

        "NAME": env("DB_NAME", default="tilet3d"),

        "USER": env("DB_USER", default="postgres"),

        "PASSWORD": env("DB_PASSWORD", default="postgres"),

        "HOST": env("DB_HOST", default="localhost"),

        "PORT": env("DB_PORT", default="5432"),
    }
}


# ==========================================================
# THIRD PARTY KEYS
# ==========================================================

GOOGLE_CLIENT_ID = env("GOOGLE_CLIENT_ID", default="")
GOOGLE_CLIENT_SECRET = env("GOOGLE_CLIENT_SECRET", default="")

APPLE_CLIENT_ID = env("APPLE_CLIENT_ID", default="")
APPLE_TEAM_ID = env("APPLE_TEAM_ID", default="")
APPLE_KEY_ID = env("APPLE_KEY_ID", default="")
APPLE_PRIVATE_KEY = env("APPLE_PRIVATE_KEY", default="")

FACEBOOK_APP_ID = env("FACEBOOK_APP_ID", default="")
FACEBOOK_APP_SECRET = env("FACEBOOK_APP_SECRET", default="")

GEMINI_API_KEY = env(
    "GEMINI_API_KEY",
    default=""
)

CHAPA_SECRET_KEY = env(
    "CHAPA_SECRET_KEY",
    default=""
)

CHAPA_CALLBACK_URL = env(
    "CHAPA_CALLBACK_URL",
    default="http://localhost:8000/api/payments/webhook/"
)

CHAPA_RETURN_URL = env(
    "CHAPA_RETURN_URL",
    default="http://localhost:3000/checkout/success"
)

# Add anywhere near the other THIRD PARTY KEYS
GEMINI_API_KEY = env("GEMINI_API_KEY", default="")
# ==========================================================
# EMAIL CONFIGURATION (BREVO/GMAIL SMTP)
# ==========================================================

EMAIL_BACKEND = env(
    "EMAIL_BACKEND", 
    default="django.core.mail.backends.smtp.EmailBackend"
)

EMAIL_HOST = env("EMAIL_HOST", default="smtp-relay.brevo.com")

EMAIL_PORT = env.int("EMAIL_PORT", default=587)

EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)

EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")

EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")

DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="noreply@tilet3d.com")

OTP_EXPIRY_MINUTES = env.int("OTP_EXPIRY_MINUTES", default=10)


# ==========================================================
# AUTH USER MODEL
# ==========================================================

AUTH_USER_MODEL = "accounts.User"


AUTHENTICATION_BACKENDS = [
    "apps.accounts.backends.EmailBackend",
]


# ==========================================================
# DJANGO REST FRAMEWORK
# ==========================================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),

    "DEFAULT_SCHEMA_CLASS": (
        "drf_spectacular.openapi.AutoSchema"
    ),

    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],

    "DEFAULT_THROTTLE_RATES": {
        "anon": "200/minute",
        "user": "1000/minute",
        "auth": "10/minute",
        "ai_chat": "15/minute",
        "ai_search": "30/minute",
    },
}


# ==========================================================
# MEDIA FILES
# ==========================================================

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ==========================================================
# JWT CONFIGURATION
# ==========================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=60  # Up from 15 min — reduces visible re-auth prompts for users.
    ),

    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=30  # Up from 7 days — users stay signed in for a full month of normal use.
    ),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": (
        "Bearer",
    ),

    "UPDATE_LAST_LOGIN": True,
}


# ==========================================================
# MIDDLEWARE
# ==========================================================

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.security.SecurityMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==========================================================
# URL / TEMPLATE
# ==========================================================

ROOT_URLCONF = "config.urls"


TEMPLATES = [

    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {

            "context_processors": [

                "django.template.context_processors.debug",

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",

            ],

        },

    },

]


WSGI_APPLICATION = "config.wsgi.application"


# ==========================================================
# PASSWORD VALIDATION
# ==========================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
        "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.MinimumLengthValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.CommonPasswordValidator"
    },

    {
        "NAME":
        "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]


# ==========================================================
# INTERNATIONALIZATION
# ==========================================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# ==========================================================
# STATIC FILES
# ==========================================================

STATIC_URL = "static/"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_ROOT = BASE_DIR / "staticfiles"


SPECTACULAR_SETTINGS = {
    "TITLE": "Tilet3D Backend API",
    "DESCRIPTION": (
        "REST API for the Tilet3D AI-powered Ethiopian cultural clothing platform."
    ),
    "VERSION": "1.0.0",

    "SERVE_INCLUDE_SCHEMA": False,

    "CONTACT": {
        "name": "Ashenafi Deresa",
        "email": "ashenafi.deresa.cse@email.com",
    },

    "LICENSE": {
        "name": "MIT",
    },
}

from celery.schedules import crontab

# ==========================================================
# CELERY & REDIS CONFIGURATION
# ==========================================================
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# ==========================================================
# CELERY BEAT (PERIODIC TASKS)
# ==========================================================
CELERY_BEAT_SCHEDULE = {
    'expire-pending-orders-every-30-minutes': {
        'task': 'apps.orders.tasks.task_expire_orders',
        'schedule': crontab(minute='*/30'), # Runs every 30 minutes
    },
}