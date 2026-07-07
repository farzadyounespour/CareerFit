from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.jobs.models import JobDescription
from apps.resumes.models import Resume

from .models import MatchReport
from .serializers import AnalyzeMatchRequestSerializer, CoachMatchRequestSerializer, PreviewMatchRequestSerializer, ResumeDraftRequestSerializer
from .llm_services import enrich_match_report, generate_tailored_resume
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
                "semantic_matches": _semantic_matches(result),
                "requirements_summary": _requirements_summary(result),
                "priority_fixes": result.get("priority_fixes", [])[:3],
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


class ResumeDraftView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ResumeDraftRequestSerializer(data=request.data)
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
                "resume_generation": generate_tailored_resume(
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
                        "company": report.job.company if report.job else "",
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


def _semantic_matches(result):
    matches = []
    for category, requirements in result.get("requirements", {}).items():
        for requirement in requirements:
            if not requirement.get("match_label"):
                continue
            matches.append(
                {
                    "category": category,
                    "label": requirement["match_label"],
                    "requirement": requirement["text"],
                    "evidence": requirement.get("semantic_evidence", ""),
                    "score": requirement["score"],
                    "explanation": requirement.get("semantic_explanation", ""),
                }
            )
    return matches


def _requirements_summary(result):
    requirements = result.get("requirements", {})
    counts = {category: len(items) for category, items in requirements.items()}
    gap_items = [
        {**item, "category": category}
        for category in ("missing", "weak", "partial")
        for item in requirements.get(category, [])
    ]
    evidence_items = [
        {**item, "category": category}
        for category in ("matched", "partial")
        for item in requirements.get(category, [])
        if item.get("best_evidence") or item.get("semantic_evidence") or item.get("evidence")
    ]
    gap_items.sort(key=lambda item: ({"high": 0, "medium": 1, "low": 2}.get(item.get("priority", "medium"), 1), item.get("score", 0)))
    evidence_items.sort(key=lambda item: item.get("score", 0), reverse=True)
    return {
        "counts": counts,
        "top_gaps": [_requirement_summary_item(item) for item in gap_items[:3]],
        "top_evidence": [_requirement_summary_item(item) for item in evidence_items[:2]],
    }


def _requirement_summary_item(item):
    return {
        "category": item.get("category", ""),
        "text": item.get("text", ""),
        "score": item.get("score", 0),
        "priority": item.get("priority", "medium"),
        "evidence": item.get("semantic_evidence") or item.get("best_evidence") or "",
        "match_basis": item.get("match_basis") or item.get("match_label") or "",
    }
