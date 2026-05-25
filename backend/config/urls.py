from django.contrib import admin
from django.urls import include, path
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def health_check(_request):
    return Response({"status": "ok", "service": "CareerFit API"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/matches/", include("apps.matching.urls")),
    path("api/resumes/", include("apps.resumes.urls")),
]
