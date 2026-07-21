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
    job_requirement: str = Field(default="", max_length=420)
    resume_evidence: str = Field(default="", max_length=420)
    where_to_add: str = Field(default="", max_length=120)
    what_to_add: str = Field(default="", max_length=420)
    bullet_template: str = Field(default="", max_length=420)
    truthfulness_note: str = Field(default="Use only if this reflects your real experience.", max_length=220)


class LLMReportSection(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    summary: str = Field(min_length=1, max_length=520)
    evidence: str = Field(default="", max_length=420)
    next_step: str = Field(default="", max_length=420)


class LLMSkillInsight(BaseModel):
    skill: str = Field(min_length=1, max_length=80)
    status: str = Field(pattern="^(supported|missing|related)$")
    detail: str = Field(min_length=1, max_length=420)
    evidence: str = Field(default="", max_length=420)
    next_step: str = Field(default="", max_length=420)


class LLMCoachingResult(BaseModel):
    headline: str = Field(min_length=1, max_length=180)
    summary: str = Field(min_length=1, max_length=700)
    recommendations: list[LLMRecommendation] = Field(min_length=1, max_length=5)
    report_sections: list[LLMReportSection] = Field(default_factory=list, max_length=4)
    skill_insights: list[LLMSkillInsight] = Field(default_factory=list, max_length=8)


class LLMPacketDraftResult(BaseModel):
    cover_letter: str = Field(min_length=1, max_length=5000)
    follow_up_email: str = Field(min_length=1, max_length=2500)


class LLMResumeDraftResult(BaseModel):
    resume_text: str = Field(min_length=1, max_length=12000)
    summary: str = Field(min_length=1, max_length=700)
    tailoring_notes: list[str] = Field(default_factory=list, max_length=6)
    safety_warnings: list[str] = Field(default_factory=list, max_length=4)


def enrich_match_report(match_result, resume_text, job_description, requested=False, authorized=False):
    if not requested:
        return _status("skipped", "AI coaching was not requested.")

    if not authorized:
        return _status("sign_in_required", "Sign in to request optional AI coaching.")

    if not settings.CAREERFIT_ENABLE_LLM:
        return _status("not_configured", "AI coaching is not configured. Deterministic matching is still available.")

    try:
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            if not _ollama_is_available():
                return _status("unavailable", "Local Ollama is not running. The deterministic report is shown instead.")
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


def coaching_status(status, detail):
    return _status(status, detail)


def generate_tailored_resume(match_result, resume_text, job_description, requested=False, authorized=False):
    if not requested:
        return _status("skipped", "AI resume generation was not requested.")

    if not authorized:
        return _status("sign_in_required", "Sign in to generate an AI resume draft.")

    if not settings.CAREERFIT_ENABLE_LLM:
        return _status("not_configured", "AI resume generation is not configured. The editable deterministic draft is still available.")

    try:
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            draft = _request_ollama_resume_draft(match_result, resume_text, job_description)
            model = settings.OLLAMA_MODEL
        elif settings.CAREERFIT_LLM_PROVIDER == "openai":
            if not settings.OPENAI_API_KEY:
                return _status("not_configured", "OpenAI resume generation requires an API key.")
            draft = _request_openai_resume_draft(match_result, resume_text, job_description)
            model = settings.OPENAI_MODEL
        else:
            return _status("not_configured", "The configured AI resume provider is not supported.")
        if not draft:
            return _status("unavailable", "AI resume generation returned no usable draft.")
        logger.info(
            "Optional AI resume draft completed provider=%s model=%s",
            settings.CAREERFIT_LLM_PROVIDER,
            model,
        )
        return {
            "status": "completed",
            "provider": settings.CAREERFIT_LLM_PROVIDER,
            "model": model,
            **draft.model_dump(),
        }
    except Exception:
        logger.exception("Optional AI resume draft request failed")
        if settings.CAREERFIT_LLM_PROVIDER == "ollama":
            return _status("unavailable", "Local Ollama is unavailable. Start Ollama and download the configured model, then try again.")
        return _status("unavailable", "AI resume generation is temporarily unavailable.")


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


def _request_openai_resume_draft(match_result, resume_text, job_description):
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
            {"role": "user", "content": _build_resume_draft_prompt(match_result, resume_text, job_description)},
        ],
        text_format=LLMResumeDraftResult,
        max_output_tokens=settings.OPENAI_RESUME_MAX_OUTPUT_TOKENS,
    )
    usage = getattr(response, "usage", None)
    logger.info(
        "OpenAI resume draft usage input_tokens=%s output_tokens=%s",
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


def _ollama_is_available():
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/tags",
        headers={"Content-Type": "application/json"},
        method="GET",
    )
    try:
        with urlopen(request, timeout=settings.OLLAMA_HEALTH_TIMEOUT_SECONDS):
            return True
    except Exception:
        logger.info("Local Ollama health check failed")
        return False


