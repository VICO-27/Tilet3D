from django.urls import path

from apps.ai.api.views import ChatView, RecommendView, ProductsByIdsView, SearchView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="ai-chat"),
    path("recommend/<uuid:product_id>/", RecommendView.as_view(), name="ai-recommend"),
    path("products-by-ids/", ProductsByIdsView.as_view(), name="ai-products-by-ids"),
    path("search/", SearchView.as_view(), name="ai-search"),
]