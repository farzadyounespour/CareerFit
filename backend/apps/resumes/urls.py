from django.urls import path

from .views import ResumeDetailView, ResumeUploadView


urlpatterns = [
    path("upload/", ResumeUploadView.as_view(), name="resume-upload"),
    path("<int:resume_id>/", ResumeDetailView.as_view(), name="resume-detail"),
]
