from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .parsers import ResumeParseError, extract_resume_text
from .serializers import ResumeUploadSerializer


class ResumeUploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = ResumeUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        resume_file = serializer.validated_data["file"]
        try:
            text = extract_resume_text(resume_file)
        except ResumeParseError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        payload = {
            "filename": resume_file.name,
            "text": text,
            "character_count": len(text),
        }
        if request.user.is_authenticated:
            resume = request.user.resume_set.create(title=resume_file.name, raw_text=text)
            payload["resume_id"] = resume.id

        return Response(payload, status=status.HTTP_200_OK)
