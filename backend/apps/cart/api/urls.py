from django.urls import path

from .views import (
    CartView,
    AddToCartView,
    UpdateCartItemView,
    RemoveCartItemView,
)

urlpatterns = [
    # =========================
    # CART CORE
    # =========================
    path("", CartView.as_view(), name="cart"),

    # =========================
    # CART ACTIONS
    # =========================
    path("add/", AddToCartView.as_view(), name="cart-add"),

    path(
        "item/<uuid:item_id>/update/",
        UpdateCartItemView.as_view(),
        name="cart-update",
    ),

    path(
        "item/<uuid:item_id>/",
        RemoveCartItemView.as_view(),
        name="cart-remove",
    ),
]