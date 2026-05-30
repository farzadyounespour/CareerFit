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
        "workplace": "remote",
        "experience_level": "entry",
        "employment_type": "full_time",
        "salary_min": 55000,
        "salary_max": 70000,
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
        "workplace": "hybrid",
        "experience_level": "internship",
        "employment_type": "full_time",
        "salary_min": 42000,
        "salary_max": 52000,
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
        "workplace": "on_site",
        "experience_level": "entry",
        "employment_type": "full_time",
        "salary_min": 68000,
        "salary_max": 82000,
        "description": (
            "Build web services and internal tools using Python, Django, REST APIs, SQL, Docker, Git, and AWS. "
            "Strong problem solving, documentation, and collaboration skills are important for this role."
        ),
        "url": "",
        "source": "Sample",
    },
]


def search_adzuna_jobs(
    title,
    location="",
    country="us",
    page=1,
    results_per_page=8,
    remote=False,
    workplace="any",
    skills="",
    experience_level="any",
    employment_type="any",
    salary_min=None,
    salary_max=None,
):
    if not settings.ADZUNA_APP_ID or not settings.ADZUNA_APP_KEY:
        return search_sample_jobs(
            title,
            location,
            page,
            results_per_page,
            remote,
            workplace,
            skills,
            experience_level,
            employment_type,
            salary_min,
            salary_max,
        )

    keywords = [title, skills, _keyword_for_workplace(workplace), _keyword_for_experience(experience_level)]
    params = {
        "app_id": settings.ADZUNA_APP_ID,
        "app_key": settings.ADZUNA_APP_KEY,
        "results_per_page": results_per_page,
        "what": " ".join(keyword for keyword in keywords if keyword).strip(),
        "content-type": "application/json",
    }
    if remote and workplace == "any":
        params["what"] = f"{params['what']} remote".strip()
    if location:
        params["where"] = location
    if salary_min is not None:
        params["salary_min"] = salary_min
    if salary_max is not None:
        params["salary_max"] = salary_max
    if employment_type == "full_time":
        params["full_time"] = 1
    elif employment_type == "part_time":
        params["part_time"] = 1
    elif employment_type == "contract":
        params["contract"] = 1
    elif employment_type == "permanent":
        params["permanent"] = 1

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

    return {
        "results": [_format_adzuna_job(job) for job in payload.get("results", [])],
        "count": payload.get("count", 0),
        "page": page,
        "results_per_page": results_per_page,
    }


def search_sample_jobs(
    title,
    location="",
    page=1,
    results_per_page=8,
    remote=False,
    workplace="any",
    skills="",
    experience_level="any",
    employment_type="any",
    salary_min=None,
    salary_max=None,
):
    normalized_title = title.lower()
    normalized_location = location.lower()
    normalized_skills = skills.lower()
    scored_jobs = []

    for job in SAMPLE_JOBS:
        if remote and workplace == "any" and job["workplace"] != "remote":
            continue
        if workplace != "any" and job["workplace"] != workplace:
            continue
        if experience_level != "any" and job["experience_level"] != experience_level:
            continue
        if employment_type != "any" and job["employment_type"] != employment_type:
            continue
        if salary_min is not None and job["salary_max"] < salary_min:
            continue
        if salary_max is not None and job["salary_min"] > salary_max:
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
        skills_match = not normalized_skills or all(skill in searchable_text for skill in normalized_skills.split())
        score = int(title_match) + int(location_match)

        if skills_match and (not normalized_title or title_match) and location_match:
            scored_jobs.append((score, job))

    if not scored_jobs and not normalized_title and not normalized_location:
        scored_jobs = [(0, job) for job in SAMPLE_JOBS]

    start = (page - 1) * results_per_page
    end = start + results_per_page
    return {
        "results": [
            {**job, "source": "Sample"}
            for _score, job in sorted(scored_jobs, key=lambda item: item[0], reverse=True)[start:end]
        ],
        "count": len(scored_jobs),
        "page": page,
        "results_per_page": results_per_page,
    }


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
        "salary_min": job.get("salary_min"),
        "salary_max": job.get("salary_max"),
        "employment_type": job.get("contract_time") or job.get("contract_type") or "",
        "description": description,
        "url": job.get("redirect_url") or "",
        "source": "Adzuna",
    }


def _keyword_for_workplace(workplace):
    return {"remote": "remote", "hybrid": "hybrid", "on_site": "on site"}.get(workplace, "")


def _keyword_for_experience(experience_level):
    return {
        "internship": "intern",
        "entry": "junior",
        "mid": "mid level",
        "senior": "senior",
    }.get(experience_level, "")
