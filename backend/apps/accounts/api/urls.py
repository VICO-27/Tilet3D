from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    LogoutView,
    RequestOTPView,
    VerifyOTPView,
    PasswordResetView,
)
from .google import GoogleLoginView

urlpatterns = [
    # AUTH
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),

    # GOOGLE OAUTH
    path("google/", GoogleLoginView.as_view(), name="google-login"),

    # OTP / PASSWORD RESET / EMAIL VERIFY
    path("otp/request/", RequestOTPView.as_view(), name="otp-request"),
    path("otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),

    # PROFILE
    path("profile/", ProfileView.as_view(), name="profile"),
]