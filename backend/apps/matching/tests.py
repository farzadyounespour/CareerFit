from django.test import SimpleTestCase

from .services import (
    analyze_ats_readiness,
    analyze_resume_match,
    calculate_text_similarity,
    requirement_priority,
    satisfied_skill_alternatives,
)


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
        reviewed_requirements = [
            item
            for group in result["requirements"].values()
            for item in group
        ]
        self.assertIn("similarity", reviewed_requirements[0])

    def test_text_similarity_increases_for_related_text(self):
        related_score = calculate_text_similarity(
            "Build Python dashboards with SQL",
            "Python SQL dashboard projects using Tableau",
        )
        unrelated_score = calculate_text_similarity(
            "Build Python dashboards with SQL",
            "Customer service and inventory management",
        )

        self.assertGreater(related_score, unrelated_score)

    def test_ats_scan_detects_resume_sections_and_contact_details(self):
        ats = analyze_ats_readiness(
            """
            Student User
            student@example.com | +1 514 555 1212 | Montreal
            Summary
            Data analyst with dashboard experience.
            Skills
            Python, SQL, Tableau
            Experience
            - 2025: Built a dashboard and reduced manual reporting by 20%.
            - Cleaned data, documented findings, and presented recommendations to stakeholders.
            - Collaborated with a project team to improve reporting quality and accuracy.
            Education
            Example University
            Coursework included statistics, databases, business intelligence, and data visualization.
            Projects included dashboard design, SQL analysis, and written communication.
            Additional experience includes requirements gathering, quality checks, and reporting.
            """
        )

        self.assertTrue(all(check["passed"] for check in ats["checks"]))

    def test_match_report_includes_role_specific_interview_prep(self):
        result = analyze_resume_match(
            user_profile={"target_role": "Data Analyst"},
            resume_text="Python SQL dashboard analysis",
            job_description="Build Python dashboards and SQL reports for stakeholders.",
        )

        self.assertGreaterEqual(len(result["interview_prep"]["questions"]), 3)
        self.assertTrue(any("python" in item["question"].lower() for item in result["interview_prep"]["questions"]))
        self.assertEqual(
            [item["label"] for item in result["interview_prep"]["star_prompts"]],
            ["Situation", "Task", "Action", "Result"],
        )

    def test_match_score_separates_strong_partial_and_unrelated_resumes(self):
        job_description = (
            "We need a data analyst. "
            "Required: Python, SQL, Tableau, and communication. "
            "Build dashboards and improve reporting."
        )
        strong = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Summary Data analyst Skills Python SQL Tableau communication "
            "Experience - Built Tableau dashboards with Python and SQL and improved reporting by 30%.",
            job_description,
        )
        partial = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Summary Data analyst Skills Python SQL Experience - Built reporting scripts with Python.",
            job_description,
        )
        unrelated = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Summary Retail associate Skills teamwork Experience - Helped customers and managed inventory.",
            job_description,
        )

        self.assertGreater(strong["summary"]["match_score"], partial["summary"]["match_score"])
        self.assertGreater(partial["summary"]["match_score"], unrelated["summary"]["match_score"])
        self.assertGreaterEqual(strong["summary"]["match_score"], 75)
        self.assertLess(unrelated["summary"]["match_score"], 25)
        self.assertIn("score_breakdown", strong["summary"])

    def test_requirement_priority_distinguishes_required_and_optional_criteria(self):
        self.assertEqual(requirement_priority("Python and SQL are required."), "high")
        self.assertEqual(requirement_priority("Experience with AWS is considered an asset."), "low")
        self.assertEqual(requirement_priority("Create dashboards for stakeholders."), "medium")

    def test_satisfied_skill_alternative_does_not_create_false_gap(self):
        self.assertEqual(
            satisfied_skill_alternatives("Experience with Tableau or Power BI.", {"tableau"}),
            {"tableau", "power bi"},
        )
        result = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Built Tableau dashboards.",
            "Required experience with Tableau or Power BI.",
        )

        self.assertIn("tableau", result["skills"]["matched"])
        self.assertNotIn("power bi", result["skills"]["missing"])

    def test_optional_skill_gap_is_labeled_low_priority(self):
        result = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Built dashboards with Python.",
            "Python is required. Experience with NLP is considered an asset.",
        )

        self.assertIn(
            {"name": "nlp", "priority": "low"},
            result["skills"]["missing_details"],
        )
