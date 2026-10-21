from django.urls import path
from .admin_views import (
    AdminOverviewView,
    AdminCustomerListView,
    AdminCustomerDetailView,
    AdminPaymentListView,
    AdminAnalyticsView,
    AdminAuditLogListView,
    AdminSettingsView,
)
from apps.products.api.admin_views import (
    AdminCategoryListView,
    AdminCategoryDetailView,
    AdminProductListCreateView,
    AdminProductDetailView,
    AdminProductToggleActiveView,
    AdminInventoryListView,
    AdminInventoryAdjustView,
)
from apps.orders.api.admin_views import (
    AdminOrderListAPIView,
    AdminOrderDetailAPIView,
    AdminOrderTransitionAPIView,
)

urlpatterns = [
    # 1. Overview
    path("overview/", AdminOverviewView.as_view(), name="admin-overview"),

    # 2. Categories & Collections
    path("categories/", AdminCategoryListView.as_view(), name="admin-category-list"),
    path("categories/<uuid:id>/", AdminCategoryDetailView.as_view(), name="admin-category-detail"),

    # 3. Products
    path("products/", AdminProductListCreateView.as_view(), name="admin-product-list-create"),
    path("products/<uuid:id>/", AdminProductDetailView.as_view(), name="admin-product-detail"),
    path("products/<uuid:id>/toggle-active/", AdminProductToggleActiveView.as_view(), name="admin-product-toggle-active"),

    # 4. Inventory
    path("inventory/", AdminInventoryListView.as_view(), name="admin-inventory-list"),
    path("inventory/<uuid:id>/adjust/", AdminInventoryAdjustView.as_view(), name="admin-inventory-adjust"),

    # 5. Orders & Fulfillment
    path("orders/", AdminOrderListAPIView.as_view(), name="admin-order-list"),
    path("orders/<uuid:id>/", AdminOrderDetailAPIView.as_view(), name="admin-order-detail"),
    path("orders/<uuid:id>/transition/", AdminOrderTransitionAPIView.as_view(), name="admin-order-transition"),

    # 6. Customers
    path("customers/", AdminCustomerListView.as_view(), name="admin-customer-list"),
    path("customers/<uuid:id>/", AdminCustomerDetailView.as_view(), name="admin-customer-detail"),

    # 7. Payments
    path("payments/", AdminPaymentListView.as_view(), name="admin-payment-list"),

    # 8. Analytics
    path("analytics/", AdminAnalyticsView.as_view(), name="admin-analytics"),

    # 9. Audit Logs
    path("audit-logs/", AdminAuditLogListView.as_view(), name="admin-audit-logs"),

    # 10. System Settings & Telemetry
    path("settings/", AdminSettingsView.as_view(), name="admin-settings"),
]
