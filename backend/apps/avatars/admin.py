from django.contrib import admin
from .models import AvatarProfile

@admin.register(AvatarProfile)
class AvatarProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'nickname', 'gender', 'height', 'weight', 'updated_at')
    list_filter = ('gender', 'body_type', 'skin_tone')
    search_fields = ('user__email', 'nickname')
    
    fieldsets = (
        ('Identity', {
            'fields': ('user', 'nickname', 'age', 'gender')
        }),
        ('Visual Style', {
            'fields': ('body_type', 'skin_tone')
        }),
        ('Detailed Measurements', {
            'fields': ('height', 'weight', 'chest', 'waist', 'shoulder_width', 'hips')
        }),
        ('System', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at')