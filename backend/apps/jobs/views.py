import csv
from io import StringIO

from django.http import HttpResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.resumes.models import Resume
from apps.matching.llm_services import generate_application_packet
from apps.matching.throttles import LlmCoachingThrottle

from .models import JobDescription, SearchAlert
from .serializers import (
    JobSearchSerializer,
    JobUrlImportSerializer,
    PacketDraftRequestSerializer,
    SavedJobSerializer,
    SearchAlertSerializer,
    TrackedJobUpdateSerializer,
)
from .services import JobImportError, JobSearchError, build_packet_drafts, import_job_from_url, search_jobs


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
            "workplace": values.get("workplace", ""),
            "employment_type": values.get("employment_type", ""),
            "experience_level": values.get("experience_level", ""),
            "salary_text": values.get("salary_text", ""),
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
        if "tasks" in values:
            values["tasks"] = [
                {
                    **task,
                    "due_date": task["due_date"].isoformat() if task.get("due_date") else None,
                }
                for task in values["tasks"]
            ]
        for field, value in values.items():
            setattr(job, field, value)
        job.save()
        return Response({"job": serialize_tracked_job(job)})


class JobUrlImportView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = JobUrlImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            job = import_job_from_url(serializer.validated_data["url"])
        except JobImportError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"job": job})


class SavedJobPacketDraftsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, job_id):
        job = JobDescription.objects.filter(id=job_id, user=request.user, is_saved=True).first()
        if not job:
            return Response({"detail": "Saved job not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PacketDraftRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = getattr(request.user, "userprofile", None)
        drafts = build_packet_drafts(job, candidate_name=getattr(profile, "name", "") or request.user.first_name)
        use_ai = serializer.validated_data["use_ai"]
        if use_ai:
            throttle = LlmCoachingThrottle()
            if not throttle.allow_request(request, self):
                self.throttled(request, throttle.wait())
            resume = job.resume_version or Resume.objects.filter(user=request.user).order_by("-created_at").first()
            ai_drafts = generate_application_packet(
                job=job,
                resume_text=resume.raw_text if resume else "",
                requested=True,
                authorized=True,
            )
            drafts.update(ai_drafts)
        job.cover_letter = drafts["cover_letter"]
        job.follow_up_email = drafts["follow_up_email"]
        job.save(update_fields=["cover_letter", "follow_up_email"])
        return Response(
            {
                "job": serialize_tracked_job(job),
                "detail": (
                    "AI-assisted drafts created. Review and personalize them before sending."
                    if use_ai and ai_drafts
                    else "Starter drafts created. Review and personalize them before sending."
                ),
                "ai_enhanced": bool(use_ai and ai_drafts),
            }
        )


class SavedJobsCsvView(APIView):
    permission_classes = [IsAuthenticated]
    fields = [
        "title",
        "company",
        "location",
        "status",
        "source_url",
        "salary_text",
        "follow_up_date",
        "interview_date",
        "applied_at",
        "recruiter_name",
        "recruiter_email",
        "notes",
    ]

    def get(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="careerfit-applications.csv"'
        writer = csv.DictWriter(response, fieldnames=self.fields)
        writer.writeheader()
        for job in JobDescription.objects.filter(user=request.user, is_saved=True).order_by("-created_at"):
            writer.writerow({field: getattr(job, field) or "" for field in self.fields})
        return response

    def post(self, request):
        uploaded_file = request.FILES.get("file")
        if not uploaded_file:
            return Response({"detail": "Choose a CSV file to import."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            rows = csv.DictReader(StringIO(uploaded_file.read().decode("utf-8-sig")))
            created = 0
            for row in rows:
                title = (row.get("title") or "").strip()
                if not title:
                    continue
                JobDescription.objects.create(
                    user=request.user,
                    title=title[:180],
                    company=(row.get("company") or "")[:180],
                    location=(row.get("location") or "")[:220],
                    source_url=(row.get("source_url") or "")[:200],
                    salary_text=(row.get("salary_text") or "")[:120],
                    status=row.get("status") if row.get("status") in dict(JobDescription.STATUS_CHOICES) else "saved",
                    follow_up_date=row.get("follow_up_date") or None,
                    interview_date=row.get("interview_date") or None,
                    applied_at=row.get("applied_at") or None,
                    recruiter_name=(row.get("recruiter_name") or "")[:160],
                    recruiter_email=(row.get("recruiter_email") or "")[:254],
                    notes=(row.get("notes") or "")[:5000],
                    raw_text=(row.get("description") or "Imported from tracker CSV.")[:30000],
                    source="CSV import",
                    is_saved=True,
                )
                created += 1
        except (UnicodeDecodeError, csv.Error, ValueError):
            return Response({"detail": "Unable to import that CSV file."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"detail": f"Imported {created} application(s).", "created": created}, status=status.HTTP_201_CREATED)


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
        "workplace": job.workplace,
        "employment_type": job.employment_type,
        "experience_level": job.experience_level,
        "status": job.status,
        "notes": job.notes,
        "cover_letter": job.cover_letter,
        "follow_up_email": job.follow_up_email,
        "interview_notes": job.interview_notes,
        "personal_pitch": job.personal_pitch,
        "tasks": job.tasks,
        "star_stories": job.star_stories,
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
