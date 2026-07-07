import json
from unittest.mock import patch

from django.test import SimpleTestCase

from .evaluation import (
    EmbeddingEvaluationUnavailable,
    cosine_similarity,
    evaluate_hybrid_pair_ranking,
    evaluate_ollama_embedding_pair_ranking,
    evaluate_pair_ranking,
    fetch_ollama_embeddings,
    keyword_overlap_similarity,
)


class MatchingMethodEvaluationTests(SimpleTestCase):
    def test_keyword_ranking_prefers_related_evidence(self):
        summary = evaluate_pair_ranking(
            [
                {
                    "label": "backend",
                    "requirement": "Build Python APIs",
                    "related": "Built Python REST APIs",
                    "unrelated": "Managed retail inventory",
                }
            ],
            keyword_overlap_similarity,
        )

        self.assertEqual(summary["correct"], 1)
        self.assertEqual(summary["accuracy"], 1)

    def test_hybrid_ranking_prefers_paraphrased_evidence(self):
        summary = evaluate_hybrid_pair_ranking(
            [
                {
                    "label": "api",
                    "requirement": "Develop REST API services and integrate external systems.",
                    "related": "Built backend endpoints and connected third-party services.",
                    "unrelated": "Managed retail inventory and prepared shift schedules.",
                }
            ],
        )

        self.assertEqual(summary["correct"], 1)
        self.assertGreater(summary["results"][0]["margin"], 0)

    def test_cosine_similarity_compares_embedding_vectors(self):
        self.assertEqual(cosine_similarity([1, 0], [1, 0]), 1)
        self.assertEqual(cosine_similarity([1, 0], [0, 1]), 0)

    @patch("apps.matching.evaluation.urlopen")
    def test_ollama_embedding_evaluation_uses_batch_endpoint(self, mock_urlopen):
        mock_urlopen.return_value.__enter__.return_value.read.return_value = json.dumps(
            {"embeddings": [[1, 0], [1, 0], [0, 1]]}
        ).encode("utf-8")

        summary = evaluate_ollama_embedding_pair_ranking(
            [
                {
                    "label": "backend",
                    "requirement": "Build APIs",
                    "related": "Develop services",
                    "unrelated": "Prepare invoices",
                }
            ],
            base_url="http://127.0.0.1:11434",
            model="embeddinggemma",
        )

        request = mock_urlopen.call_args.args[0]
        payload = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.full_url, "http://127.0.0.1:11434/api/embed")
        self.assertEqual(payload["model"], "embeddinggemma")
        self.assertEqual(len(payload["input"]), 3)
        self.assertEqual(summary["accuracy"], 1)

    def test_embedding_request_requires_configured_model(self):
        with self.assertRaisesMessage(EmbeddingEvaluationUnavailable, "OLLAMA_EMBEDDING_MODEL"):
            fetch_ollama_embeddings(["text"], base_url="http://127.0.0.1:11434", model="")
