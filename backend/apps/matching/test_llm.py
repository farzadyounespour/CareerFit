import json
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from .llm_services import LLMCoachingResult, LLMRecommendation, LLMResumeDraftResult, enrich_match_report, generate_tailored_resume
from .services import analyze_resume_match


class OptionalLlmCoachingTests(SimpleTestCase):
    def setUp(self):
        self.result = analyze_resume_match(
            user_profile={"target_role": "Data Analyst"},
            resume_text="Python SQL dashboard experience",
            job_description="Build Tableau dashboards with Python and SQL.",
        )

    def test_skips_coaching_until_user_requests_it(self):
        coaching = enrich_match_report(
            self.result,
            "Python SQL",
            "Build Tableau dashboards",
        )

        self.assertEqual(coaching["status"], "skipped")

    @override_settings(
        CAREERFIT_ENABLE_LLM=True,
        CAREERFIT_LLM_PROVIDER="openai",
        OPENAI_API_KEY="test-key",
        OPENAI_MODEL="test-model",
    )
    @patch("openai.OpenAI")
    def test_returns_structured_coaching(self, mock_openai):
        mock_openai.return_value.responses.parse.return_value.output_parsed = LLMCoachingResult(
            headline="Lead with your reporting experience",
            summary="The resume already supports core analysis work. Add evidence for Tableau.",
            recommendations=[
                LLMRecommendation(
                    title="Add a dashboard bullet",
                    detail="Describe one dashboard project and the decision it supported.",
                    priority="high",
                    job_requirement="Build Tableau dashboards",
                    resume_evidence="Python SQL dashboard experience",
                    where_to_add="Projects",
                    what_to_add="Add one truthful dashboard project with the user or decision supported.",
                    bullet_template="Built [dashboard] for [audience], improving [decision or workflow].",
                )
            ],
        )

        coaching = enrich_match_report(
            self.result,
            "Python SQL dashboard experience",
            "Build Tableau dashboards with Python and SQL.",
            requested=True,
            authorized=True,
        )

        self.assertEqual(coaching["status"], "completed")
        self.assertEqual(coaching["model"], "test-model")
        self.assertEqual(coaching["recommendations"][0]["priority"], "high")
        self.assertEqual(coaching["recommendations"][0]["where_to_add"], "Projects")
        self.assertIn("Built [dashboard]", coaching["recommendations"][0]["bullet_template"])
        mock_openai.return_value.responses.parse.assert_called_once()
        self.assertEqual(mock_openai.call_args.kwargs["timeout"], 20)
        self.assertEqual(mock_openai.call_args.kwargs["max_retries"], 1)

    @override_settings(
        CAREERFIT_ENABLE_LLM=True,
        CAREERFIT_LLM_PROVIDER="openai",
        OPENAI_API_KEY="test-key",
        OPENAI_MODEL="test-model",
        OPENAI_RESUME_MAX_OUTPUT_TOKENS=3500,
    )
    @patch("openai.OpenAI")
    def test_returns_structured_resume_draft(self, mock_openai):
        mock_openai.return_value.responses.parse.return_value.output_parsed = LLMResumeDraftResult(
            resume_text="STUDENT USER\n\nPROFESSIONAL SUMMARY\nData analyst with Python and SQL experience.",
            summary="Tailored the resume toward the data analyst job without inventing Tableau experience.",
            tailoring_notes=["Emphasized Python and SQL evidence."],
            safety_warnings=["Tableau was not claimed because it was missing from the source resume."],
        )

        draft = generate_tailored_resume(
            self.result,
            "Student User\nPython SQL dashboard experience",
            "Build Tableau dashboards with Python and SQL.",
            requested=True,
            authorized=True,
        )

        self.assertEqual(draft["status"], "completed")
        self.assertEqual(draft["model"], "test-model")
        self.assertIn("PROFESSIONAL SUMMARY", draft["resume_text"])
        self.assertIn("Tableau was not claimed", draft["safety_warnings"][0])
        mock_openai.return_value.responses.parse.assert_called_once()
        self.assertEqual(
            mock_openai.return_value.responses.parse.call_args.kwargs["max_output_tokens"],
            3500,
        )

    @override_settings(CAREERFIT_ENABLE_LLM=False)
    def test_resume_draft_falls_back_when_not_configured(self):
        draft = generate_tailored_resume(
            self.result,
            "Python SQL dashboard experience",
            "Build Tableau dashboards with Python and SQL.",
            requested=True,
            authorized=True,
        )

        self.assertEqual(draft["status"], "not_configured")

    @override_settings(
        CAREERFIT_ENABLE_LLM=True,
        CAREERFIT_LLM_PROVIDER="ollama",
        OLLAMA_BASE_URL="http://127.0.0.1:11434",
        OLLAMA_MODEL="gemma3:4b",
    )
    @patch("apps.matching.llm_services.urlopen")
    def test_returns_structured_local_ollama_coaching(self, mock_urlopen):
        content = {
            "headline": "Make the dashboard evidence easier to scan",
            "summary": "The resume supports Python and SQL. Clarify the Tableau project.",
            "recommendations": [
                {
                    "title": "Quantify a dashboard outcome",
                    "detail": "Add one measured result from a dashboard project.",
                    "priority": "high",
                }
            ],
        }
        mock_urlopen.return_value.__enter__.return_value.read.return_value = json.dumps(
            {"message": {"role": "assistant", "content": json.dumps(content)}}
        ).encode("utf-8")

        coaching = enrich_match_report(
            self.result,
            "Python SQL dashboard experience",
            "Build Tableau dashboards with Python and SQL.",
            requested=True,
            authorized=True,
        )

        self.assertEqual(coaching["status"], "completed")
        self.assertEqual(coaching["provider"], "ollama")
        self.assertEqual(coaching["model"], "gemma3:4b")
        self.assertEqual(coaching["recommendations"][0]["priority"], "high")
        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/chat")
        self.assertIn("Do not leave job_requirement empty", payload["messages"][1]["content"])
        self.assertIn("Do not leave resume_evidence empty", payload["messages"][1]["content"])
