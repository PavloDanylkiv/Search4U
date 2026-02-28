import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class GoogleLoginView(APIView):
    """
    POST /api/auth/google/
    Body: { "credential": "<google_id_token>" }
    Returns: { "access": "...", "refresh": "..." }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential")
        if not credential:
            return Response(
                {"error": "credential is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verify the ID token with Google
        r = requests.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": credential},
            timeout=10,
        )
        if r.status_code != 200:
            return Response(
                {"error": "Invalid Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        google_data = r.json()

        # Optionally verify audience matches our client_id
        client_id = (
            settings.SOCIALACCOUNT_PROVIDERS.get("google", {})
            .get("APP", {})
            .get("client_id", "")
        )
        token_aud = google_data.get("aud", "")
        if client_id and token_aud != client_id:
            return Response(
                {"error": "Token audience mismatch"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = google_data.get("email")
        if not email:
            return Response(
                {"error": "Email not provided by Google"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        first_name = google_data.get("given_name", "")
        last_name = google_data.get("family_name", "")

        # Find or create user
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
            },
        )

        # Update name if fields are empty (first Google login after email signup)
        if not created:
            updated = False
            if not user.first_name and first_name:
                user.first_name = first_name
                updated = True
            if not user.last_name and last_name:
                user.last_name = last_name
                updated = True
            if updated:
                user.save(update_fields=["first_name", "last_name"])

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )
