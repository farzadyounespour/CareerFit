from django.db import models


class JobDescription(models.Model):
    title = models.CharField(max_length=180, blank=True)
    company = models.CharField(max_length=180, blank=True)
    source = models.CharField(max_length=80, default="manual")
    raw_text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or "Manual job description"

