from django.urls import path

from .views import AnalyzeMatchView, ReportHistoryView


urlpatterns = [
    path("analyze/", AnalyzeMatchView.as_view(), name="analyze-match"),
    path("history/", ReportHistoryView.as_view(), name="report-history"),
]
