from django.urls import path
from .views import (
    ProductRentalDetailView,
    RentalAvailabilityCheckView,
    RentalQuoteView,
    RentalBookingCreateView,
    CustomerRentalListView,
    CustomerRentalDetailView,
    AdminRentalMetricsView,
    AdminRentalBookingListView,
    AdminRentalBookingDetailView,
    AdminRentalBookingActionView,
    AdminRentalInspectionView,
    AdminRentalProductConfigView,
)

app_name = 'rentals'

urlpatterns = [
    # Customer / Public
    path('products/<uuid:product_id>/', ProductRentalDetailView.as_view(), name='product-rental-detail'),
    path('availability/', RentalAvailabilityCheckView.as_view(), name='availability-check'),
    path('quote/', RentalQuoteView.as_view(), name='rental-quote'),
    path('bookings/', RentalBookingCreateView.as_view(), name='booking-create'),
    path('my-rentals/', CustomerRentalListView.as_view(), name='my-rentals-list'),
    path('my-rentals/<uuid:booking_id>/', CustomerRentalDetailView.as_view(), name='my-rental-detail'),

    # Admin
    path('admin/metrics/', AdminRentalMetricsView.as_view(), name='admin-metrics'),
    path('admin/bookings/', AdminRentalBookingListView.as_view(), name='admin-bookings-list'),
    path('admin/bookings/<uuid:booking_id>/', AdminRentalBookingDetailView.as_view(), name='admin-booking-detail'),
    path('admin/bookings/<uuid:booking_id>/transition/', AdminRentalBookingActionView.as_view(), name='admin-booking-action'),
    path('admin/bookings/<uuid:booking_id>/inspect/', AdminRentalInspectionView.as_view(), name='admin-booking-inspect'),
    path('admin/config/<uuid:product_id>/', AdminRentalProductConfigView.as_view(), name='admin-config'),
]
