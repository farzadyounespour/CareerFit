import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.conf import settings


class JobSearchError(ValueError):
    pass


ADZUNA_API_BASE_URL = "https://api.adzuna.com/v1/api/jobs"


def search_adzuna_jobs(title, location="", country="us", results_per_page=8):
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        raise JobSearchError("Adzuna API credentials are not configured.")

    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "results_per_page": results_per_page,
        "what": title,
        "content-type": "application/json",
    }
    if location:
        params["where"] = location

    url = f"{ADZUNA_API_BASE_URL}/{country}/search/1?{urlencode(params)}"

    try:
        with urlopen(url, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in {401, 403}:
            raise JobSearchError("Adzuna rejected the API credentials.") from exc
        raise JobSearchError("Adzuna job search failed.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise JobSearchError("Unable to reach Adzuna job search.") from exc

    return [_format_adzuna_job(job) for job in payload.get("results", [])]


def _format_adzuna_job(job):
    company = job.get("company") or {}
    location = job.get("location") or {}
    location_parts = location.get("area") or []
    title = job.get("title") or "Untitled job"
    description = job.get("description") or ""

    return {
        "id": str(job.get("id") or ""),
        "title": title,
        "company": company.get("display_name") or "",
        "location": ", ".join(location_parts),
        "description": description,
        "url": job.get("redirect_url") or "",
        "source": "Adzuna",
    }
