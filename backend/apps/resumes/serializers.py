from rest_framework import serializers


class ResumeUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, resume_file):
        max_size_mb = 5
        if resume_file.size > max_size_mb * 1024 * 1024:
            raise serializers.ValidationError(f"Resume files must be {max_size_mb} MB or smaller.")
        return resume_file
