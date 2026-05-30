from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.contrib.auth.models import User
from django.test import SimpleTestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .services import search_adzuna_jobs


class AdzunaJobSearchTests(SimpleTestCase):
    @override_settings(ADZUNA_APP_ID="app-id", ADZUNA_APP_KEY="app-key")
    @patch("apps.jobs.services.urlopen")
    def test_formats_adzuna_results(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "results": [
            {
              "id": 123,
              "title": "Junior Data Analyst",
              "description": "Python, SQL, Tableau",
              "redirect_url": "https://example.com/job",
              "company": {"display_name": "Acme"},
              "location": {"area": ["US", "New York"]}
            }
          ]
        }
        """

        jobs = search_adzuna_jobs("Junior Data Analyst", "New York")

        self.assertEqual(jobs["results"][0]["title"], "Junior Data Analyst")
        self.assertEqual(jobs["results"][0]["company"], "Acme")
        self.assertEqual(jobs["results"][0]["location"], "US, New York")
        self.assertIn("Python", jobs["results"][0]["description"])
        self.assertEqual(jobs["count"], 0)

    @override_settings(ADZUNA_APP_ID="app-id", ADZUNA_APP_KEY="app-key")
    @patch("apps.jobs.services.urlopen")
    def test_passes_job_filters_to_adzuna(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b'{"count": 0, "results": []}'

        search_adzuna_jobs(
            "Data Analyst",
            workplace="hybrid",
            skills="Python SQL",
            experience_level="senior",
            employment_type="full_time",
            salary_min=70000,
            salary_max=110000,
        )

        params = parse_qs(urlparse(mock_urlopen.call_args.args[0]).query)
        self.assertIn("Python SQL", params["what"][0])
        self.assertIn("hybrid", params["what"][0])
        self.assertIn("senior", params["what"][0])
        self.assertEqual(params["salary_min"], ["70000"])
        self.assertEqual(params["salary_max"], ["110000"])
        self.assertEqual(params["full_time"], ["1"])

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_returns_sample_results_without_credentials(self):
        jobs = search_adzuna_jobs("Junior Data Analyst", "Remote")

        self.assertGreater(len(jobs["results"]), 0)
        self.assertEqual(jobs["results"][0]["source"], "Sample")
        self.assertIn("description", jobs["results"][0])


class JobSearchApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="search@example.com", password="careerfit-pass")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    @patch("apps.jobs.views.search_adzuna_jobs")
    def test_search_returns_results(self, mock_search):
        mock_search.return_value = {
            "results": [
                {
                    "id": "123",
                    "title": "Junior Data Analyst",
                    "company": "Acme",
                    "location": "New York",
                    "description": "Python SQL",
                    "url": "https://example.com/job",
                    "source": "Adzuna",
                }
            ],
            "count": 1,
            "page": 1,
            "results_per_page": 8,
        }

        response = self.client.get("/api/jobs/search/", {"title": "Junior Data Analyst"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["source"], "Adzuna")
        self.assertFalse(response.data["pagination"]["has_next"])

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_search_uses_sample_data_without_credentials(self):
        response = self.client.get("/api/jobs/search/", {"title": "Junior Data Analyst"})

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["using_sample_data"])
        self.assertEqual(response.data["source"], "Sample")

    def test_saved_job_keeps_location(self):
        user = User.objects.create_user(username="jobs@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        create_response = self.client.post(
            "/api/jobs/saved/",
            {
                "title": "Data Analyst",
                "company": "Example Co",
                "location": "Montreal, QC",
                "description": "Build reporting dashboards.",
            },
            format="json",
        )
        list_response = self.client.get("/api/jobs/saved/")

        self.assertEqual(create_response.status_code, 201)
        self.assertEqual(list_response.data["results"][0]["location"], "Montreal, QC")

    def test_saved_job_deduplicates_external_id_and_can_be_deleted(self):
        user = User.objects.create_user(username="saved@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        payload = {
            "external_id": "job-123",
            "title": "Data Analyst",
            "description": "Build reporting dashboards.",
            "source": "Adzuna",
        }

        first_response = self.client.post("/api/jobs/saved/", payload, format="json")
        second_response = self.client.post("/api/jobs/saved/", payload, format="json")
        delete_response = self.client.delete(f"/api/jobs/saved/{first_response.data['id']}/")

        self.assertEqual(first_response.status_code, 201)
        self.assertEqual(second_response.status_code, 200)
        self.assertFalse(second_response.data["created"])
        self.assertEqual(delete_response.status_code, 204)

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_sample_search_returns_truthful_pagination(self):
        response = self.client.get(
            "/api/jobs/search/",
            {"title": "Junior", "results_per_page": 1, "page": 1},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["pagination"]["page"], 1)
        self.assertFalse(response.data["pagination"]["has_previous"])

    def test_search_requires_login(self):
        self.client.credentials()

        response = self.client.get("/api/jobs/search/", {"title": "Data Analyst"})

        self.assertEqual(response.status_code, 401)

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_sample_search_filters_workplace_salary_and_experience(self):
        response = self.client.get(
            "/api/jobs/search/",
            {
                "title": "Data Analyst",
                "workplace": "remote",
                "experience_level": "entry",
                "employment_type": "full_time",
                "salary_min": 60000,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([job["id"] for job in response.data["results"]], ["sample-data-analyst"])

    def test_saved_job_can_be_updated_as_tracked_application(self):
        create_response = self.client.post(
            "/api/jobs/saved/",
            {"title": "Data Analyst", "description": "Build dashboards."},
            format="json",
        )

        response = self.client.patch(
            f"/api/jobs/saved/{create_response.data['id']}/",
            {
                "status": "interview",
                "notes": "Prepare reporting example.",
                "follow_up_date": "2026-06-04",
                "excitement": 5,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["job"]["status"], "interview")
        self.assertEqual(response.data["job"]["excitement"], 5)
        self.assertEqual(response.data["job"]["follow_up_date"].isoformat(), "2026-06-04")

    def test_search_alert_can_be_created_paused_and_deleted(self):
        create_response = self.client.post(
            "/api/jobs/alerts/",
            {"title": "Data Analyst", "country": "ca", "frequency": "daily"},
            format="json",
        )
        alert_id = create_response.data["alert"]["id"]
        pause_response = self.client.patch(
            f"/api/jobs/alerts/{alert_id}/",
            {"is_active": False},
            format="json",
        )
        list_response = self.client.get("/api/jobs/alerts/")
        delete_response = self.client.delete(f"/api/jobs/alerts/{alert_id}/")

        self.assertEqual(create_response.status_code, 201)
        self.assertFalse(pause_response.data["alert"]["is_active"])
        self.assertEqual(len(list_response.data["results"]), 1)
        self.assertEqual(delete_response.status_code, 204)
