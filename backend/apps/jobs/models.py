from django.db import models
from django.contrib.auth.models import User


class JobDescription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    title = models.CharField(max_length=180, blank=True)
    company = models.CharField(max_length=180, blank=True)
    location = models.CharField(max_length=220, blank=True)
    source = models.CharField(max_length=80, default="manual")
    source_url = models.URLField(blank=True)
    raw_text = models.TextField()
    is_saved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or "Manual job description"
