from django.urls import path
from . import views

app_name = 'avatars'

urlpatterns = [
    # Will be accessible at /api/avatars/me/
    path('me/', views.AvatarProfileDetailView.as_view(), name='avatar-profile-detail'),
]