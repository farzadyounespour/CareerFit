from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import JobDescription
from .serializers import JobSearchSerializer, SavedJobSerializer
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
                page=serializer.validated_data.get("page", 1),
                results_per_page=serializer.validated_data.get("results_per_page", 8),
                remote=serializer.validated_data.get("remote", False),
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


class SavedJobsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        jobs = JobDescription.objects.filter(user=request.user, is_saved=True).order_by("-created_at")
        return Response(
            {
                "results": [
                    {
                        "id": job.id,
                        "title": job.title,
                        "company": job.company,
                        "location": job.location,
                        "description": job.raw_text,
                        "url": job.source_url,
                        "source": job.source,
                        "created_at": job.created_at,
                    }
                    for job in jobs
                ]
            }
        )

    def post(self, request):
        serializer = SavedJobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = JobDescription.objects.create(
            user=request.user,
            title=serializer.validated_data["title"],
            company=serializer.validated_data.get("company", ""),
            location=serializer.validated_data.get("location", ""),
            source=serializer.validated_data.get("source") or "manual",
            source_url=serializer.validated_data.get("url", ""),
            raw_text=serializer.validated_data["description"],
            is_saved=True,
        )
        return Response({"id": job.id, "detail": "Job saved."}, status=201)
