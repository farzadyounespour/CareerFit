import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from django.conf import settings


class JobSearchError(ValueError):
    pass


ADZUNA_API_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
SAMPLE_JOBS = [
    {
        "id": "sample-data-analyst",
        "title": "Junior Data Analyst",
        "company": "Northstar Analytics",
        "location": "Remote, United States",
        "description": (
            "We are looking for a Junior Data Analyst who can collect, clean, and analyze business data. "
            "Required skills include Python, SQL, Excel, Tableau or Power BI, communication, and problem solving. "
            "The candidate should create dashboards, explain findings to stakeholders, and work with cross-functional teams."
        ),
        "url": "",
        "source": "Sample",
    },
    {
        "id": "sample-frontend-developer",
        "title": "Frontend Developer Intern",
        "company": "BrightApps Studio",
        "location": "Toronto, Canada",
        "description": (
            "Join our product team to build responsive React interfaces with JavaScript, REST APIs, Git, teamwork, "
            "and clear communication. Experience with accessibility, testing, and design systems is an asset."
        ),
        "url": "",
        "source": "Sample",
    },
    {
        "id": "sample-software-engineer",
        "title": "Junior Software Engineer",
        "company": "Civic Cloud",
        "location": "New York, United States",
        "description": (
            "Build web services and internal tools using Python, Django, REST APIs, SQL, Docker, Git, and AWS. "
            "Strong problem solving, documentation, and collaboration skills are important for this role."
        ),
        "url": "",
        "source": "Sample",
    },
]


def search_adzuna_jobs(title, location="", country="us", page=1, results_per_page=8, remote=False):
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return search_sample_jobs(title, location, page, results_per_page, remote)

    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "results_per_page": results_per_page,
        "what": title,
        "content-type": "application/json",
    }
    if remote:
        params["what"] = f"{title} remote"
    if location:
        params["where"] = location

    url = f"{ADZUNA_API_BASE_URL}/{country}/search/{page}?{urlencode(params)}"

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


def search_sample_jobs(title, location="", page=1, results_per_page=8, remote=False):
    normalized_title = title.lower()
    normalized_location = location.lower()
    scored_jobs = []

    for job in SAMPLE_JOBS:
        if remote and "remote" not in job["location"].lower():
            continue
        searchable_text = " ".join(
            [
                job["title"],
                job["company"],
                job["location"],
                job["description"],
            ]
        ).lower()
        title_match = normalized_title in searchable_text
        location_match = not normalized_location or normalized_location in job["location"].lower()
        score = int(title_match) + int(location_match)

        if title_match or location_match or not normalized_title:
            scored_jobs.append((score, job))

    if not scored_jobs and not normalized_title and not normalized_location:
        scored_jobs = [(0, job) for job in SAMPLE_JOBS]

    start = (page - 1) * results_per_page
    end = start + results_per_page
    return [
        {**job, "source": "Sample"}
        for _score, job in sorted(scored_jobs, key=lambda item: item[0], reverse=True)[start:end]
    ]


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
