from django.contrib import admin
from .models import (
    RentalProductConfig,
    RentalPackage,
    RentalBooking,
    RentalInspection,
)


class RentalPackageInline(admin.TabularInline):
    model = RentalPackage
    extra = 1


@admin.register(RentalProductConfig)
class RentalProductConfigAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_rental_enabled', 'daily_rate', 'security_deposit', 'rental_inventory_count')
    list_filter = ('is_rental_enabled',)
    search_fields = ('product__name',)
    inlines = [RentalPackageInline]


@admin.register(RentalBooking)
class RentalBookingAdmin(admin.ModelAdmin):
    list_display = (
        'booking_reference',
        'product',
        'user',
        'start_date',
        'end_date',
        'status',
        'payment_status',
        'deposit_status',
        'total_amount',
    )
    list_filter = ('status', 'payment_status', 'deposit_status', 'fulfillment_method')
    search_fields = ('booking_reference', 'full_name', 'phone', 'user__email', 'product__name')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(RentalInspection)
class RentalInspectionAdmin(admin.ModelAdmin):
    list_display = ('booking', 'condition', 'assessed_damage_fee', 'deposit_action', 'inspected_at')
    list_filter = ('condition', 'deposit_action')
    search_fields = ('booking__booking_reference', 'notes')
