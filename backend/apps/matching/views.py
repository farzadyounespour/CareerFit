from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AnalyzeMatchRequestSerializer
from .services import analyze_resume_match


class AnalyzeMatchView(APIView):
    def post(self, request):
        serializer = AnalyzeMatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = analyze_resume_match(
            user_profile=serializer.validated_data.get("user_profile", {}),
            resume_text=serializer.validated_data["resume_text"],
            job_description=serializer.validated_data["job_description"],
        )
        return Response(result, status=status.HTTP_200_OK)

