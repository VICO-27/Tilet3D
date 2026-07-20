from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Profile, User, OTPPurpose
from apps.accounts.utils import generate_otp, send_otp_email
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ProfileSerializer,
    RequestOTPSerializer,
    VerifyOTPSerializer,
    PasswordResetSerializer,
)


# -------------------------
# REGISTER
# -------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

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
        # Profile is guaranteed to exist via the post_save signal on User
        return self.request.user.profile


# -------------------------
# OTP: REQUEST
# -------------------------
class RequestOTPView(generics.GenericAPIView):
    serializer_class = RequestOTPSerializer
    permission_classes = [permissions.AllowAny]

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

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data["user"]
        otp = serializer.validated_data["otp"]
        purpose = serializer.validated_data["purpose"]
        
        if purpose == OTPPurpose.EMAIL_VERIFY:
            user.is_verified = True
            user.save()
            otp.is_used = True
            otp.save()
            
        return Response({"message": "OTP verified."}, status=status.HTTP_200_OK)


# -------------------------
# PASSWORD RESET
# -------------------------
class PasswordResetView(generics.GenericAPIView):
    serializer_class = PasswordResetSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({"message": "Password reset successful."}, status=status.HTTP_200_OK)