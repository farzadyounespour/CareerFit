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


class SavedJobSerializer(serializers.Serializer):
    external_id = serializers.CharField(required=False, allow_blank=True)
    title = serializers.CharField(max_length=180)
    company = serializers.CharField(max_length=180, required=False, allow_blank=True)
    description = serializers.CharField(max_length=30000)
    location = serializers.CharField(max_length=220, required=False, allow_blank=True)
    url = serializers.URLField(required=False, allow_blank=True)
    source = serializers.CharField(max_length=80, required=False, allow_blank=True)
