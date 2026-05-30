from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.resumes.models import Resume

from .models import JobDescription, SearchAlert
from .serializers import JobSearchSerializer, SavedJobSerializer, SearchAlertSerializer, TrackedJobUpdateSerializer
from .services import JobSearchError, search_jobs


class JobSearchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = JobSearchSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)

        try:
            search_result = search_jobs(
                title=serializer.validated_data["title"],
                location=serializer.validated_data.get("location", ""),
                country=serializer.validated_data.get("country", "us"),
                page=serializer.validated_data.get("page", 1),
                results_per_page=serializer.validated_data.get("results_per_page", 8),
                remote=serializer.validated_data.get("remote", False),
                workplace=serializer.validated_data.get("workplace", "any"),
                skills=serializer.validated_data.get("skills", ""),
                experience_level=serializer.validated_data.get("experience_level", "any"),
                employment_type=serializer.validated_data.get("employment_type", "any"),
                salary_min=serializer.validated_data.get("salary_min"),
                salary_max=serializer.validated_data.get("salary_max"),
            )
        except JobSearchError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        jobs = search_result["results"]
        count = search_result["count"]
        page = search_result["page"]
        results_per_page = search_result["results_per_page"]
        using_sample_data = search_result["using_sample_data"]
        providers = search_result["providers"]

        return Response(
            {
                "results": jobs,
                "source": providers[0] if len(providers) == 1 else "Multiple",
                "providers": providers,
                "provider_errors": search_result["provider_errors"],
                "using_sample_data": using_sample_data,
                "pagination": {
                    "page": page,
                    "results_per_page": results_per_page,
                    "count": count,
                    "total_pages": (count + results_per_page - 1) // results_per_page,
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
                    serialize_tracked_job(job)
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
            {"id": job.id, "job": serialize_tracked_job(job), "detail": "Job saved.", "created": created},
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

    def patch(self, request, job_id):
        job = JobDescription.objects.filter(id=job_id, user=request.user, is_saved=True).first()
        if not job:
            return Response({"detail": "Saved job not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TrackedJobUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        has_resume_version = "resume_version_id" in values
        resume_version_id = values.pop("resume_version_id", None)
        if has_resume_version:
            resume = Resume.objects.filter(id=resume_version_id, user=request.user).first() if resume_version_id else None
            if resume_version_id and not resume:
                return Response({"detail": "Resume version not found."}, status=status.HTTP_404_NOT_FOUND)
            job.resume_version = resume
        for field, value in values.items():
            setattr(job, field, value)
        job.save()
        return Response({"job": serialize_tracked_job(job)})


class SearchAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        alerts = SearchAlert.objects.filter(user=request.user).order_by("-created_at")
        return Response({"results": [serialize_search_alert(alert) for alert in alerts]})

    def post(self, request):
        serializer = SearchAlertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        values = serializer.validated_data
        values.pop("page", None)
        values.pop("results_per_page", None)
        values.pop("remote", None)
        alert = SearchAlert.objects.create(
            user=request.user,
            name=values.pop("name", "") or values["title"],
            **values,
        )
        return Response({"alert": serialize_search_alert(alert)}, status=status.HTTP_201_CREATED)


class SearchAlertDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, alert_id):
        alert = SearchAlert.objects.filter(id=alert_id, user=request.user).first()
        if not alert:
            return Response({"detail": "Search alert not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SearchAlertSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            if field not in {"page", "results_per_page", "remote"}:
                setattr(alert, field, value)
        alert.save()
        return Response({"alert": serialize_search_alert(alert)})

    def delete(self, request, alert_id):
        alert = SearchAlert.objects.filter(id=alert_id, user=request.user).first()
        if not alert:
            return Response({"detail": "Search alert not found."}, status=status.HTTP_404_NOT_FOUND)
        alert.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def serialize_tracked_job(job):
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "location": job.location,
        "description": job.raw_text,
        "url": job.source_url,
        "source": job.source,
        "status": job.status,
        "notes": job.notes,
        "recruiter_name": job.recruiter_name,
        "recruiter_email": job.recruiter_email,
        "salary_text": job.salary_text,
        "follow_up_date": job.follow_up_date,
        "interview_date": job.interview_date,
        "applied_at": job.applied_at,
        "excitement": job.excitement,
        "resume_version_id": job.resume_version_id,
        "resume_version_title": job.resume_version.title if job.resume_version else "",
        "created_at": job.created_at,
    }


def serialize_search_alert(alert):
    return {
        "id": alert.id,
        "name": alert.name,
        "title": alert.title,
        "location": alert.location,
        "country": alert.country,
        "workplace": alert.workplace,
        "skills": alert.skills,
        "experience_level": alert.experience_level,
        "employment_type": alert.employment_type,
        "salary_min": alert.salary_min,
        "salary_max": alert.salary_max,
        "frequency": alert.frequency,
        "is_active": alert.is_active,
        "created_at": alert.created_at,
    }
