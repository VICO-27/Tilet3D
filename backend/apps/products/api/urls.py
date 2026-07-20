from django.urls import path

from .views import (
    ProductListAPIView,
    ProductDetailAPIView,
    ToggleLikeView,
    AddCommentView,
    ShareProductView,
    ProductCommentsListView,
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


    path("<uuid:id>/comments/", ProductCommentsListView.as_view(), name="product-comments"),

    # =========================
    # PRODUCT DETAIL (LAST)
    # =========================
path("<uuid:id>/", ProductDetailAPIView.as_view(), name="product-detail"),]