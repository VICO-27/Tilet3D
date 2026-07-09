from pathlib import Path
from datetime import timedelta
import environ


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

SECRET_KEY = env(
    "SECRET_KEY",
    default="django-insecure-change-this-later"
)

DEBUG = env.bool(
    "DEBUG",
    default=False
)

ALLOWED_HOSTS = []


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
    "rest_framework",
    "rest_framework_simplejwt.token_blacklist",


    # Local apps
    "apps.accounts",
    "apps.products",
    "apps.cart",
    "apps.orders",
    "apps.payments",
]


# ==========================================================
# DATABASE
# ==========================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",

        "NAME": env("DB_NAME"),

        "USER": env("DB_USER"),

        "PASSWORD": env("DB_PASSWORD"),

        "HOST": env("DB_HOST"),

        "PORT": env("DB_PORT"),
    }
}


# ==========================================================
# THIRD PARTY KEYS
# ==========================================================

GOOGLE_CLIENT_ID = env(
    "GOOGLE_CLIENT_ID",
    default=""
)

GOOGLE_CLIENT_SECRET = env(
    "GOOGLE_CLIENT_SECRET",
    default=""
)


CHAPA_SECRET_KEY = env(
    "CHAPA_SECRET_KEY",
    default=""
)


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
        "rest_framework.permissions.IsAuthenticated",
    ),
}


# ==========================================================
# JWT CONFIGURATION
# ==========================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=15
    ),

    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=7
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