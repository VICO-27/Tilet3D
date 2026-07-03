from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.api.urls")),
    path("api/products/", include("apps.products.api.urls")),
]