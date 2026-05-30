from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.test import override_settings
from django.core.cache import cache
from unittest.mock import patch

from .models import MatchReport
from apps.resumes.models import Resume


class MatchPersistenceApiTests(APITestCase):
    def tearDown(self):
        cache.clear()

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

    def test_preview_returns_scores_without_saving_report(self):
        user = User.objects.create_user(username="preview@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/matches/preview/",
            {
                "user_profile": {"target_role": "Data Analyst"},
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python, SQL, and Tableau.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("match_score", response.data["summary"])
        self.assertIn("readiness_score", response.data["summary"])
        self.assertIn("matched", response.data["skills"])
        self.assertIn("missing", response.data["skills"])
        self.assertEqual(MatchReport.objects.filter(user=user).count(), 0)

    def test_preview_requires_login(self):
        response = self.client.post(
            "/api/matches/preview/",
            {
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python and SQL.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    @patch("apps.matching.views.enrich_match_report")
    def test_coaching_returns_specific_improvements_without_saving_report(self, mock_enrich):
        user = User.objects.create_user(username="coach@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        mock_enrich.return_value = {
            "status": "completed",
            "headline": "Tailor the resume",
            "summary": "Start with the strongest gap.",
            "recommendations": [],
        }

        response = self.client.post(
            "/api/matches/coach/",
            {
                "user_profile": {"target_role": "Data Analyst"},
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python, SQL, and Tableau.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["ai_coaching"]["status"], "completed")
        self.assertEqual(MatchReport.objects.filter(user=user).count(), 0)
        mock_enrich.assert_called_once()
        self.assertTrue(mock_enrich.call_args.kwargs["requested"])
        self.assertTrue(mock_enrich.call_args.kwargs["authorized"])

    def test_coaching_requires_login(self):
        response = self.client.post(
            "/api/matches/coach/",
            {
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python and SQL.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    @override_settings(CAREERFIT_ENABLE_LLM=False, OPENAI_API_KEY="")
    def test_analysis_requires_login(self):
        response = self.client.post(
            "/api/matches/analyze/",
            {
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python and SQL.",
                "use_llm": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    @override_settings(CAREERFIT_ENABLE_LLM=False, OPENAI_API_KEY="")
    def test_signed_in_ai_coaching_request_falls_back_when_not_configured(self):
        user = User.objects.create_user(username="ai@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

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

    def test_history_keeps_original_documents_and_report_can_be_deleted(self):
        user = User.objects.create_user(username="history@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        resume = Resume.objects.create(user=user, title="resume.txt", raw_text="Original resume")

        analyze_response = self.client.post(
            "/api/matches/analyze/",
            {
                "resume_id": resume.id,
                "resume_text": "Snapshot resume with Python",
                "job_description": "Snapshot job requiring Python.",
            },
            format="json",
        )
        resume.raw_text = "Later edited resume"
        resume.save(update_fields=["raw_text"])
        history_response = self.client.get("/api/matches/history/")
        delete_response = self.client.delete(
            f"/api/matches/history/{analyze_response.data['report_id']}/"
        )

        self.assertEqual(history_response.data["results"][0]["resume_text"], "Snapshot resume with Python")
        self.assertEqual(history_response.data["results"][0]["job_description"], "Snapshot job requiring Python.")
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(MatchReport.objects.filter(user=user).exists())

    @override_settings(CAREERFIT_ENABLE_LLM=False, OPENAI_API_KEY="")
    @patch("apps.matching.throttles.LlmCoachingThrottle.get_rate", return_value="1/hour")
    def test_ai_coaching_has_dedicated_rate_limit(self, _mock_rate):
        user = User.objects.create_user(username="limit@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        payload = {
            "resume_text": "Python SQL dashboard experience",
            "job_description": "Build dashboards with Python and SQL.",
            "use_llm": True,
        }

        first_response = self.client.post("/api/matches/analyze/", payload, format="json")
        second_response = self.client.post("/api/matches/analyze/", payload, format="json")

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 429)
