from django.urls import path

from .views import AnalyzeMatchView, CoachMatchView, PreviewMatchView, ReportHistoryDetailView, ReportHistoryView, ResumeDraftView


urlpatterns = [
    path("analyze/", AnalyzeMatchView.as_view(), name="analyze-match"),
    path("preview/", PreviewMatchView.as_view(), name="preview-match"),
    path("coach/", CoachMatchView.as_view(), name="coach-match"),
    path("resume-draft/", ResumeDraftView.as_view(), name="resume-draft"),
    path("history/", ReportHistoryView.as_view(), name="report-history"),
    path("history/<int:report_id>/", ReportHistoryDetailView.as_view(), name="report-history-detail"),
]
