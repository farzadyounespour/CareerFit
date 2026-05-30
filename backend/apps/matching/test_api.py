from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.test import override_settings

from .models import MatchReport
from apps.resumes.models import Resume


class MatchPersistenceApiTests(APITestCase):
    def test_signed_in_analysis_is_saved_to_history(self):
        user = User.objects.create_user(username="student@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/matches/analyze/",
            {
                "user_profile": {"target_role": "Data Analyst"},
                "resume_text": "Summary Skills Experience Education student@example.com +1 514 555 1212 Montreal Python SQL",
                "job_description": "Required Python and SQL experience for dashboards.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(MatchReport.objects.filter(user=user).count(), 1)
        self.assertIn("ats", response.data)
        self.assertEqual(response.data["ai_coaching"]["status"], "skipped")

    @override_settings(CAREERFIT_ENABLE_LLM=False, OPENAI_API_KEY="")
    def test_ai_coaching_request_falls_back_when_not_configured(self):
        response = self.client.post(
            "/api/matches/analyze/",
            {
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python and SQL.",
                "use_llm": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["ai_coaching"]["status"], "not_configured")
        self.assertIn("summary", response.data)

    def test_analysis_reuses_uploaded_resume_for_signed_in_user(self):
        user = User.objects.create_user(username="reuse@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        resume = Resume.objects.create(user=user, title="resume.txt", raw_text="Original text")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/matches/analyze/",
            {
                "resume_id": resume.id,
                "resume_text": "Updated Python SQL resume text",
                "job_description": "Build reporting dashboards with Python and SQL.",
            },
            format="json",
        )

        resume.refresh_from_db()
        report = MatchReport.objects.get(id=response.data["report_id"])
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Resume.objects.filter(user=user).count(), 1)
        self.assertEqual(resume.raw_text, "Updated Python SQL resume text")
        self.assertEqual(report.resume_id, resume.id)
