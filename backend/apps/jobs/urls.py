from django.urls import path

from .views import JobSearchView, SavedJobDetailView, SavedJobsView


urlpatterns = [
    path("search/", JobSearchView.as_view(), name="job-search"),
    path("saved/", SavedJobsView.as_view(), name="saved-jobs"),
    path("saved/<int:job_id>/", SavedJobDetailView.as_view(), name="saved-job-detail"),
]
