from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserProfile
from .serializers import LoginSerializer, RegisterSerializer, UserProfileUpdateSerializer


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
    }


class RegisterView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _created = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": serialize_user(user)}, status=201)


class LoginView(APIView):
    authentication_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, _created = Token.objects.get_or_create(user=user)
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


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.auth.delete()
        return Response(status=204)
