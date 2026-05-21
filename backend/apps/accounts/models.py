from django.db import models


class UserProfile(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    target_role = models.CharField(max_length=160, blank=True)
    experience_level = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

