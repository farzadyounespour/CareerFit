from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .services import (
    JobSearchError,
    import_job_from_url,
    build_role_insights,
    build_related_titles,
    search_adzuna_jobs,
    search_arbeitnow_jobs,
    search_jobs,
    search_jooble_jobs,
    search_remotive_jobs,
    search_sample_jobs,
)


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
              "description": "Python, SQL, Tableau...",
              "redirect_url": "https://example.com/job",
              "company": {"display_name": "Acme"},
              "location": {"area": ["US", "New York"]}
              ,"created": "2026-05-30T14:00:00Z"
            }
          ]
        }
        """

        jobs = search_adzuna_jobs("Junior Data Analyst", "New York")

        self.assertEqual(jobs["results"][0]["title"], "Junior Data Analyst")
        self.assertEqual(jobs["results"][0]["company"], "Acme")
        self.assertEqual(jobs["results"][0]["location"], "US, New York")
        self.assertIn("Python", jobs["results"][0]["description"])
        self.assertTrue(jobs["results"][0]["description_is_partial"])
        self.assertEqual(jobs["results"][0]["posted_at"], "2026-05-30T14:00:00+00:00")
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

    def test_role_insights_summarize_repeated_skills_and_partial_sources(self):
        insights = build_role_insights(
            [
                {"title": "Backend Engineer", "description": "Python SQL AWS", "source": "Adzuna"},
                {"title": "Data Engineer", "description": "Python SQL Docker", "source": "Jooble", "description_is_partial": True},
                {"title": "API Engineer", "description": "Python REST", "source": "Arbeitnow"},
            ],
            role="Software Engineer",
        )

        self.assertEqual(insights["role"], "Software Engineer")
        self.assertEqual(insights["postings_analyzed"], 3)
        self.assertEqual(insights["partial_postings"], 1)
        self.assertEqual(insights["common_skills"][0], {"name": "python", "count": 3, "percentage": 100})
        self.assertIn({"name": "sql", "count": 2, "percentage": 67}, insights["common_skills"])
        self.assertIn("Backend Engineer", insights["related_titles"])

    def test_related_titles_include_curated_and_result_roles_without_duplicates(self):
        titles = build_related_titles(
            "Junior Data Analyst",
            [{"title": "Reporting Analyst"}, {"title": "Data Analyst"}, {"title": "Analytics Consultant"}],
        )

        self.assertEqual(titles[:2], ["Business Intelligence Analyst", "Reporting Analyst"])
        self.assertNotIn("Data Analyst", titles)


class AdditionalJobProviderTests(SimpleTestCase):
    def setUp(self):
        cache.clear()

    @patch("apps.jobs.services.urlopen")
    def test_formats_and_filters_arbeitnow_results(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "data": [
            {
              "slug": "remote-data-analyst",
              "title": "Data Analyst",
              "company_name": "Example Co",
              "location": "Remote",
              "remote": true,
              "description": "<p>Build Python SQL dashboards.</p>",
              "url": "https://arbeitnow.com/jobs/remote-data-analyst",
              "job_types": ["full_time"]
            }
          ],
          "links": {"next": null}
        }
        """

        jobs = search_arbeitnow_jobs("Data Analyst", workplace="remote", skills="Python SQL")

        self.assertEqual(jobs["results"][0]["source"], "Arbeitnow")
        self.assertEqual(jobs["results"][0]["description"], "Build Python SQL dashboards.")

    @patch("apps.jobs.services.urlopen")
    def test_formats_and_filters_remotive_results(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "job-count": 1,
          "jobs": [
            {
              "id": 345,
              "url": "https://remotive.com/remote-jobs/software-dev/backend-engineer-345",
              "title": "Backend Engineer",
              "company_name": "Remote Co",
              "category": "Software Development",
              "job_type": "full_time",
              "publication_date": "2026-07-01T10:00:00",
              "candidate_required_location": "Canada",
              "salary": "$80k - $110k",
              "tags": ["python", "api"],
              "description": "<p>Build Python API services.</p>"
            }
          ]
        }
        """

        jobs = search_remotive_jobs("Backend Engineer", location="Toronto", country="ca", workplace="remote", skills="Python API")

        self.assertEqual(jobs["results"][0]["source"], "Remotive")
        self.assertEqual(jobs["results"][0]["company"], "Remote Co")
        self.assertEqual(jobs["results"][0]["workplace"], "remote")
        self.assertEqual(jobs["results"][0]["employment_type"], "full_time")
        self.assertEqual(jobs["results"][0]["description"], "Build Python API services.")
        self.assertEqual(jobs["results"][0]["salary_min"], 80000)
        self.assertEqual(jobs["results"][0]["salary_max"], 110000)

    @patch("apps.jobs.services.urlopen")
    def test_provider_title_filter_matches_related_word_forms(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "data": [
            {
              "slug": "backend-engineer",
              "title": "Backend Engineer",
              "company_name": "Example Co",
              "location": "Remote",
              "remote": true,
              "description": "<p>Build platform services.</p>",
              "url": "https://arbeitnow.com/jobs/backend-engineer",
              "job_types": ["full_time"]
            }
          ],
          "links": {"next": null}
        }
        """

        jobs = search_arbeitnow_jobs("Backend Engineering", workplace="remote")

        self.assertEqual(jobs["results"][0]["title"], "Backend Engineer")

    @patch("apps.jobs.services.urlopen")
    def test_arbeitnow_broadens_empty_seniority_specific_searches(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "data": [
            {
              "slug": "software-engineer",
              "title": "Software Engineer",
              "company_name": "Example Co",
              "location": "Berlin, Germany",
              "remote": false,
              "description": "<p>Build backend services.</p>",
              "url": "https://arbeitnow.com/jobs/software-engineer",
              "job_types": ["full_time"]
            }
          ],
          "links": {"next": null}
        }
        """

        jobs = search_arbeitnow_jobs("Junior Software Engineer")

        self.assertEqual(jobs["results"][0]["source"], "Arbeitnow")
        self.assertEqual(jobs["results"][0]["match_scope"], "related")
        self.assertIn("Software Engineer", jobs["results"][0]["search_note"])

    @patch("apps.jobs.services._fetch_remotive_payload")
    def test_remotive_broadens_empty_seniority_specific_searches(self, mock_fetch):
        mock_fetch.side_effect = [
            {"jobs": []},
            {
                "jobs": [
                    {
                        "id": 456,
                        "url": "https://remotive.com/remote-jobs/software-dev/software-engineer-456",
                        "title": "Software Engineer",
                        "company_name": "Remote Co",
                        "category": "Software Development",
                        "job_type": "full_time",
                        "publication_date": "2026-07-01T10:00:00",
                        "candidate_required_location": "Canada",
                        "salary": "",
                        "tags": ["api"],
                        "description": "<p>Build API services.</p>",
                    }
                ]
            },
        ]

        jobs = search_remotive_jobs("Junior Software Engineer", country="ca")

        self.assertEqual(jobs["results"][0]["source"], "Remotive")
        self.assertEqual(jobs["results"][0]["match_scope"], "related")
        self.assertEqual(mock_fetch.call_count, 2)

    @patch("apps.jobs.services.urlopen")
    def test_remotive_skips_non_remote_workplace_filters(self, mock_urlopen):
        jobs = search_remotive_jobs("Backend Engineer", workplace="on_site")

        self.assertEqual(jobs["results"], [])
        mock_urlopen.assert_not_called()

    @override_settings(JOOBLE_API_KEY="jooble-key")
    @patch("apps.jobs.services.urlopen")
    def test_formats_jooble_results(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = b"""
        {
          "totalCount": 1,
          "jobs": [
            {
              "id": 42,
              "title": "Data Analyst",
              "company": "Example Co",
              "location": "Montreal",
              "snippet": "<b>Python SQL reporting</b>",
              "salary": "$70,000",
              "type": "Full-time",
              "link": "https://jooble.org/job/42"
            }
          ]
        }
        """

        jobs = search_jooble_jobs("Data Analyst")

        self.assertEqual(jobs["results"][0]["source"], "Jooble")
        self.assertEqual(jobs["results"][0]["employment_type"], "full_time")
        self.assertEqual(jobs["results"][0]["description"], "Python SQL reporting")
        self.assertTrue(jobs["results"][0]["description_is_partial"])

    @override_settings(ADZUNA_APP_ID="app-id", ADZUNA_APP_KEY="app-key", JOOBLE_API_KEY="", CAREERFIT_ENABLE_REMOTIVE=True)
    @patch("apps.jobs.services.search_remotive_jobs")
    @patch("apps.jobs.services.search_arbeitnow_jobs")
    @patch("apps.jobs.services.search_adzuna_jobs")
    def test_aggregates_and_deduplicates_live_results(self, mock_adzuna, mock_arbeitnow, mock_remotive):
        duplicate = {
            "id": "1",
            "title": "Data Analyst",
            "company": "Example Co",
            "location": "Remote",
            "description": "Python SQL",
            "url": "https://example.com/job",
            "source": "Adzuna",
        }
        mock_adzuna.return_value = {"results": [duplicate], "count": 1}
        mock_remotive.return_value = {"results": [{**duplicate, "id": "remote", "source": "Remotive"}], "count": 1}
        mock_arbeitnow.return_value = {"results": [{**duplicate, "id": "other", "source": "Arbeitnow"}], "count": 1}

        result = search_jobs("Data Analyst")

        self.assertEqual(len(result["results"]), 1)
        self.assertEqual(result["providers"], ["Adzuna", "Remotive", "Arbeitnow"])
        self.assertFalse(result["using_sample_data"])

    @override_settings(ADZUNA_APP_ID="app-id", ADZUNA_APP_KEY="app-key", JOOBLE_API_KEY="jooble-key", CAREERFIT_ENABLE_REMOTIVE=True)
    @patch("apps.jobs.services.search_jooble_jobs")
    @patch("apps.jobs.services.search_arbeitnow_jobs")
    @patch("apps.jobs.services.search_remotive_jobs")
    @patch("apps.jobs.services.search_adzuna_jobs")
    def test_source_filter_searches_only_the_requested_provider(self, mock_adzuna, mock_remotive, mock_arbeitnow, mock_jooble):
        mock_remotive.return_value = {
            "results": [{"id": "remote-1", "title": "Data Analyst", "company": "Remote Co", "location": "Remote", "source": "Remotive"}],
            "count": 1,
        }

        result = search_jobs("Data Analyst", source="remotive")

        self.assertEqual(result["providers"], ["Remotive"])
        self.assertEqual(result["results"][0]["source"], "Remotive")
        mock_remotive.assert_called_once()
        mock_adzuna.assert_not_called()
        mock_arbeitnow.assert_not_called()
        mock_jooble.assert_not_called()

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="", JOOBLE_API_KEY="", CAREERFIT_ENABLE_REMOTIVE=False)
    @patch("apps.jobs.services.search_arbeitnow_jobs", side_effect=JobSearchError("Unavailable"))
    def test_falls_back_to_samples_when_live_providers_are_unavailable(self, _mock_arbeitnow):
        result = search_jobs("Data Analyst")

        self.assertTrue(result["using_sample_data"])
        self.assertEqual(result["providers"], ["Sample"])
        self.assertEqual(result["provider_errors"][0]["provider"], "Arbeitnow")


class JobUrlImportTests(SimpleTestCase):
    @patch("apps.jobs.services.socket.getaddrinfo", return_value=[(None, None, None, None, ("93.184.216.34", 443))])
    @patch("apps.jobs.services.build_opener")
    def test_imports_schema_org_job_posting(self, mock_build_opener, _mock_getaddrinfo):
        mock_build_opener.return_value.open.return_value.__enter__.return_value.headers = {"Content-Type": "text/html"}
        mock_build_opener.return_value.open.return_value.__enter__.return_value.read.return_value = b"""
        <script type="application/ld+json">
        {"@type":"JobPosting","title":"Data Analyst","description":"Build dashboards with Python.",
         "hiringOrganization":{"name":"Example Co"},
         "jobLocation":{"address":{"addressLocality":"Montreal","addressRegion":"QC","addressCountry":"CA"}},
         "employmentType":["FULL_TIME"]}
        </script>
        """

        job = import_job_from_url("https://example.com/jobs/analyst")

        self.assertEqual(job["title"], "Data Analyst")
        self.assertEqual(job["company"], "Example Co")
        self.assertEqual(job["location"], "Montreal, QC, CA")
        self.assertEqual(job["employment_type"], "full_time")

    def test_rejects_local_job_url(self):
        with self.assertRaisesMessage(ValueError, "public web URLs"):
            import_job_from_url("http://127.0.0.1/jobs/analyst")


class JobSearchApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="search@example.com", password="careerfit-pass")
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

    def tearDown(self):
        cache.clear()

    @patch("apps.jobs.views.search_jobs")
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
            "providers": ["Adzuna"],
            "provider_errors": [],
            "using_sample_data": False,
        }

        response = self.client.get("/api/jobs/search/", {"title": "Junior Data Analyst", "source": "remotive"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["source"], "Adzuna")
        self.assertEqual(mock_search.call_args.kwargs["source"], "remotive")
        self.assertFalse(response.data["pagination"]["has_next"])
        self.assertEqual(response.data["role_insights"]["postings_analyzed"], 1)

    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    @patch("apps.jobs.views.search_jobs")
    def test_search_uses_sample_data_when_live_providers_are_unavailable(self, mock_search):
        mock_search.return_value = {
            "results": [{"id": "sample", "source": "Sample"}],
            "count": 1,
            "page": 1,
            "results_per_page": 8,
            "providers": ["Sample"],
            "provider_errors": [],
            "using_sample_data": True,
        }
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
    @patch("apps.jobs.views.search_jobs")
    def test_sample_search_returns_truthful_pagination(self, mock_search):
        mock_search.return_value = {
            "results": [{"id": "sample", "source": "Sample"}],
            "count": 2,
            "page": 1,
            "results_per_page": 1,
            "providers": ["Sample"],
            "provider_errors": [],
            "using_sample_data": True,
        }
        response = self.client.get(
            "/api/jobs/search/",
            {"title": "Junior", "results_per_page": 1, "page": 1},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["pagination"]["page"], 1)
        self.assertEqual(response.data["pagination"]["total_pages"], 2)
        self.assertTrue(response.data["pagination"]["has_next"])
        self.assertFalse(response.data["pagination"]["has_previous"])

    def test_search_requires_login(self):
        self.client.credentials()

        response = self.client.get("/api/jobs/search/", {"title": "Data Analyst"})

        self.assertEqual(response.status_code, 401)

    def test_sample_search_filters_workplace_salary_and_experience(self):
        result = search_sample_jobs(
            title="Data Analyst",
            workplace="remote",
            experience_level="entry",
            employment_type="full_time",
            salary_min=60000,
        )

        self.assertEqual([job["id"] for job in result["results"]], ["sample-data-analyst"])

    def test_sample_search_excludes_unwanted_keywords(self):
        result = search_sample_jobs(title="Junior", excluded_keywords="software, unpaid")

        self.assertEqual([job["id"] for job in result["results"]], ["sample-data-analyst"])

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

    def test_saved_job_packet_keeps_tasks_drafts_and_interview_notes(self):
        create_response = self.client.post(
            "/api/jobs/saved/",
            {"title": "Data Analyst", "company": "Example Co", "description": "Build dashboards."},
            format="json",
        )
        job_id = create_response.data["id"]

        patch_response = self.client.patch(
            f"/api/jobs/saved/{job_id}/",
            {
                "personal_pitch": "I build useful dashboards.",
                "interview_notes": "Ask about the analytics team.",
                "tasks": [{"id": "task-1", "title": "Send follow-up", "due_date": "2026-06-04", "completed": False}],
                "star_stories": [{"id": "story-1", "title": "Dashboard project", "notes": "Reduced manual reporting."}],
            },
            format="json",
        )
        drafts_response = self.client.post(f"/api/jobs/saved/{job_id}/drafts/", {}, format="json")

        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["job"]["tasks"][0]["title"], "Send follow-up")
        self.assertIn("Data Analyst", drafts_response.data["job"]["cover_letter"])
        self.assertIn("Follow-up", drafts_response.data["job"]["follow_up_email"])

    @patch("apps.jobs.views.generate_application_packet")
    def test_saved_job_packet_can_use_optional_ai_drafts(self, mock_generate):
        mock_generate.return_value = {
            "cover_letter": "AI-assisted truthful cover letter.",
            "follow_up_email": "AI-assisted follow-up email.",
        }
        create_response = self.client.post(
            "/api/jobs/saved/",
            {"title": "Data Analyst", "description": "Build dashboards."},
            format="json",
        )

        response = self.client.post(
            f"/api/jobs/saved/{create_response.data['id']}/drafts/",
            {"use_ai": True},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["ai_enhanced"])
        self.assertEqual(response.data["job"]["cover_letter"], "AI-assisted truthful cover letter.")

    def test_tracker_csv_export_and_import(self):
        self.client.post(
            "/api/jobs/saved/",
            {"title": "Data Analyst", "company": "Example Co", "description": "Build dashboards."},
            format="json",
        )

        export_response = self.client.get("/api/jobs/saved/csv/")
        import_response = self.client.post(
            "/api/jobs/saved/csv/",
            {"file": SimpleUploadedFile("tracker.csv", b"title,company,status\nDesigner,Studio Co,applied\n", content_type="text/csv")},
            format="multipart",
        )

        self.assertEqual(export_response.status_code, 200)
        self.assertIn(b"Data Analyst", export_response.content)
        self.assertEqual(import_response.status_code, 201)
        self.assertEqual(import_response.data["created"], 1)

    def test_search_alert_can_be_created_paused_and_deleted(self):
        create_response = self.client.post(
            "/api/jobs/alerts/",
            {"title": "Data Analyst", "country": "ca", "excluded_keywords": "senior, unpaid", "frequency": "daily"},
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
        self.assertEqual(create_response.data["alert"]["excluded_keywords"], "senior, unpaid")
        self.assertEqual(len(list_response.data["results"]), 1)
        self.assertEqual(delete_response.status_code, 204)
