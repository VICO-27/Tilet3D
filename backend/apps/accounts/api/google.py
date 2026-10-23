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
            # Allow configured ID and known valid client IDs to prevent audience mismatch
            audiences = []
            if getattr(settings, "GOOGLE_CLIENT_ID", None):
                audiences.append(settings.GOOGLE_CLIENT_ID)
            for cid in [
                "313469957062-17hi3689s6d5prr9l88ehcfh9u3lch29.apps.googleusercontent.com",
                "20804747116-j3hej0jvqmiftqasji18hll1p2hs6a5f.apps.googleusercontent.com",
            ]:
                if cid not in audiences:
                    audiences.append(cid)

            id_info = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                audience=audiences if audiences else None
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

            # Ensure platform administrator privileges
            if email.lower() == "ashenafi.deresa.cse@gmail.com":
                user.is_staff = True
                user.is_superuser = True

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
            message = f"Invalid Google token ({e})" if settings.DEBUG else "Invalid Google token or expired session."
            return Response(
                {"error": message},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Google authentication error: {e}")
            return Response(
                {"error": "Google authentication failed. Please try again or use email/password."},
                status=status.HTTP_400_BAD_REQUEST
            )