from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
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

        self.assertEqual(jobs[0]["title"], "Junior Data Analyst")
        self.assertEqual(jobs[0]["company"], "Acme")
        self.assertEqual(jobs[0]["location"], "US, New York")
        self.assertIn("Python", jobs[0]["description"])


class JobSearchApiTests(APITestCase):
    @patch("apps.jobs.views.search_adzuna_jobs")
    def test_search_returns_results(self, mock_search):
        mock_search.return_value = [
            {
                "id": "123",
                "title": "Junior Data Analyst",
                "company": "Acme",
                "location": "New York",
                "description": "Python SQL",
                "url": "https://example.com/job",
                "source": "Adzuna",
            }
        ]

        response = self.client.get("/api/jobs/search/", {"title": "Junior Data Analyst"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["source"], "Adzuna")
