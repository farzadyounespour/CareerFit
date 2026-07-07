import json
from math import sqrt
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .services import calculate_hybrid_text_similarity, calculate_text_similarity, tokenize


class EmbeddingEvaluationUnavailable(RuntimeError):
    pass


def keyword_overlap_similarity(requirement, evidence):
    requirement_tokens = set(tokenize(requirement))
    evidence_tokens = set(tokenize(evidence))
    if not requirement_tokens:
        return 0
    return (len(requirement_tokens & evidence_tokens) / len(requirement_tokens)) * 100


def evaluate_pair_ranking(cases, scorer):
    results = []
    for case in cases:
        related_score = scorer(case["requirement"], case["related"])
        unrelated_score = scorer(case["requirement"], case["unrelated"])
        results.append(
            {
                "label": case["label"],
                "related_score": related_score,
                "unrelated_score": unrelated_score,
                "margin": related_score - unrelated_score,
                "correct": related_score > unrelated_score,
            }
        )

    return summarize_pair_rankings(results)


def evaluate_tfidf_pair_ranking(cases):
    return evaluate_pair_ranking(cases, calculate_text_similarity)


def evaluate_hybrid_pair_ranking(cases):
    return evaluate_pair_ranking(cases, calculate_hybrid_text_similarity)


def evaluate_ollama_embedding_pair_ranking(cases, *, base_url, model, timeout=120):
    texts = []
    for case in cases:
        texts.extend([case["requirement"], case["related"], case["unrelated"]])

    embeddings = fetch_ollama_embeddings(texts, base_url=base_url, model=model, timeout=timeout)
    results = []
    for index, case in enumerate(cases):
        offset = index * 3
        requirement_embedding, related_embedding, unrelated_embedding = embeddings[offset:offset + 3]
        related_score = cosine_similarity(requirement_embedding, related_embedding) * 100
        unrelated_score = cosine_similarity(requirement_embedding, unrelated_embedding) * 100
        results.append(
            {
                "label": case["label"],
                "related_score": related_score,
                "unrelated_score": unrelated_score,
                "margin": related_score - unrelated_score,
                "correct": related_score > unrelated_score,
            }
        )

    return summarize_pair_rankings(results)


def fetch_ollama_embeddings(texts, *, base_url, model, timeout=120):
    if not model:
        raise EmbeddingEvaluationUnavailable("Set OLLAMA_EMBEDDING_MODEL to run semantic embedding evaluation.")

    request = Request(
        f"{base_url.rstrip('/')}/api/embed",
        data=json.dumps({"model": model, "input": texts}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise EmbeddingEvaluationUnavailable(
            f"Ollama rejected the embedding request. Pull the configured model first: ollama pull {model}"
        ) from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise EmbeddingEvaluationUnavailable("Unable to reach the local Ollama embedding endpoint.") from exc

    embeddings = payload.get("embeddings")
    if not isinstance(embeddings, list) or len(embeddings) != len(texts):
        raise EmbeddingEvaluationUnavailable("Ollama returned an unexpected embedding response.")
    return embeddings


def cosine_similarity(first_vector, second_vector):
    if len(first_vector) != len(second_vector):
        raise ValueError("Embedding vectors must have the same dimensions.")
    numerator = sum(first * second for first, second in zip(first_vector, second_vector))
    first_magnitude = sqrt(sum(value * value for value in first_vector))
    second_magnitude = sqrt(sum(value * value for value in second_vector))
    if not first_magnitude or not second_magnitude:
        return 0
    return numerator / (first_magnitude * second_magnitude)


def summarize_pair_rankings(results):
    correct = sum(result["correct"] for result in results)
    return {
        "cases": len(results),
        "correct": correct,
        "accuracy": correct / len(results) if results else 0,
        "average_margin": sum(result["margin"] for result in results) / len(results) if results else 0,
        "results": results,
    }
