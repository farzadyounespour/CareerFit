from rest_framework import serializers


class JobSearchSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    location = serializers.CharField(max_length=180, required=False, allow_blank=True)
    country = serializers.ChoiceField(
        choices=["us", "ca", "gb"],
        default="us",
        required=False,
    )
    page = serializers.IntegerField(min_value=1, default=1, required=False)
    results_per_page = serializers.IntegerField(min_value=1, max_value=20, default=8, required=False)
    remote = serializers.BooleanField(default=False, required=False)
    workplace = serializers.ChoiceField(
        choices=["any", "remote", "hybrid", "on_site"],
        default="any",
        required=False,
    )
    skills = serializers.CharField(max_length=180, required=False, allow_blank=True)
    excluded_keywords = serializers.CharField(max_length=240, required=False, allow_blank=True)
    experience_level = serializers.ChoiceField(
        choices=["any", "internship", "entry", "mid", "senior"],
        default="any",
        required=False,
    )
    employment_type = serializers.ChoiceField(
        choices=["any", "full_time", "part_time", "contract", "permanent"],
        default="any",
        required=False,
    )
    salary_min = serializers.IntegerField(min_value=0, required=False)
    salary_max = serializers.IntegerField(min_value=0, required=False)

    def validate(self, attrs):
        salary_min = attrs.get("salary_min")
        salary_max = attrs.get("salary_max")
        if salary_min is not None and salary_max is not None and salary_max < salary_min:
            raise serializers.ValidationError("Maximum salary must be greater than or equal to minimum salary.")
        return attrs


class SavedJobSerializer(serializers.Serializer):
    external_id = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(max_length=180)
    company = serializers.CharField(max_length=180, required=False, allow_blank=True)
    description = serializers.CharField(max_length=30000)
    location = serializers.CharField(max_length=220, required=False, allow_blank=True)
    url = serializers.URLField(required=False, allow_blank=True)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)
    workplace = serializers.CharField(max_length=24, required=False, allow_blank=True)
    employment_type = serializers.CharField(max_length=24, required=False, allow_blank=True)
    experience_level = serializers.CharField(max_length=24, required=False, allow_blank=True)
    salary_text = serializers.CharField(max_length=120, required=False, allow_blank=True)


class JobUrlImportSerializer(serializers.Serializer):
    url = serializers.URLField()


class PacketDraftRequestSerializer(serializers.Serializer):
    use_ai = serializers.BooleanField(default=False, required=False)


class TrackerTaskSerializer(serializers.Serializer):
    id = serializers.CharField(max_length=80)
    title = serializers.CharField(max_length=180)
    due_date = serializers.DateField(required=False, allow_null=True)
    completed = serializers.BooleanField(default=False, required=False)


class StarStorySerializer(serializers.Serializer):
    id = serializers.CharField(max_length=80)
    title = serializers.CharField(max_length=180)
    notes = serializers.CharField(max_length=3000, required=False, allow_blank=True)


class TrackedJobUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["saved", "preparing", "applied", "interview", "offer", "rejected", "archived"],
        required=False,
    )
    notes = serializers.CharField(max_length=5000, required=False, allow_blank=True)
    recruiter_name = serializers.CharField(max_length=160, required=False, allow_blank=True)
    recruiter_email = serializers.EmailField(required=False, allow_blank=True)
    salary_text = serializers.CharField(max_length=120, required=False, allow_blank=True)
    follow_up_date = serializers.DateField(required=False, allow_null=True)
    interview_date = serializers.DateField(required=False, allow_null=True)
    applied_at = serializers.DateField(required=False, allow_null=True)
    excitement = serializers.IntegerField(min_value=1, max_value=5, required=False)
    resume_version_id = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    cover_letter = serializers.CharField(max_length=12000, required=False, allow_blank=True)
    follow_up_email = serializers.CharField(max_length=6000, required=False, allow_blank=True)
    interview_notes = serializers.CharField(max_length=6000, required=False, allow_blank=True)
    personal_pitch = serializers.CharField(max_length=3000, required=False, allow_blank=True)
    tasks = TrackerTaskSerializer(many=True, required=False)
    star_stories = StarStorySerializer(many=True, required=False)


class SearchAlertSerializer(JobSearchSerializer):
    name = serializers.CharField(max_length=180, required=False, allow_blank=True)
    frequency = serializers.ChoiceField(choices=["daily", "weekly"], default="weekly", required=False)
    is_active = serializers.BooleanField(default=True, required=False)
