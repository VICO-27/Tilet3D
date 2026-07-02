import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get("token")

        if not token:
            return Response({"error": "Token required"}, status=400)

        # verify token with Google
        google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
        response = requests.get(google_url)

        if response.status_code != 200:
            return Response({"error": "Invalid Google token"}, status=400)

        data = response.json()

        email = data.get("email")

        if not email:
            return Response({"error": "Google account has no email"}, status=400)

        user, created = User.objects.get_or_create(
            email=email
        )

        if created:
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email
        }, status=status.HTTP_200_OK)