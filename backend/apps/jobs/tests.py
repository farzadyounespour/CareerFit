from unittest.mock import patch

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

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_returns_sample_results_without_credentials(self):
        jobs = search_adzuna_jobs("Junior Data Analyst", "Remote")

        self.assertGreater(len(jobs["results"]), 0)
        self.assertEqual(jobs["results"][0]["source"], "Sample")
        self.assertIn("description", jobs["results"][0])


class JobSearchApiTests(APITestCase):
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
