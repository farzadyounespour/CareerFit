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
        self.assertIn("semantic_matches", response.data)
        self.assertIn("requirements_summary", response.data)
        self.assertIn("priority_fixes", response.data)
        self.assertGreaterEqual(response.data["requirements_summary"]["counts"]["matched"], 0)
        self.assertTrue(response.data["requirements_summary"]["top_gaps"])
        self.assertEqual(MatchReport.objects.filter(user=user).count(), 0)

    def test_preview_returns_semantic_matches_for_related_wording(self):
        user = User.objects.create_user(username="semantic@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(
            "/api/matches/preview/",
            {
                "user_profile": {"target_role": "Backend Developer"},
                "resume_text": "Built backend endpoints and integrated third-party services",
                "job_description": "Experience with REST API development",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["semantic_matches"][0]["label"], "Semantic match")
        self.assertEqual(response.data["semantic_matches"][0]["score"], 82)
        self.assertEqual(
            response.data["semantic_matches"][0]["evidence"],
            "Built backend endpoints and integrated third-party services",
        )

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

    @patch("apps.matching.views.generate_tailored_resume")
    def test_resume_draft_returns_generated_resume_without_saving_report(self, mock_generate):
        user = User.objects.create_user(username="draft@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        mock_generate.return_value = {
            "status": "completed",
            "provider": "openai",
            "model": "test-model",
            "resume_text": "STUDENT USER\n\nPROFESSIONAL SUMMARY\nPython and SQL experience.",
            "summary": "Generated an editable draft.",
            "tailoring_notes": ["Kept the draft truthful."],
            "safety_warnings": [],
        }

        response = self.client.post(
            "/api/matches/resume-draft/",
            {
                "user_profile": {"target_role": "Data Analyst"},
                "resume_text": "Python SQL dashboard experience",
                "job_description": "Build dashboards with Python, SQL, and Tableau.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["resume_generation"]["status"], "completed")
        self.assertIn("PROFESSIONAL SUMMARY", response.data["resume_generation"]["resume_text"])
        self.assertEqual(MatchReport.objects.filter(user=user).count(), 0)
        mock_generate.assert_called_once()
        self.assertTrue(mock_generate.call_args.kwargs["requested"])
        self.assertTrue(mock_generate.call_args.kwargs["authorized"])

    def test_resume_draft_requires_login(self):
        response = self.client.post(
            "/api/matches/resume-draft/",
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
                "job_company": "Example Co",
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
        self.assertEqual(history_response.data["results"][0]["company"], "Example Co")
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
