from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import (
    EmailVerificationSerializer,
    LoginSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserProfileUpdateSerializer,
)


def serialize_user(user):
    profile = UserProfile.objects.filter(user=user).first()
    return {
        "id": user.id,
        "name": profile.name if profile else user.first_name,
        "email": user.email,
        "phone": profile.phone if profile else "",
        "location": profile.location if profile else "",
        "target_role": profile.target_role if profile else "",
        "experience_level": profile.experience_level if profile else "",
        "work_preference": profile.work_preference if profile else "",
        "summary": profile.summary if profile else "",
        "email_verified": profile.email_verified if profile else False,
    }


class RegisterView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token = _rotate_token(user)
        payload = {"token": token.key, "user": serialize_user(user)}
        if settings.DEBUG:
            payload["verification_url"] = _build_email_verification_url(user)
        return Response(payload, status=201)


class LoginView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token = _rotate_token(user)
        return Response({"token": token.key, "user": serialize_user(user)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"user": serialize_user(request.user)})

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"user": request.user},
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"user": serialize_user(user)})

    def delete(self, request):
        request.user.delete()
        return Response(status=204)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=204)


class PasswordResetRequestView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(username__iexact=serializer.validated_data["email"]).first()
        payload = {"detail": "If that account exists, a password reset link has been sent."}
        if user:
            reset_url = _build_password_reset_url(user)
            _send_account_email(user.email, "CareerFit password reset", f"Reset your password: {reset_url}")
            if settings.DEBUG:
                payload["reset_url"] = reset_url
        return Response(payload)


class PasswordResetConfirmView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _decode_user(serializer.validated_data["uid"])
        if not user or not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Password reset link is invalid or expired."}, status=400)
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()
        return Response({"detail": "Password updated. Please sign in again."})


class EmailVerificationRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        verification_url = _build_email_verification_url(request.user)
        _send_account_email(
            request.user.email,
            "Verify your CareerFit email",
            f"Verify your email address: {verification_url}",
        )
        payload = {"detail": "Verification link sent."}
        if settings.DEBUG:
            payload["verification_url"] = verification_url
        return Response(payload)


class EmailVerificationConfirmView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = _decode_user(serializer.validated_data["uid"])
        if not user or not default_token_generator.check_token(user, serializer.validated_data["token"]):
            return Response({"detail": "Verification link is invalid or expired."}, status=400)
        profile = UserProfile.objects.get(user=user)
        profile.email_verified = True
        profile.save(update_fields=["email_verified"])
        return Response({"detail": "Email address verified."})


def _rotate_token(user):
    Token.objects.filter(user=user).delete()
    return Token.objects.create(user=user)


def _decode_user(uid):
    try:
        return User.objects.filter(pk=force_str(urlsafe_base64_decode(uid))).first()
    except (TypeError, ValueError, OverflowError):
        return None


def _build_password_reset_url(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{settings.FRONTEND_URL}/?reset_uid={uid}&reset_token={token}"


def _build_email_verification_url(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{settings.FRONTEND_URL}/?verify_uid={uid}&verify_token={token}"


def _send_account_email(recipient, subject, body):
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [recipient], fail_silently=True)
