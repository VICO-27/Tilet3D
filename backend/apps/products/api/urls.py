from django.urls import path

from .views import (
    ProductListAPIView,
    ProductSearchAPIView,
    ProductDetailAPIView,
    ToggleLikeView,
    AddCommentView,
    ShareProductView,
    ProductCommentsListView,
    UserLikedProductsAPIView,
    UserSavedProductsAPIView,
    ToggleBookmarkView,
)

urlpatterns = [
    # =========================
    # PRODUCT LIST & ENGAGEMENTS
    # =========================
    path("", ProductListAPIView.as_view(), name="product-list"),
    path("search/", ProductSearchAPIView.as_view(), name="product-search"),
    path("liked/", UserLikedProductsAPIView.as_view(), name="user-liked-products"),
    path("saved/", UserSavedProductsAPIView.as_view(), name="user-saved-products"),
    path("bookmarked/", UserSavedProductsAPIView.as_view(), name="user-bookmarked-products"),


    # =========================
    # SOCIAL ACTIONS
    # =========================
    path("like/", ToggleLikeView.as_view(), name="like-toggle"),
    path("bookmark/", ToggleBookmarkView.as_view(), name="bookmark-toggle"),
    path("comment/", AddCommentView.as_view(), name="comment-add"),
    path("share/", ShareProductView.as_view(), name="share"),
    path("<uuid:id>/comments/", ProductCommentsListView.as_view(), name="product-comments"),

    # =========================
    # PRODUCT DETAIL (KEEP AT BOTTOM)
    # =========================
    path("<uuid:id>/", ProductDetailAPIView.as_view(), name="product-detail"),
]