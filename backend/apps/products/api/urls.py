from django.urls import path
from .views import ProductListAPIView, ProductDetailAPIView


from .views import (
    CartView,
    AddToCartView,
    RemoveCartItemView,
    UpdateCartItemView,
)


from .views import (
    ToggleLikeView,
    AddCommentView,
    ShareProductView,
)

urlpatterns = [
    path("", ProductListAPIView.as_view(), name="product-list"),
    path("<slug:slug>/", ProductDetailAPIView.as_view(), name="product-detail"),
]


urlpatterns += [
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/add/", AddToCartView.as_view(), name="cart-add"),
    path("cart/item/<uuid:item_id>/", RemoveCartItemView.as_view(), name="cart-remove"),
    path("cart/item/<uuid:item_id>/update/", UpdateCartItemView.as_view(), name="cart-update")
]


urlpatterns += [
    path("like/", ToggleLikeView.as_view(), name="like-toggle"),
    path("comment/", AddCommentView.as_view(), name="comment-add"),
    path("share/", ShareProductView.as_view(), name="share"),
]