from django.contrib.auth.models import User
from django.db import models

from apps.jobs.models import JobDescription
from apps.resumes.models import Resume


class MatchReport(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    resume = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True)
    job = models.ForeignKey(JobDescription, on_delete=models.SET_NULL, null=True, blank=True)
    target_role = models.CharField(max_length=180, blank=True)
    result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.target_role or "CareerFit report"
