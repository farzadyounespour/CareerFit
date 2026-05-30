from django.urls import path

from .views import JobSearchView, SavedJobsView


urlpatterns = [
    path("search/", JobSearchView.as_view(), name="job-search"),
    path("saved/", SavedJobsView.as_view(), name="saved-jobs"),
]
