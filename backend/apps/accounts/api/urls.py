from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    LogoutView,
    RequestOTPView,
    VerifyOTPView,
    PasswordResetView,
    SecurityAuditLogListView,
    ChangePasswordView,
    ActiveSessionsView,
    DeleteAccountView,
)
from .google import GoogleLoginView
from django.urls import path
from .views import AddressListCreateView, AddressDetailView

urlpatterns = [
    # AUTH
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    
    path("security/logs/", SecurityAuditLogListView.as_view(), name="security-logs"),
    path("security/change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("security/sessions/", ActiveSessionsView.as_view(), name="active-sessions"),
    path("security/delete-account/", DeleteAccountView.as_view(), name="delete-account"),


    # GOOGLE OAUTH
    path("google/", GoogleLoginView.as_view(), name="google-login"),

    # OTP / PASSWORD RESET / EMAIL VERIFY
    path("otp/request/", RequestOTPView.as_view(), name="otp-request"),
    path("otp/verify/", VerifyOTPView.as_view(), name="otp-verify"),
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),

    # PROFILE
    path("profile/", ProfileView.as_view(), name="profile"),
    path("addresses/", AddressListCreateView.as_view(), name="address-list-create"),
    path("addresses/<uuid:pk>/", AddressDetailView.as_view(), name="address-detail"),
]