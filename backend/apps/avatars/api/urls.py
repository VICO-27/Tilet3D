from django.urls import path
from .views import AvatarProfileDetailView

app_name = 'avatars'

urlpatterns = [
    path('me/', AvatarProfileDetailView.as_view(), name='avatar-profile-detail'),
]