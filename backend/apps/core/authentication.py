from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed


class ExpiringTokenAuthentication(TokenAuthentication):
    def authenticate_credentials(self, key):
        user, token = super().authenticate_credentials(key)
        expires_at = token.created + timedelta(hours=settings.CAREERFIT_TOKEN_TTL_HOURS)
        if timezone.now() >= expires_at:
            token.delete()
            raise AuthenticationFailed("Session expired. Please sign in again.")
        return user, token
