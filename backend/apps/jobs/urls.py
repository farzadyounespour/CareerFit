from django.urls import path

from .views import JobSearchView, SavedJobDetailView, SavedJobsView, SearchAlertDetailView, SearchAlertsView


urlpatterns = [
    path("search/", JobSearchView.as_view(), name="job-search"),
    path("saved/", SavedJobsView.as_view(), name="saved-jobs"),
    path("saved/<int:job_id>/", SavedJobDetailView.as_view(), name="saved-job-detail"),
    path("alerts/", SearchAlertsView.as_view(), name="search-alerts"),
    path("alerts/<int:alert_id>/", SearchAlertDetailView.as_view(), name="search-alert-detail"),
]
