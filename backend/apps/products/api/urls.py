from django.urls import path

from .views import (
    ProductListAPIView,
    ProductDetailAPIView,
    ToggleLikeView,
    AddCommentView,
    ShareProductView,
)

urlpatterns = [
    # =========================
    # PRODUCT LIST
    # =========================
    path("", ProductListAPIView.as_view(), name="product-list"),

    # =========================
    # SOCIAL ACTIONS
    # =========================
    path("like/", ToggleLikeView.as_view(), name="like-toggle"),
    path("comment/", AddCommentView.as_view(), name="comment-add"),
    path("share/", ShareProductView.as_view(), name="share"),

    # =========================
    # PRODUCT DETAIL (LAST)
    # =========================
    path("<slug:slug>/", ProductDetailAPIView.as_view(), name="product-detail"),
]