def _request_ollama_resume_draft(match_result, resume_text, job_description):
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat",
        data=json.dumps(
            {
                "model": settings.OLLAMA_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": _build_resume_draft_prompt(match_result, resume_text, job_description)},
                ],
                "format": LLMResumeDraftResult.model_json_schema(),
                "stream": False,
            }
        ).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=settings.OLLAMA_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return LLMResumeDraftResult.model_validate_json(payload["message"]["content"])


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


def _build_resume_draft_prompt(match_result, resume_text, job_description):
    summary = match_result["summary"]
    skills = match_result["skills"]
    missing_requirements = [
        item["text"]
        for category in ("missing", "weak", "partial")
        for item in match_result["requirements"][category]
    ][:8]
    return (
        "Create a complete, ATS-friendly resume draft tailored to the job posting.\n"
        "Rules:\n"
        "- Use only facts present in the original resume.\n"
        "- Do not invent employers, dates, degrees, certifications, tools, metrics, or responsibilities.\n"
        "- You may reorganize sections, improve wording, and emphasize relevant truthful evidence.\n"
        "- Ignore legal notices, hiring-process text, benefits, privacy language, source URLs, and application instructions.\n"
        "- If the job needs a skill that is not supported by the resume, do not claim it. Add a bracketed placeholder such as [Add a truthful TypeScript project if applicable].\n"
        "- Keep the draft in plain text with recognizable headings: Professional Summary, Skills, Experience, Projects if useful, Education.\n"
        "- Preserve contact details if they are present in the resume.\n\n"
        f"Target role: {summary.get('target_role') or 'Not provided'}\n"
        f"Deterministic match score: {summary['match_score']}\n"
        f"Deterministic readiness score: {summary['readiness_score']}\n"
        f"Matched skills: {', '.join(skills['matched']) or 'None'}\n"
        f"Missing skills: {', '.join(skills['missing']) or 'None'}\n"
        f"Missing, weak, or partial requirements: {' | '.join(missing_requirements) or 'None'}\n\n"
        f"ORIGINAL RESUME:\n{resume_text[:MAX_LLM_TEXT_LENGTH]}\n\n"
        f"JOB POSTING:\n{job_description[:MAX_LLM_TEXT_LENGTH]}"
    )


def _build_prompt(match_result, resume_text, job_description):
    summary = match_result["summary"]
    skills = match_result["skills"]
    priority_fixes = match_result.get("priority_fixes", [])[:5]
    ats = match_result.get("ats", {})
    missing_requirements = [
        item["text"]
        for category in ("missing", "weak")
        for item in match_result["requirements"][category]
    ][:5]
    supported_requirements = [
        item["text"]
        for category in ("matched", "partial")
        for item in match_result["requirements"][category]
    ][:5]
    return (
        "Return a complete AI-enriched report add-on for the CareerFit report page. "
        "Include: headline, summary, recommendation objects, report_sections, and skill_insights. "
        "For report_sections, write 3-4 concise sections covering the fit summary, skills, requirement evidence, "
        "ATS/readability, and resume strategy when useful. Each section must include a specific summary, evidence when available, "
        "and a practical next_step. For skill_insights, cover the most important matched and missing skills. "
        "Use status='supported' only when the resume clearly proves the skill, status='missing' when the job asks for it but the resume does not prove it, "
        "and status='related' when the resume has adjacent evidence but needs clearer wording. "
        "Create one recommendation object for each CareerFit priority fix listed, up to five total. "
        "Return recommendation objects with job_requirement, resume_evidence, where_to_add, "
        "what_to_add, bullet_template, and truthfulness_note. The bullet_template must be a resume-ready bullet sentence with bracketed placeholders for unknown facts. "
        "Do not leave bullet_template empty. Do not leave job_requirement empty: "
        "copy the exact job ask from CareerFit priority fixes or the job posting. Do not leave "
        "resume_evidence empty: copy the related resume proof when CareerFit found it, or write "
        "'No related resume evidence detected.' Keep every "
        "suggestion grounded in the resume and CareerFit findings. Do not recommend adding "
        "legal notices, hiring-process text, benefits, privacy language, source URLs, or application instructions to the resume.\n\n"
        f"Target role: {summary.get('target_role') or 'Not provided'}\n"
        f"Deterministic match score: {summary['match_score']}\n"
        f"Deterministic readiness score: {summary['readiness_score']}\n"
        f"Matched skills: {', '.join(skills['matched']) or 'None'}\n"
        f"Missing skills: {', '.join(skills['missing']) or 'None'}\n\n"
        f"ATS score: {ats.get('score', 0)}\n"
        f"ATS issues: {', '.join(ats.get('issues', [])) or 'None'}\n\n"
        f"CareerFit priority fixes: {json.dumps(priority_fixes, ensure_ascii=False)}\n\n"
        f"Missing or weak requirements: {' | '.join(missing_requirements) or 'None'}\n\n"
        f"Matched or partial requirements: {' | '.join(supported_requirements) or 'None'}\n\n"
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
        "report_sections": [],
        "skill_insights": [],
    }
