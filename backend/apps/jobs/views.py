from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import JobSearchSerializer
from .services import JobSearchError, search_adzuna_jobs


class JobSearchView(APIView):
    def get(self, request):
        serializer = JobSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        try:
            jobs = search_adzuna_jobs(
                title=serializer.validated_data["title"],
                location=serializer.validated_data.get("location", ""),
                country=serializer.validated_data.get("country", "us"),
            )
        except JobSearchError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        using_sample_data = any(job.get("source") == "Sample" for job in jobs)

        return Response(
            {
                "results": jobs,
                "source": "Sample" if using_sample_data else "Adzuna",
                "using_sample_data": using_sample_data,
            },
            status=status.HTTP_200_OK,
        )
