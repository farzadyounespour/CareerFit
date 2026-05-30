from rest_framework import serializers


class UserProfileSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    target_role = serializers.CharField(required=False, allow_blank=True)
    experience_level = serializers.CharField(required=False, allow_blank=True)
    work_preference = serializers.CharField(required=False, allow_blank=True)
    summary = serializers.CharField(required=False, allow_blank=True)


class AnalyzeMatchRequestSerializer(serializers.Serializer):
    user_profile = UserProfileSerializer(required=False)
    resume_text = serializers.CharField(max_length=50000)
    job_description = serializers.CharField(max_length=30000)
    resume_title = serializers.CharField(required=False, allow_blank=True, max_length=160)
    job_title = serializers.CharField(required=False, allow_blank=True, max_length=180)
    job_company = serializers.CharField(required=False, allow_blank=True, max_length=180)
    job_location = serializers.CharField(required=False, allow_blank=True, max_length=220)
    job_source = serializers.CharField(required=False, allow_blank=True, max_length=80)
    job_url = serializers.URLField(required=False, allow_blank=True)
    resume_id = serializers.IntegerField(required=False, min_value=1)
    use_llm = serializers.BooleanField(required=False, default=False)


class PreviewMatchRequestSerializer(serializers.Serializer):
    user_profile = UserProfileSerializer(required=False)
    resume_text = serializers.CharField(max_length=50000)
    job_description = serializers.CharField(max_length=30000)
