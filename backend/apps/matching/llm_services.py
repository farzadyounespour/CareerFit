import json
import logging
from urllib.request import Request, urlopen

from django.conf import settings
from pydantic import BaseModel, Field


logger = logging.getLogger(__name__)

MAX_LLM_TEXT_LENGTH = 12000
SYSTEM_PROMPT = (
    "You are a careful career coach. Use only the provided resume, job posting, "
    "and deterministic CareerFit findings. Do not invent experience, credentials, "
    "or skills. Give concise, actionable resume-tailoring advice. Avoid guarantees "
    "about hiring outcomes."
)


class LLMRecommendation(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    detail: str = Field(min_length=1, max_length=420)
    priority: str = Field(pattern="^(high|medium|low)$")


class LLMCoachingResult(BaseModel):
    headline: str = Field(min_length=1, max_length=180)
    summary: str = Field(min_length=1, max_length=700)
    recommendations: list[LLMRecommendation] = Field(min_length=1, max_length=5)


class LLMPacketDraftResult(BaseModel):
    cover_letter: str = Field(min_length=1, max_length=5000)
    follow_up_email: str = Field(min_length=1, max_length=2500)


def enrich_match_report(match_result, resume_text, job_description, requested=False, authorized=False):
    if not requested:
        return _status("skipped", "AI coaching was not requested.")

    if not authorized:
        return _status("sign_in_required", "Sign in to request optional AI coaching.")

    if not settings.CAREERFIT_ENABLE_LLM:
        return _status("not_configured", "AI coaching is not configured. Deterministic matching is still available.")

    try:
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            coaching = _request_ollama_coaching(match_result, resume_text, job_description)
            model = settings.OLLAMA_MODEL
        elif settings.CAREERFIT_LLM_PROVIDER == "openai":
            if not settings.OPENAI_API_KEY:
                return _status("not_configured", "OpenAI coaching requires an API key. Deterministic matching is still available.")
            coaching = _request_openai_coaching(match_result, resume_text, job_description)
            model = settings.OPENAI_MODEL
        else:
            return _status("not_configured", "The configured AI coaching provider is not supported.")
        if not coaching:
            return _status("unavailable", "AI coaching returned no usable result.")
        logger.info(
            "Optional AI coaching completed provider=%s model=%s",
            settings.CAREERFIT_LLM_PROVIDER,
            model,
        )
        return {
            "status": "completed",
            "provider": settings.CAREERFIT_LLM_PROVIDER,
            "model": model,
            **coaching.model_dump(),
        }
    except Exception:
        logger.exception("Optional AI coaching request failed")
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            return _status("unavailable", "Local Ollama is unavailable. Start Ollama and download the configured model, then try again. The deterministic report is complete.")
        return _status("unavailable", "AI coaching is temporarily unavailable. The deterministic report is complete.")


def _request_openai_coaching(match_result, resume_text, job_description):
    from openai import OpenAI

    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_retries=settings.OPENAI_MAX_RETRIES,
    )
    response = client.responses.parse(
        model=settings.OPENAI_MODEL,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(match_result, resume_text, job_description)},
        ],
        text_format=LLMCoachingResult,
        max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
    )
    usage = getattr(response, "usage", None)
    logger.info(
        "OpenAI coaching usage input_tokens=%s output_tokens=%s",
        getattr(usage, "input_tokens", None),
        getattr(usage, "output_tokens", None),
    )
    return response.output_parsed


def _request_ollama_coaching(match_result, resume_text, job_description):
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=json.dumps(
            {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_prompt(match_result, resume_text, job_description)},
                ],
                "format": LLMCoachingResult.model_json_schema(),
                "stream": False,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=settings.OLLAMA_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return LLMCoachingResult.model_validate_json(payload["message"]["content"])


def generate_application_packet(job, resume_text, requested=False, authorized=False):
    if not requested or not authorized or not settings.CAREERFIT_ENABLE_LLM:
        return {}
    try:
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            drafts = _request_ollama_packet(job, resume_text)
        elif settings.CAREERFIT_LLM_PROVIDER == "openai" and settings.OPENAI_API_KEY:
            drafts = _request_openai_packet(job, resume_text)
        else:
            return {}
        return drafts.model_dump()
    except Exception:
        logger.exception("Optional AI application packet request failed")
        return {}


def _request_openai_packet(job, resume_text):
    from openai import OpenAI

    client = OpenAI(
        api_key=settings.OPENAI_API_KEY,
        timeout=settings.OPENAI_TIMEOUT_SECONDS,
        max_retries=settings.OPENAI_MAX_RETRIES,
    )
    response = client.responses.parse(
        model=settings.OPENAI_MODEL,
        input=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_packet_prompt(job, resume_text)},
        ],
        text_format=LLMPacketDraftResult,
        max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
    )
    return response.output_parsed


def _request_ollama_packet(job, resume_text):
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=json.dumps(
            {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_packet_prompt(job, resume_text)},
                ],
                "format": LLMPacketDraftResult.model_json_schema(),
                "stream": False,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=settings.OLLAMA_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return LLMPacketDraftResult.model_validate_json(payload["message"]["content"])


def _build_packet_prompt(job, resume_text):
    return (
        "Draft a concise, editable cover letter and a brief follow-up email. Use only truthful details "
        "from the resume and job posting. Do not invent accomplishments.\\n\\n"
        f"ROLE: {job.title}\\nCOMPANY: {job.company or 'Not listed'}\\n"
        f"JOB POSTING:\\n{job.raw_text[:MAX_LLM_TEXT_LENGTH]}\\n\\n"
        f"RESUME:\\n{resume_text[:MAX_LLM_TEXT_LENGTH]}"
    )


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
        "provider": settings.CAREERFIT_LLM_PROVIDER,
        "model": settings.OLLAMA_MODEL if settings.CAREERFIT_LLM_PROVIDER == "ollama" else settings.OPENAI_MODEL,
        "detail": detail,
        "recommendations": [],
    }
