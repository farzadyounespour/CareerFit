import json
import re
from html import unescape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings


class JobSearchError(ValueError):
    pass


ADZUNA_API_BASE_URL = "https://api.adzuna.com/v1/api/jobs"
ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"
JOOBLE_API_BASE_URL = "https://jooble.org/api"
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


def search_jobs(
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
    search_args = {
        "title": title,
        "location": location,
        "country": country,
        "page": page,
        "results_per_page": results_per_page,
        "remote": remote,
        "workplace": workplace,
        "skills": skills,
        "experience_level": experience_level,
        "employment_type": employment_type,
        "salary_min": salary_min,
        "salary_max": salary_max,
    }
    providers = [("Arbeitnow", search_arbeitnow_jobs)]
    if settings.ADZUNA_APP_ID and settings.ADZUNA_APP_KEY:
        providers.insert(0, ("Adzuna", search_adzuna_jobs))
    if settings.JOOBLE_API_KEY:
        providers.append(("Jooble", search_jooble_jobs))

    successful_results = []
    provider_errors = []
    successful_providers = []
    total_count = 0

    for provider_name, provider_search in providers:
        try:
            provider_result = provider_search(**search_args)
        except JobSearchError as exc:
            provider_errors.append({"provider": provider_name, "detail": str(exc)})
            continue
        successful_results.append(provider_result["results"])
        successful_providers.append(provider_name)
        total_count += provider_result["count"]

    live_jobs = _deduplicate_jobs(_interleave(successful_results))[:results_per_page]
    if successful_providers:
        return {
            "results": live_jobs,
            "count": total_count,
            "page": page,
            "results_per_page": results_per_page,
            "providers": successful_providers,
            "provider_errors": provider_errors,
            "using_sample_data": False,
        }

    sample_result = search_sample_jobs(**search_args)
    return {
        **sample_result,
        "providers": ["Sample"],
        "provider_errors": provider_errors,
        "using_sample_data": True,
    }


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
            title=title,
            location=location,
            country=country,
            page=page,
            results_per_page=results_per_page,
            remote=remote,
            workplace=workplace,
            skills=skills,
            experience_level=experience_level,
            employment_type=employment_type,
            salary_min=salary_min,
            salary_max=salary_max,
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


def search_arbeitnow_jobs(
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
    del country
    try:
        with urlopen(f"{ARBEITNOW_API_URL}?{urlencode({'page': page})}", timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise JobSearchError("Unable to reach Arbeitnow job search.") from exc

    jobs = [
        _format_arbeitnow_job(job)
        for job in payload.get("data", [])
    ]
    filtered_jobs = [
        job for job in jobs
        if _matches_filters(
            job,
            title=title,
            location=location,
            remote=remote,
            workplace=workplace,
            skills=skills,
            experience_level=experience_level,
            employment_type=employment_type,
            salary_min=salary_min,
            salary_max=salary_max,
        )
    ]
    has_next = bool((payload.get("links") or {}).get("next"))
    count = len(filtered_jobs) + (page * results_per_page if has_next else 0)
    return {
        "results": filtered_jobs[:results_per_page],
        "count": count,
        "page": page,
        "results_per_page": results_per_page,
    }


def search_jooble_jobs(
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
    del country, remote, salary_max
    keywords = [title, skills, _keyword_for_workplace(workplace), _keyword_for_experience(experience_level)]
    body = {
        "keywords": " ".join(keyword for keyword in keywords if keyword).strip(),
        "location": location,
        "page": str(page),
        "ResultOnPage": str(results_per_page),
        "companysearch": "false",
    }
    if salary_min is not None:
        body["salary"] = salary_min
    if employment_type != "any":
        body["keywords"] = f"{body['keywords']} {_keyword_for_employment(employment_type)}".strip()
    request = Request(
        f"{JOOBLE_API_BASE_URL}/{settings.JOOBLE_API_KEY}",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code == 403:
            raise JobSearchError("Jooble rejected the API key.") from exc
        raise JobSearchError("Jooble job search failed.") from exc
    except (URLError, TimeoutError, json.JSONDecodeError) as exc:
        raise JobSearchError("Unable to reach Jooble job search.") from exc
    return {
        "results": [_format_jooble_job(job) for job in payload.get("jobs", [])],
        "count": payload.get("totalCount", 0),
        "page": page,
        "results_per_page": results_per_page,
    }


def search_sample_jobs(
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
    del country
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


def _format_arbeitnow_job(job):
    return {
        "id": str(job.get("slug") or ""),
        "title": job.get("title") or "Untitled job",
        "company": job.get("company_name") or "",
        "location": job.get("location") or ("Remote" if job.get("remote") else ""),
        "workplace": "remote" if job.get("remote") else "on_site",
        "employment_type": _normalize_employment_type((job.get("job_types") or [""])[0]),
        "description": _strip_html(job.get("description") or ""),
        "url": job.get("url") or "",
        "source": "Arbeitnow",
    }


def _format_jooble_job(job):
    return {
        "id": str(job.get("id") or ""),
        "title": job.get("title") or "Untitled job",
        "company": job.get("company") or "",
        "location": job.get("location") or "",
        "salary_text": job.get("salary") or "",
        "employment_type": _normalize_employment_type(job.get("type") or ""),
        "description": _strip_html(job.get("snippet") or ""),
        "url": job.get("link") or "",
        "source": "Jooble",
    }


def _matches_filters(
    job,
    *,
    title,
    location,
    remote,
    workplace,
    skills,
    experience_level,
    employment_type,
    salary_min,
    salary_max,
):
    searchable_text = " ".join(
        [job["title"], job["company"], job["location"], job["description"]]
    ).lower()
    if title and title.lower() not in searchable_text:
        return False
    if location and location.lower() not in job["location"].lower():
        return False
    if remote and workplace == "any" and job.get("workplace") != "remote":
        return False
    if workplace != "any" and job.get("workplace") != workplace:
        return False
    if skills and not all(skill in searchable_text for skill in skills.lower().split()):
        return False
    if experience_level != "any" and _keyword_for_experience(experience_level) not in searchable_text:
        return False
    if employment_type != "any" and job.get("employment_type") != employment_type:
        return False
    if salary_min is not None or salary_max is not None:
        return False
    return True


def _deduplicate_jobs(jobs):
    unique_jobs = []
    seen = set()
    for job in jobs:
        identity = (
            job.get("title", "").strip().lower(),
            job.get("company", "").strip().lower(),
            job.get("location", "").strip().lower(),
        )
        if identity in seen:
            continue
        seen.add(identity)
        unique_jobs.append(job)
    return unique_jobs


def _interleave(groups):
    longest_group = max((len(group) for group in groups), default=0)
    return [
        group[index]
        for index in range(longest_group)
        for group in groups
        if index < len(group)
    ]


def _strip_html(value):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", value))).strip()


def _normalize_employment_type(value):
    normalized = value.lower().replace("-", "_").replace(" ", "_")
    return {
        "fulltime": "full_time",
        "parttime": "part_time",
        "freelance": "contract",
    }.get(normalized, normalized)


def _keyword_for_workplace(workplace):
    return {"remote": "remote", "hybrid": "hybrid", "on_site": "on site"}.get(workplace, "")


def _keyword_for_experience(experience_level):
    return {
        "internship": "intern",
        "entry": "junior",
        "mid": "mid level",
        "senior": "senior",
    }.get(experience_level, "")


def _keyword_for_employment(employment_type):
    return {
        "full_time": "full time",
        "part_time": "part time",
        "contract": "contract",
        "permanent": "permanent",
    }.get(employment_type, "")
