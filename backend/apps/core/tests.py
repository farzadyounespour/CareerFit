from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase


class CareerFitWorkflowTests(APITestCase):
    @override_settings(ADZUNA_APP_ID="", ADZUNA_APP_KEY="")
    def test_signed_in_user_can_upload_search_save_analyze_and_view_history(self):
        register_response = self.client.post(
            "/api/accounts/register/",
            {
                "name": "Workflow User",
                "email": "workflow@example.com",
                "password": "careerfit-pass",
                "target_role": "Data Analyst",
            },
            format="json",
        )
        token = register_response.data["token"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

        upload_response = self.client.post(
            "/api/resumes/upload/",
            {"file": SimpleUploadedFile("resume.txt", b"Python SQL Tableau dashboards communication")},
            format="multipart",
        )
        search_response = self.client.get("/api/jobs/search/", {"title": "Data Analyst"})
        job = search_response.data["results"][0]
        save_response = self.client.post(
            "/api/jobs/saved/",
            {
                "title": job["title"],
                "company": job["company"],
                "description": job["description"],
                "source": job["source"],
            },
            format="json",
        )
        analyze_response = self.client.post(
            "/api/matches/analyze/",
            {
                "user_profile": {"name": "Workflow User", "target_role": "Data Analyst"},
                "resume_text": upload_response.data["text"],
                "job_description": job["description"],
            },
            format="json",
        )
        history_response = self.client.get("/api/matches/history/")

        self.assertEqual(upload_response.status_code, 200)
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(save_response.status_code, 201)
        self.assertEqual(analyze_response.status_code, 200)
        self.assertEqual(history_response.status_code, 200)
        self.assertEqual(len(history_response.data["results"]), 1)
