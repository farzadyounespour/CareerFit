from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

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
        resume_file = SimpleUploadedFile(
            "resume.txt",
            b"Python SQL dashboards",
            content_type="text/plain",
        )

        response = self.client.post("/api/resumes/upload/", {"file": resume_file}, format="multipart")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["filename"], "resume.txt")
        self.assertIn("Python SQL", response.data["text"])
