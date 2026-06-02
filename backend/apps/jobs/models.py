from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q

from apps.resumes.models import Resume


class JobDescription(models.Model):
    STATUS_CHOICES = [
        ("saved", "Saved"),
        ("preparing", "Preparing"),
        ("applied", "Applied"),
        ("interview", "Interview"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("archived", "Archived"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    resume_version = models.ForeignKey(Resume, on_delete=models.SET_NULL, null=True, blank=True)
    external_id = models.CharField(max_length=220, blank=True)
    title = models.CharField(max_length=180, blank=True)
    company = models.CharField(max_length=180, blank=True)
    location = models.CharField(max_length=220, blank=True)
    source = models.CharField(max_length=80, default="manual")
    source_url = models.URLField(blank=True)
    raw_text = models.TextField()
    workplace = models.CharField(max_length=24, blank=True)
    employment_type = models.CharField(max_length=24, blank=True)
    experience_level = models.CharField(max_length=24, blank=True)
    is_saved = models.BooleanField(default=False)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="saved")
    notes = models.TextField(blank=True)
    cover_letter = models.TextField(blank=True)
    follow_up_email = models.TextField(blank=True)
    interview_notes = models.TextField(blank=True)
    personal_pitch = models.TextField(blank=True)
    tasks = models.JSONField(default=list, blank=True)
    star_stories = models.JSONField(default=list, blank=True)
    recruiter_name = models.CharField(max_length=160, blank=True)
    recruiter_email = models.EmailField(blank=True)
    salary_text = models.CharField(max_length=120, blank=True)
    follow_up_date = models.DateField(null=True, blank=True)
    interview_date = models.DateField(null=True, blank=True)
    applied_at = models.DateField(null=True, blank=True)
    excitement = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title or "Manual job description"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "source", "external_id"],
                condition=~Q(external_id=""),
                name="unique_saved_job_external_id_per_user_source",
            )
        ]


class SearchAlert(models.Model):
    FREQUENCY_CHOICES = [("daily", "Daily"), ("weekly", "Weekly")]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="search_alerts")
    name = models.CharField(max_length=180)
    title = models.CharField(max_length=180)
    location = models.CharField(max_length=180, blank=True)
    country = models.CharField(max_length=2, default="us")
    workplace = models.CharField(max_length=24, default="any")
    skills = models.CharField(max_length=180, blank=True)
    excluded_keywords = models.CharField(max_length=240, blank=True)
    experience_level = models.CharField(max_length=24, default="any")
    employment_type = models.CharField(max_length=24, default="any")
    salary_min = models.PositiveIntegerField(null=True, blank=True)
    salary_max = models.PositiveIntegerField(null=True, blank=True)
    frequency = models.CharField(max_length=12, choices=FREQUENCY_CHOICES, default="weekly")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
