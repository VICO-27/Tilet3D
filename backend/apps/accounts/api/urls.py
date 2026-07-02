from django.urls import path
from .views import RegisterView, LoginView, ProfileView, LogoutView
from .google import GoogleLoginView

urlpatterns = [
    # AUTH
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # GOOGLE OAUTH
    path("google/", GoogleLoginView.as_view(), name="google-login"),

    # PROFILE (IMPORTANT)
    path("profile/", ProfileView.as_view(), name="profile"),
]