import os
import sys
from pathlib import Path

from dotenv import load_dotenv

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

load_dotenv(BACKEND_ROOT / ".env")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

from apps.matching.evaluation import (
    EmbeddingEvaluationUnavailable,
    evaluate_hybrid_pair_ranking,
    evaluate_ollama_embedding_pair_ranking,
    evaluate_pair_ranking,
    evaluate_tfidf_pair_ranking,
    keyword_overlap_similarity,
)


CASES = [
    {
        "label": "backend-services",
        "requirement": "Build reliable event-driven backend services with Kafka.",
        "related": "Designed Kafka consumers and resilient asynchronous services for high-volume events.",
        "unrelated": "Prepared monthly sales presentations and coordinated office schedules.",
    },
    {
        "label": "data-analysis",
        "requirement": "Analyze business data and communicate dashboard findings to stakeholders.",
        "related": "Investigated reporting datasets and presented visualization insights to business partners.",
        "unrelated": "Configured container deployments and monitored Linux servers.",
    },
    {
        "label": "collaboration",
        "requirement": "Collaborate with cross-functional teams to solve customer problems.",
        "related": "Partnered with product and support groups to resolve user issues.",
        "unrelated": "Created database indexes for faster PostgreSQL queries.",
    },
    {
        "label": "cloud-platform",
        "requirement": "Deploy containerized applications to cloud infrastructure.",
        "related": "Released Docker services into AWS environments using Kubernetes.",
        "unrelated": "Wrote editorial content and planned social media campaigns.",
    },
    {
        "label": "frontend-accessibility",
        "requirement": "Build accessible web interfaces with JavaScript.",
        "related": "Implemented inclusive browser experiences using JS and semantic HTML.",
        "unrelated": "Automated invoice reconciliation with spreadsheet formulas.",
    },
]


def print_summary(name, summary):
    print(
        f"{name}: accuracy={summary['accuracy']:.3f} "
        f"correct={summary['correct']}/{summary['cases']} "
        f"average_margin={summary['average_margin']:.2f}"
    )
    for result in summary["results"]:
        print(
            f"  {result['label']}: related={result['related_score']:.2f} "
            f"unrelated={result['unrelated_score']:.2f} "
            f"correct={result['correct']}"
        )


def evaluate():
    print_summary("keyword_overlap", evaluate_pair_ranking(CASES, keyword_overlap_similarity))
    print_summary("tfidf_cosine", evaluate_tfidf_pair_ranking(CASES))
    print_summary("hybrid_bm25_semantic", evaluate_hybrid_pair_ranking(CASES))

    model = os.getenv("OLLAMA_EMBEDDING_MODEL", "")
    try:
        summary = evaluate_ollama_embedding_pair_ranking(
            CASES,
            base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
            model=model,
            timeout=float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120")),
        )
    except EmbeddingEvaluationUnavailable as exc:
        print(f"ollama_embeddings: skipped ({exc})")
    else:
        print_summary(f"ollama_embeddings[{model}]", summary)


if __name__ == "__main__":
    evaluate()
