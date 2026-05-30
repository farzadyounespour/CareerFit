import json
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from .llm_services import LLMCoachingResult, LLMRecommendation, enrich_match_report
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
        mock_openai.return_value.responses.parse.assert_called_once()
        self.assertEqual(mock_openai.call_args.kwargs["timeout"], 20)
        self.assertEqual(mock_openai.call_args.kwargs["max_retries"], 1)

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
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/chat")
