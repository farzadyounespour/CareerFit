from django.urls import path

from .views import (
    JobSearchView,
    JobUrlImportView,
    SavedJobDetailView,
    SavedJobPacketDraftsView,
    SavedJobsCsvView,
    SavedJobsView,
    SearchAlertDetailView,
    SearchAlertsView,
)


urlpatterns = [
    path("search/", JobSearchView.as_view(), name="job-search"),
    path("import-url/", JobUrlImportView.as_view(), name="job-import-url"),
    path("saved/", SavedJobsView.as_view(), name="saved-jobs"),
    path("saved/csv/", SavedJobsCsvView.as_view(), name="saved-jobs-csv"),
    path("saved/<int:job_id>/", SavedJobDetailView.as_view(), name="saved-job-detail"),
    path("saved/<int:job_id>/drafts/", SavedJobPacketDraftsView.as_view(), name="saved-job-drafts"),
    path("alerts/", SearchAlertsView.as_view(), name="search-alerts"),
    path("alerts/<int:alert_id>/", SearchAlertDetailView.as_view(), name="search-alert-detail"),
]
