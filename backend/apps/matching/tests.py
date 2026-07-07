import json
from unittest.mock import patch

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings

from .services import (
    analyze_ats_readiness,
    analyze_resume_match,
    calculate_embedding_segment_scores,
    calculate_hybrid_text_similarity,
    calculate_text_similarity,
    extract_skills,
    requirement_priority,
    satisfied_skill_alternatives,
    split_requirements,
)


class AnalyzeResumeMatchTests(SimpleTestCase):
    def tearDown(self):
        cache.clear()

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

    def test_hybrid_similarity_prefers_semantic_resume_evidence(self):
        related_score = calculate_hybrid_text_similarity(
            "Develop REST API services and integrate external systems",
            "Built backend endpoints and connected third-party services",
        )
        unrelated_score = calculate_hybrid_text_similarity(
            "Develop REST API services and integrate external systems",
            "Prepared monthly sales reports and coordinated inventory counts",
        )

        self.assertGreater(related_score, unrelated_score)
        self.assertGreaterEqual(related_score, 55)

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

    def test_and_or_skill_list_does_not_create_false_gaps(self):
        result = analyze_resume_match(
            {"target_role": "Software Engineer"},
            "Built event-driven services with Golang.",
            "Strong proficiency in TypeScript, Node.js, and/or Golang.",
        )

        self.assertEqual(result["skills"]["matched"], ["golang"])
        self.assertEqual(result["skills"]["missing"], [])
        self.assertNotIn("javascript", extract_skills("Node.js services"))

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

    def test_common_software_skill_spellings_do_not_create_false_gaps(self):
        resume_text = "JS NodeJS Postgres problem-solving Typescript RESTful React.js GitHub"
        result = analyze_resume_match(
            {"target_role": "Junior Software Engineer"},
            resume_text,
            "Required JavaScript, Node.js, PostgreSQL, problem solving, and TypeScript experience. "
            "Build REST APIs with React and Git.",
        )

        self.assertEqual(
            set(extract_skills(resume_text)),
            {"javascript", "node.js", "postgresql", "problem solving", "typescript", "rest", "react", "git"},
        )
        self.assertEqual(result["skills"]["missing"], [])
        self.assertGreaterEqual(result["summary"]["match_score"], 60)

    def test_full_stack_job_terms_are_recognized_without_js_noise(self):
        resume_text = "Built full-stack apps with Next.js, TypeScript, PostgreSQL, Supabase, Express, and AI-assisted development."
        skills = set(extract_skills(resume_text))

        self.assertIn("next.js", skills)
        self.assertIn("typescript", skills)
        self.assertIn("postgresql", skills)
        self.assertIn("supabase", skills)
        self.assertIn("express", skills)
        self.assertIn("full-stack", skills)
        self.assertIn("ai-assisted development", skills)
        self.assertNotIn("javascript", extract_skills("Next.js"))

    def test_requirement_split_ignores_company_culture_fragments(self):
        requirements = split_requirements(
            "We are committed to a remote first culture. "
            "Benefits include flexible vacation. "
            "The Role We are looking for a Senior Full-Stack Software Engineer with deep expertise in Next.js, TypeScript, PostgreSQL/Supabase, and AI-assisted development. "
            "Connected attack surface. "
            "Design and deliver customer-facing features with PostgreSQL."
        )

        self.assertNotIn("We are committed to a remote first culture", requirements)
        self.assertNotIn("Connected attack surface", requirements)
        self.assertTrue(any("Next.js" in requirement for requirement in requirements))
        self.assertTrue(any("customer-facing features" in requirement for requirement in requirements))

    def test_requirement_split_ignores_hiring_process_and_application_boilerplate(self):
        requirements = split_requirements(
            "If you have questions regarding our hiring practices, please contact [email protected]. "
            "We may use artificial intelligence (AI) tools to support parts of the hiring process, such as screening applications. "
            "We are an equal opportunity employer and provide reasonable accommodation. "
            "Submit your application through our careers page. "
            "Build AI-assisted developer tools with TypeScript and PostgreSQL. "
            "Support production APIs and improve reliability for customer-facing systems."
        )

        self.assertFalse(any("hiring practices" in requirement for requirement in requirements))
        self.assertFalse(any("hiring process" in requirement for requirement in requirements))
        self.assertFalse(any("equal opportunity" in requirement for requirement in requirements))
        self.assertFalse(any("Submit your application" in requirement for requirement in requirements))
        self.assertTrue(any("AI-assisted developer tools" in requirement for requirement in requirements))
        self.assertTrue(any("production APIs" in requirement for requirement in requirements))

    def test_boilerplate_skills_do_not_become_missing_skills(self):
        result = analyze_resume_match(
            {"target_role": "Backend Developer"},
            "Built REST API endpoints for customer workflows.",
            "We provide reasonable accommodation and are committed to accessibility for every candidate. "
            "All applications are reviewed by our talent acquisition team. "
            "Build REST API endpoints for customer-facing systems.",
        )

        self.assertNotIn("accessibility", result["skills"]["missing"])
        self.assertNotIn("accessibility", result["skills"]["matched"])
        self.assertEqual(set(result["skills"]["matched"]), {"api", "rest"})
        self.assertEqual(result["summary"]["requirements_reviewed"], 1)

    def test_backend_engineering_vocabulary_is_recognized(self):
        self.assertEqual(
            set(extract_skills("Golang Kafka microservices K8S Elasticsearch ClickHouse event-driven services")),
            {
                "golang",
                "kafka",
                "microservices",
                "kubernetes",
                "elasticsearch",
                "clickhouse",
                "event-driven architecture",
            },
        )

    def test_source_urls_do_not_create_fake_skill_matches(self):
        self.assertNotIn(
            "api",
            extract_skills("Source: https://www.adzuna.ca/land/ad/123?utm_medium=api&utm_source=test"),
        )
        result = analyze_resume_match(
            {"target_role": "Software Engineer"},
            "Built customer support dashboards.",
            "Impactful possibilities.\n\nSource: https://www.adzuna.ca/land/ad/123?utm_medium=api",
        )

        self.assertNotIn("api", result["skills"]["matched"])
        self.assertNotIn("api", result["skills"]["missing"])

    def test_job_metadata_lines_do_not_lower_requirement_score(self):
        clean = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Built Python SQL dashboards.",
            "Build Python SQL dashboards.",
        )
        with_metadata = analyze_resume_match(
            {"target_role": "Data Analyst"},
            "Built Python SQL dashboards.",
            "Company: Example Co\nLocation: Toronto\nBuild Python SQL dashboards.",
        )

        self.assertEqual(
            clean["summary"]["score_breakdown"]["requirement_evidence"]["score"],
            with_metadata["summary"]["score_breakdown"]["requirement_evidence"]["score"],
        )
        self.assertEqual(clean["summary"]["requirements_reviewed"], with_metadata["summary"]["requirements_reviewed"])

    def test_semantic_api_requirement_matches_related_backend_evidence(self):
        result = analyze_resume_match(
            {"target_role": "Backend Developer"},
            "Built backend endpoints and integrated third-party services",
            "Experience with REST API development",
        )

        self.assertGreaterEqual(result["summary"]["match_score"], 80)
        self.assertEqual(set(result["skills"]["matched"]), {"api", "rest"})
        self.assertEqual(result["skills"]["missing"], [])
        requirement = result["requirements"]["matched"][0]
        self.assertEqual(requirement["match_label"], "Semantic match")
        self.assertEqual(requirement["semantic_evidence"], "Built backend endpoints and integrated third-party services")
        self.assertEqual(requirement["semantic_explanation"], "Different wording, related technical meaning")
        self.assertEqual(requirement["match_basis"], "Semantic concept match")
        self.assertEqual(requirement["best_evidence"], "Built backend endpoints and integrated third-party services")
        self.assertGreaterEqual(requirement["similarity"], 82)

    def test_requirement_result_explains_best_evidence_for_partial_matches(self):
        result = analyze_resume_match(
            {"target_role": "Software Engineer"},
            "Experience\n- Tested backend workflows and documented quality issues before release.",
            "Deep understanding of software development lifecycle and testing methodologies including functional and performance testing.",
        )

        reviewed = [
            item
            for group in result["requirements"].values()
            for item in group
        ][0]
        self.assertIn("Tested backend workflows", reviewed["best_evidence"])
        self.assertTrue(reviewed["match_basis"])
        self.assertGreater(reviewed["semantic_score"], 0)

    def test_priority_fixes_group_related_requirements_with_actionable_guidance(self):
        result = analyze_resume_match(
            {"target_role": "Backend Developer"},
            "Built Python automation for reporting workflows.",
            (
                "Experience with REST API development. "
                "Build backend endpoints and integrate third-party services. "
                "Use TypeScript for customer-facing features."
            ),
        )

        fixes = result["priority_fixes"]
        self.assertGreaterEqual(len(fixes), 1)
        api_fix = next(
            fix
            for fix in fixes
            if fix["type"] == "requirement" and ("api" in fix.get("skills", []) or "rest" in fix.get("skills", []))
        )
        self.assertIn("REST API", api_fix["jobSignal"])
        self.assertIn("backend endpoints", api_fix["jobSignal"])
        self.assertIn("No direct resume evidence", api_fix["resumeSignal"])
        self.assertIn("where", api_fix)
        self.assertIn("evidenceNeeded", api_fix)
        self.assertIn("example", api_fix)
        self.assertLessEqual(
            len([fix for fix in fixes if "api" in fix.get("skills", []) or "rest" in fix.get("skills", [])]),
            2,
        )

    @override_settings(CAREERFIT_ENABLE_EMBEDDINGS=True, OLLAMA_EMBEDDING_MODEL="embeddinggemma")
    @patch("apps.matching.services.urlopen")
    def test_optional_embedding_scores_support_semantic_requirement_evidence(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = json.dumps(
            {"embeddings": [[1, 0], [1, 0], [1, 0]]}
        ).encode("utf-8")

        result = analyze_resume_match(
            {"target_role": "Product Engineer"},
            "Projects\n- Clarified unclear user needs and shipped prototypes.",
            "Experience translating ambiguous requirements into product prototypes.",
        )

        requirement = result["requirements"]["matched"][0]
        self.assertEqual(requirement["match_label"], "Semantic match")
        self.assertEqual(requirement["match_basis"], "Embedding semantic match")
        self.assertEqual(requirement["embedding_score"], 100)
        self.assertIn("Clarified unclear user needs", requirement["best_evidence"])

    @override_settings(CAREERFIT_ENABLE_EMBEDDINGS=True, OLLAMA_EMBEDDING_MODEL="embeddinggemma")
    @patch("apps.matching.services.urlopen")
    def test_embedding_segment_scores_use_ollama_batch_endpoint(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = json.dumps(
            {"embeddings": [[1, 0], [1, 0], [0, 1]]}
        ).encode("utf-8")

        scores = calculate_embedding_segment_scores("Build APIs", ["Develop services", "Prepare invoices"])

        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/embed")
        self.assertEqual(payload["model"], "embeddinggemma")
        self.assertEqual(scores, [100, 0])
