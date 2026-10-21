import logging
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests

from apps.accounts.utils import log_security_event

logger = logging.getLogger(__name__)
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
            audience = settings.GOOGLE_CLIENT_ID or None
            id_info = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                audience=audience
            )

            email = id_info.get("email")

            if not email:
                return Response(
                    {"error": "Email not found in Google account"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. CREATE OR GET USER
            user, created = User.objects.get_or_create(email=email)

            # Google accounts have verified email addresses
            user.is_verified = True
            if created:
                user.set_unusable_password()
            user.save()

            # Ensure profile has the user's name if provided by Google
            full_name = (
                id_info.get("name")
                or f"{id_info.get('given_name', '')} {id_info.get('family_name', '')}".strip()
            )
            if hasattr(user, "profile") and full_name and not user.profile.full_name:
                user.profile.full_name = full_name
                user.profile.save(update_fields=["full_name"])

            # Log sign-in security event
            log_security_event(request, user, "Google Sign-in")

            # 3. GENERATE JWT TOKENS
            refresh = RefreshToken.for_user(user)

            return Response({
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "is_verified": user.is_verified,
                    "is_staff": user.is_staff,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "created": created,
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            logger.warning(f"Invalid Google token received: {e}")
            return Response(
                {"error": "Invalid Google token or expired session."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Google authentication error: {e}")
            return Response(
                {"error": "Google authentication failed. Please try again or use email/password."},
                status=status.HTTP_400_BAD_REQUEST
            )