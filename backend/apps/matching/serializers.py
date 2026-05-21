from rest_framework import serializers


class UserProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    target_role = serializers.CharField(required=False, allow_blank=True)
    experience_level = serializers.CharField(required=False, allow_blank=True)


class AnalyzeMatchRequestSerializer(serializers.Serializer):
    user_profile = UserProfileSerializer(required=False)
    resume_text = serializers.CharField()
    job_description = serializers.CharField()

