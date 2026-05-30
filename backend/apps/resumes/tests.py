from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token

from .parsers import ResumeParseError, extract_resume_text


class ResumeParserTests(SimpleTestCase):
    def test_extracts_plain_text_resume(self):
        resume_file = SimpleUploadedFile(
            "resume.txt",
            b"Python, SQL, Tableau\nCommunication and teamwork",
            content_type="text/plain",
        )

        text = extract_resume_text(resume_file)

        self.assertIn("Python, SQL, Tableau", text)
        self.assertIn("Communication and teamwork", text)

    def test_rejects_unsupported_file_type(self):
        resume_file = SimpleUploadedFile(
            "resume.csv",
            b"Python, SQL",
            content_type="text/csv",
        )

        with self.assertRaises(ResumeParseError):
            extract_resume_text(resume_file)


class ResumeUploadApiTests(APITestCase):
    def test_upload_returns_extracted_text(self):
        user = User.objects.create_user(username="upload@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        resume_file = SimpleUploadedFile(
            "resume.txt",
            b"Python SQL dashboards",
            content_type="text/plain",
        )

        response = self.client.post("/api/resumes/upload/", {"file": resume_file}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["filename"], "resume.txt")
        self.assertIn("Python SQL", response.data["text"])

    def test_upload_requires_login(self):
        response = self.client.post(
            "/api/resumes/upload/",
            {"file": SimpleUploadedFile("resume.txt", b"Python SQL dashboards")},
            format="multipart",
        )

        self.assertEqual(response.status_code, 401)

    def test_signed_in_user_can_delete_own_resume(self):
        user = User.objects.create_user(username="resume@example.com", password="careerfit-pass")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        upload_response = self.client.post(
            "/api/resumes/upload/",
            {"file": SimpleUploadedFile("resume.txt", b"Python SQL dashboards")},
            format="multipart",
        )

        delete_response = self.client.delete(f"/api/resumes/{upload_response.data['resume_id']}/")

        self.assertEqual(delete_response.status_code, 204)
