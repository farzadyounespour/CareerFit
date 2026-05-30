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
            search_result = search_adzuna_jobs(
                title=serializer.validated_data["title"],
                location=serializer.validated_data.get("location", ""),
                country=serializer.validated_data.get("country", "us"),
                page=serializer.validated_data.get("page", 1),
                results_per_page=serializer.validated_data.get("results_per_page", 8),
                remote=serializer.validated_data.get("remote", False),
            )
        except JobSearchError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        jobs = search_result["results"]
        count = search_result["count"]
        page = search_result["page"]
        results_per_page = search_result["results_per_page"]
        using_sample_data = any(job.get("source") == "Sample" for job in jobs)

        return Response(
            {
                "results": jobs,
                "source": "Sample" if using_sample_data else "Adzuna",
                "using_sample_data": using_sample_data,
                "pagination": {
                    "page": page,
                    "results_per_page": results_per_page,
                    "count": count,
                    "has_previous": page > 1,
                    "has_next": page * results_per_page < count,
                },
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
        values = serializer.validated_data
        source = values.get("source") or "manual"
        external_id = values.get("external_id", "")
        defaults = {
            "title": values["title"],
            "company": values.get("company", ""),
            "location": values.get("location", ""),
            "source_url": values.get("url", ""),
            "raw_text": values["description"],
            "is_saved": True,
        }
        if external_id:
            job, created = JobDescription.objects.update_or_create(
                user=request.user,
                source=source,
                external_id=external_id,
                defaults=defaults,
            )
        else:
            job = JobDescription.objects.create(
                user=request.user,
                source=source,
                external_id="",
                **defaults,
            )
            created = True
        return Response(
            {"id": job.id, "detail": "Job saved.", "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class SavedJobDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, job_id):
        job = JobDescription.objects.filter(id=job_id, user=request.user, is_saved=True).first()
        if not job:
            return Response({"detail": "Saved job not found."}, status=status.HTTP_404_NOT_FOUND)
        job.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
