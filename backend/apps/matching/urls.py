from django.urls import path

from .views import AnalyzeMatchView


urlpatterns = [
    path("analyze/", AnalyzeMatchView.as_view(), name="analyze-match"),
]

