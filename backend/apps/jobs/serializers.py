from rest_framework import serializers


class JobSearchSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=180)
    location = serializers.CharField(max_length=180, required=False, allow_blank=True)
    country = serializers.ChoiceField(
        choices=["us", "ca", "gb"],
        default="us",
        required=False,
    )
