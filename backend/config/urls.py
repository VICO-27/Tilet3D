from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.accounts.api.urls")),
    path("api/products/", include("apps.products.api.urls")),
    path("api/cart/", include("apps.cart.api.urls")),
    path("api/orders/", include("apps.orders.api.urls")),
    path("api/payments/", include("apps.payments.api.urls")),
    
]