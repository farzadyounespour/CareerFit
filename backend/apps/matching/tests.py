from django.test import SimpleTestCase

from .services import analyze_resume_match


class AnalyzeResumeMatchTests(SimpleTestCase):
    def test_groups_requirements_and_scores_skills(self):
        result = analyze_resume_match(
            user_profile={"name": "Student", "target_role": "Junior Data Analyst"},
            resume_text="Python SQL Tableau dashboards communication teamwork",
            job_description=(
                "Required skills include Python, SQL, Tableau, communication. "
                "Experience with AWS is considered an asset."
            ),
        )

        self.assertGreater(result["summary"]["match_score"], 0)
        self.assertIn("python", result["skills"]["matched"])
        self.assertIn("aws", result["skills"]["missing"])
        self.assertIn("recommendations", result)
