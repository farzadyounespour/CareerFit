from django.urls import path

from .views import AnalyzeMatchView, PreviewMatchView, ReportHistoryDetailView, ReportHistoryView


urlpatterns = [
    path("analyze/", AnalyzeMatchView.as_view(), name="analyze-match"),
    path("preview/", PreviewMatchView.as_view(), name="preview-match"),
    path("history/", ReportHistoryView.as_view(), name="report-history"),
    path("history/<int:report_id>/", ReportHistoryDetailView.as_view(), name="report-history-detail"),
]
