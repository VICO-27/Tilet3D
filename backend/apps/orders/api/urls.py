from django.urls import path

from .views import (
    CheckoutAPIView,
    OrderDetailAPIView,
    OrderListAPIView,
)

urlpatterns = [
    path(
        "",
        OrderListAPIView.as_view(),
        name="order-list",
    ),
    path(
        "checkout/",
        CheckoutAPIView.as_view(),
        name="checkout",
    ),
    path(
        "<uuid:pk>/",
        OrderDetailAPIView.as_view(),
        name="order-detail",
    ),
]