from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests

from apps.accounts.models import Profile

User = get_user_model()


class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response(
                {"error": "Google token required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 1. VERIFY GOOGLE TOKEN
            id_info = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                settings.GOOGLE_CLIENT_ID
            )

            email = id_info.get("email")

            if not email:
                return Response(
                    {"error": "Email not found in Google account"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. CREATE OR GET USER
            user, created = User.objects.get_or_create(email=email)

            if created:
                user.set_unusable_password()
                user.save()

                # 3. CREATE PROFILE (IMPORTANT FOR YOUR SYSTEM)
                Profile.objects.create(user=user)

            # 4. GENERATE JWT TOKENS
            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "created": created
            }, status=status.HTTP_200_OK)

        except ValueError:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST
            )