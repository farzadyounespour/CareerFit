from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import JobDescription
from apps.resumes.models import Resume

from .models import MatchReport
from .serializers import AnalyzeMatchRequestSerializer, CoachMatchRequestSerializer, PreviewMatchRequestSerializer
from .llm_services import enrich_match_report
from .services import analyze_resume_match
from .throttles import LlmCoachingThrottle


class AnalyzeMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AnalyzeMatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = analyze_resume_match(
            user_profile=serializer.validated_data.get("user_profile", {}),
            resume_text=serializer.validated_data["resume_text"],
            job_description=serializer.validated_data["job_description"],
        )
        use_llm = serializer.validated_data["use_llm"]
        if use_llm:
            throttle = LlmCoachingThrottle()
            if not throttle.allow_request(request, self):
                self.throttled(request, throttle.wait())
        result["ai_coaching"] = enrich_match_report(
            match_result=result,
            resume_text=serializer.validated_data["resume_text"],
            job_description=serializer.validated_data["job_description"],
            requested=use_llm,
            authorized=request.user.is_authenticated,
        )
        if request.user.is_authenticated:
            resume = self._get_or_create_resume(request.user, serializer.validated_data)
            job = JobDescription.objects.create(
                user=request.user,
                title=serializer.validated_data.get("job_title", ""),
                company=serializer.validated_data.get("job_company", ""),
                location=serializer.validated_data.get("job_location", ""),
                source_url=serializer.validated_data.get("job_url", ""),
                raw_text=serializer.validated_data["job_description"],
                source=serializer.validated_data.get("job_source") or "analysis",
            )
            report = MatchReport.objects.create(
                user=request.user,
                resume=resume,
                job=job,
                target_role=result["summary"]["target_role"],
                resume_text_snapshot=serializer.validated_data["resume_text"],
                job_description_snapshot=serializer.validated_data["job_description"],
                result=result,
            )
            result["report_id"] = report.id
        return Response(result, status=status.HTTP_200_OK)

    @staticmethod
    def _get_or_create_resume(user, validated_data):
        resume_id = validated_data.get("resume_id")
        if resume_id:
            resume = Resume.objects.filter(id=resume_id, user=user).first()
            if resume:
                resume.title = validated_data.get("resume_title") or resume.title
                resume.raw_text = validated_data["resume_text"]
                resume.save(update_fields=["title", "raw_text"])
                return resume
        return Resume.objects.create(
            user=user,
            title=validated_data.get("resume_title") or "Analyzed resume",
            raw_text=validated_data["resume_text"],
        )


class PreviewMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PreviewMatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = analyze_resume_match(
            user_profile=serializer.validated_data.get("user_profile", {}),
            resume_text=serializer.validated_data["resume_text"],
            job_description=serializer.validated_data["job_description"],
        )
        return Response(
            {
                "summary": result["summary"],
                "skills": result["skills"],
            },
            status=status.HTTP_200_OK,
        )


class CoachMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CoachMatchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        throttle = LlmCoachingThrottle()
        if not throttle.allow_request(request, self):
            self.throttled(request, throttle.wait())
        result = analyze_resume_match(
            user_profile=serializer.validated_data.get("user_profile", {}),
            resume_text=serializer.validated_data["resume_text"],
            job_description=serializer.validated_data["job_description"],
        )
        return Response(
            {
                "ai_coaching": enrich_match_report(
                    match_result=result,
                    resume_text=serializer.validated_data["resume_text"],
                    job_description=serializer.validated_data["job_description"],
                    requested=True,
                    authorized=request.user.is_authenticated,
                )
            },
            status=status.HTTP_200_OK,
        )


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reports = MatchReport.objects.filter(user=request.user).order_by("-created_at")[:30]
        return Response(
            {
                "results": [
                    {
                        "id": report.id,
                        "target_role": report.target_role,
                        "created_at": report.created_at,
                        "summary": report.result.get("summary", {}),
                        "resume_text": report.resume_text_snapshot or (report.resume.raw_text if report.resume else ""),
                        "job_description": report.job_description_snapshot or (report.job.raw_text if report.job else ""),
                        "result": report.result,
                    }
                    for report in reports
                ]
            }
        )


class ReportHistoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, report_id):
        report = MatchReport.objects.filter(id=report_id, user=request.user).first()
        if not report:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
