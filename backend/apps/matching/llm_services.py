import logging

from django.conf import settings
from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)

MAX_LLM_TEXT_LENGTH = 12000


class LLMRecommendation(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    detail: str = Field(min_length=1, max_length=420)
    priority: str = Field(pattern="^(high|medium|low)$")


class LLMCoachingResult(BaseModel):
    headline: str = Field(min_length=1, max_length=180)
    summary: str = Field(min_length=1, max_length=700)
    recommendations: list[LLMRecommendation] = Field(min_length=1, max_length=5)


def enrich_match_report(match_result, resume_text, job_description, requested=False, authorized=False):
    if not requested:
        return _status("skipped", "AI coaching was not requested.")

    if not authorized:
        return _status("sign_in_required", "Sign in to request optional AI coaching.")

    if not settings.CAREERFIT_ENABLE_LLM or not settings.OPENAI_API_KEY:
        return _status("not_configured", "AI coaching is not configured. Deterministic matching is still available.")

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.OPENAI_TIMEOUT_SECONDS,
            max_retries=settings.OPENAI_MAX_RETRIES,
        )
        response = client.responses.parse(
            model=settings.OPENAI_MODEL,
            input=[
                {
                    "role": "system",
                    "content": (
                        "You are a careful career coach. Use only the provided resume, job posting, "
                        "and deterministic CareerFit findings. Do not invent experience, credentials, "
                        "or skills. Give concise, actionable resume-tailoring advice. Avoid guarantees "
                        "about hiring outcomes."
                    ),
                },
                {
                    "role": "user",
                    "content": _build_prompt(match_result, resume_text, job_description),
                },
            ],
            text_format=LLMCoachingResult,
            max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
        )
        coaching = response.output_parsed
        if not coaching:
            return _status("unavailable", "AI coaching returned no usable result.")
        usage = getattr(response, "usage", None)
        logger.info(
            "Optional AI coaching completed model=%s input_tokens=%s output_tokens=%s",
            settings.OPENAI_MODEL,
            getattr(usage, "input_tokens", None),
            getattr(usage, "output_tokens", None),
        )
        return {
            "status": "completed",
            "model": settings.OPENAI_MODEL,
            **coaching.model_dump(),
        }
    except Exception:
        logger.exception("Optional AI coaching request failed")
        return _status("unavailable", "AI coaching is temporarily unavailable. The deterministic report is complete.")


def _build_prompt(match_result, resume_text, job_description):
    summary = match_result["summary"]
    skills = match_result["skills"]
    missing_requirements = [
        item["text"]
        for category in ("missing", "weak")
        for item in match_result["requirements"][category]
    ][:5]
    return (
        f"Target role: {summary.get('target_role') or 'Not provided'}\n"
        f"Deterministic match score: {summary['match_score']}\n"
        f"Deterministic readiness score: {summary['readiness_score']}\n"
        f"Matched skills: {', '.join(skills['matched']) or 'None'}\n"
        f"Missing skills: {', '.join(skills['missing']) or 'None'}\n\n"
        f"Missing or weak requirements: {' | '.join(missing_requirements) or 'None'}\n\n"
        f"RESUME:\n{resume_text[:MAX_LLM_TEXT_LENGTH]}\n\n"
        f"JOB POSTING:\n{job_description[:MAX_LLM_TEXT_LENGTH]}"
    )


def _status(status, detail):
    return {
        "status": status,
        "model": settings.OPENAI_MODEL,
        "detail": detail,
        "recommendations": [],
    }
