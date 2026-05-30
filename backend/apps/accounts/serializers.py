from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import UserProfile


class RegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    target_role = serializers.CharField(max_length=160, required=False, allow_blank=True)

    def validate_email(self, email):
        if User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email.lower()

    def validate_password(self, password):
        try:
            validate_password(password)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return password

    def create(self, validated_data):
        email = validated_data["email"]
        user = User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=validated_data["name"],
        )
        UserProfile.objects.create(
            user=user,
            name=validated_data["name"],
            email=email,
            target_role=validated_data.get("target_role", ""),
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs["email"].lower(), password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class UserProfileUpdateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=40, required=False, allow_blank=True)
    location = serializers.CharField(max_length=160, required=False, allow_blank=True)
    target_role = serializers.CharField(max_length=160, required=False, allow_blank=True)
    experience_level = serializers.CharField(max_length=80, required=False, allow_blank=True)
    work_preference = serializers.CharField(max_length=120, required=False, allow_blank=True)
    summary = serializers.CharField(max_length=1200, required=False, allow_blank=True)

    def validate_email(self, email):
        user = self.context["user"]
        if email and User.objects.filter(username__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email.lower()

    def update(self, user, validated_data):
        profile, _created = UserProfile.objects.get_or_create(
            user=user,
            defaults={"name": user.first_name or user.username, "email": user.email},
        )
        if "name" in validated_data:
            profile.name = validated_data["name"]
            user.first_name = validated_data["name"]
        if "email" in validated_data and validated_data["email"]:
            profile.email = validated_data["email"]
            user.email = validated_data["email"]
            user.username = validated_data["email"]

        for field in ("phone", "location", "target_role", "experience_level", "work_preference", "summary"):
            if field in validated_data:
                setattr(profile, field, validated_data[field])

        user.save()
        profile.save()
        return user
