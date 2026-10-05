from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

from apps.accounts.models import Profile, User, OTPPurpose, SecurityAuditLog, Address
from apps.accounts.utils import generate_otp, send_otp_email, log_security_event
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    RequestOTPSerializer,
    VerifyOTPSerializer,
    PasswordResetSerializer,
    SecurityAuditLogSerializer, 
    ChangePasswordSerializer,
    AddressSerializer,
)


# 1. Security Audit Log View
class SecurityAuditLogListView(generics.ListAPIView):
    serializer_class = SecurityAuditLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SecurityAuditLog.objects.filter(user=self.request.user)[:10]


# 2. Change Password View
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data["current_password"]):
                return Response(
                    {"detail": "Incorrect current password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(serializer.validated_data["new_password"])
            user.save()

            # Log security event
            log_security_event(request, user, "Password Successfully Changed")

            return Response({"detail": "Password updated successfully."})

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 3. Active Sessions & Revoke View
class ActiveSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tokens = OutstandingToken.objects.filter(user=request.user)
        sessions_data = []

        # Extract client IP
        ip = request.META.get("HTTP_X_FORWARDED_FOR")
        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.META.get("REMOTE_ADDR", "127.0.0.1")

        for token in tokens:
            # Skip if blacklisted
            if BlacklistedToken.objects.filter(token=token).exists():
                continue

            sessions_data.append(
                {
                    "id": str(token.id),
                    "device": "Web Browser",
                    "location": "Active Session",
                    "ip": ip,
                    "lastActive": token.created_at.strftime("%b %d, %Y"),
                    "isCurrent": False,
                }
            )

        return Response(sessions_data)

    def delete(self, request):
        """Sign out all other devices / revoke all refresh tokens"""
        tokens = OutstandingToken.objects.filter(user=request.user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)

        log_security_event(request, request.user, "Revoked active sessions on other devices")
        return Response({"detail": "All other sessions logged out successfully."})


# 4. Delete Account View
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        log_security_event(request, user, "Account Deleted")
        
        # Soft delete option (Recommended)
        user.is_active = False
        user.save()

        return Response({"detail": "Account deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


# -------------------------
# ADDRESS VIEWS
# -------------------------
class AddressListCreateView(generics.ListCreateAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        is_first = not Address.objects.filter(user=self.request.user).exists()
        serializer.save(user=self.request.user, is_default=is_first or serializer.validated_data.get("is_default", False))


class AddressDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


# -------------------------
# REGISTER
# -------------------------
from rest_framework.throttling import ScopedRateThrottle

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def perform_create(self, serializer):
        user = serializer.save()
        otp = generate_otp(user, OTPPurpose.EMAIL_VERIFY)
        send_otp_email(user, otp)


# -------------------------
# LOGIN
# -------------------------
class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


# -------------------------
# LOGOUT
# -------------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"message": "Logged out successfully"},
                status=status.HTTP_200_OK
            )
        except Exception:
            return Response(
                {"error": "Invalid token"},
                status=status.HTTP_400_BAD_REQUEST
            )


# -------------------------
# PROFILE
# -------------------------
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.profile


# -------------------------
# OTP: REQUEST
# -------------------------
class RequestOTPView(generics.GenericAPIView):
    serializer_class = RequestOTPSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = User.objects.get(email=serializer.validated_data["email"])
        purpose = serializer.validated_data["purpose"]
        
        otp = generate_otp(user, purpose)
        send_otp_email(user, otp)
        
        return Response({"message": "OTP sent."}, status=status.HTTP_200_OK)


# -------------------------
# OTP: VERIFY
# -------------------------
class VerifyOTPView(generics.GenericAPIView):
    serializer_class = VerifyOTPSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        otp = serializer.validated_data["otp"]
        purpose = serializer.validated_data["purpose"]

        otp.is_used = True
        otp.save()

        if purpose == OTPPurpose.EMAIL_VERIFY:
            user.is_verified = True
            user.save()

            # BUG FIX: Return fresh JWT tokens so the user stays authenticated
            # after email verification. Previously returned no tokens, causing
            # every subsequent API call (including avatar fetch) to 401.
            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Email verified successfully.",
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "is_verified": True,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
            }, status=status.HTTP_200_OK)

        # For password_reset purpose — no tokens needed
        return Response({"message": "OTP verified."}, status=status.HTTP_200_OK)


# -------------------------
# PASSWORD RESET
# -------------------------
class PasswordResetView(generics.GenericAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)