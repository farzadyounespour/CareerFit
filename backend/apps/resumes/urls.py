from django.urls import path

from .views import ResumeDetailView, ResumeUploadView, ResumeVersionsView


urlpatterns = [
    path("", ResumeVersionsView.as_view(), name="resume-versions"),
    path("upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("<int:resume_id>/", ResumeDetailView.as_view(), name="resume-detail"),
]
