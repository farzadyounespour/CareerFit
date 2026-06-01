import re
from collections import Counter
from math import log, sqrt


STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "be",
    "for",
    "in",
    "of",
    "on",
    "or",
    "our",
    "the",
    "to",
    "with",
    "you",
    "your",
    "ability",
    "candidate",
    "experience",
    "include",
    "including",
    "looking",
    "preferred",
    "required",
    "requirement",
    "requirements",
    "skill",
    "skills",
    "who",
}

SKILL_KEYWORDS = {
    "python",
    "java",
    "javascript",
    "react",
    "django",
    "sql",
    "postgresql",
    "mysql",
    "tableau",
    "power bi",
    "excel",
    "machine learning",
    "data analysis",
    "nlp",
    "api",
    "rest",
    "git",
    "docker",
    "aws",
    "communication",
    "teamwork",
    "leadership",
    "problem solving",
    "azure",
    "accessibility",
    "testing",
    "pandas",
    "looker",
    "r",
    "data visualization",
    "business intelligence",
    "agile",
    "airflow",
    "bigquery",
    "c#",
    "c++",
    "clickhouse",
    "css",
    "data cleaning",
    "data modeling",
    "dashboards",
    "devops",
    "etl",
    "elasticsearch",
    "event-driven architecture",
    "golang",
    "html",
    "kafka",
    "kubernetes",
    "linux",
    "microservices",
    "mongodb",
    "node.js",
    "numpy",
    "project management",
    "pytorch",
    "redis",
    "reporting",
    "ruby on rails",
    "scala",
    "scikit-learn",
    "scrum",
    "snowflake",
    "spark",
    "stakeholder management",
    "statistics",
    "tensorflow",
    "typescript",
}

SKILL_ALIASES = {
    "bi": "business intelligence",
    "powerbi": "power bi",
    "nodejs": "node.js",
    "node js": "node.js",
    "postgres": "postgresql",
    "rest api": "rest",
    "restful": "rest",
    "js": "javascript",
    "github": "git",
    "k8s": "kubernetes",
    "ml": "machine learning",
    "natural language processing": "nlp",
    "data analytics": "data analysis",
    "collaboration": "teamwork",
    "problem-solving": "problem solving",
    "event-driven": "event-driven architecture",
    "event driven": "event-driven architecture",
    "dashboard": "dashboards",
    "stakeholders": "stakeholder management",
}

TOKEN_ALIASES = {
    "analytics": "analysis",
    "analyze": "analysis",
    "analyzed": "analysis",
    "cleaned": "clean",
    "cleaning": "clean",
    "collaboration": "collaborate",
    "collaborated": "collaborate",
    "github": "git",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "reporting": "report",
    "reports": "report",
}

SECTION_PATTERNS = {
    "summary": r"\b(summary|profile|objective|about me)\b",
    "education": r"\b(education|academic background|degree|university|college)\b",
    "experience": r"\b(experience|employment|work history|professional experience)\b",
    "skills": r"\b(skills|technical skills|competencies|technologies)\b",
}


def normalize_text(text):
    return re.sub(r"\s+", " ", text.lower()).strip()


def tokenize(text):
    return [
        _normalize_token(token.strip(".,;:-"))
        for token in re.findall(r"[a-zA-Z][a-zA-Z+#.-]*", normalize_text(text).replace("-", " "))
        if _normalize_token(token.strip(".,;:-")) not in STOP_WORDS and len(_normalize_token(token.strip(".,;:-"))) > 2
    ]


def _normalize_token(token):
    if token in TOKEN_ALIASES:
        return TOKEN_ALIASES[token]
    if token.endswith("ies") and len(token) > 4:
        return token[:-3] + "y"
    if token.endswith("s") and len(token) > 4 and not token.endswith(("is", "ss", "us")):
        return token[:-1]
    return token


def split_requirements(job_description):
    chunks = re.split(r"[\n.;]+", job_description)
    requirements = []
    seen = set()

    for chunk in chunks:
        cleaned = chunk.strip(" -\t")
        if len(cleaned.split()) < 3:
            continue
        if len(cleaned) > 180:
            cleaned = cleaned[:177].rstrip() + "..."
        key = normalize_text(cleaned)
        if key in seen:
            continue
        seen.add(key)
        requirements.append(cleaned)

    return requirements[:12]


def extract_skills(text):
    normalized = normalize_text(text)
    skills = {skill for skill in SKILL_KEYWORDS if _contains_phrase(normalized, skill)}
    for alias, canonical_skill in SKILL_ALIASES.items():
        if alias == "bi":
            alias_found = re.search(r"(?<!power )(?<!power-)\bbi\b", normalized) is not None
        elif alias == "js":
            alias_found = re.search(r"(?<![a-zA-Z0-9.])js(?![a-zA-Z0-9])", normalized) is not None
        else:
            alias_found = _contains_phrase(normalized, alias)
        if alias_found:
            skills.add(canonical_skill)
    return sorted(skills)


def _contains_phrase(text, phrase):
    return re.search(rf"(?<![a-zA-Z0-9]){re.escape(phrase)}(?![a-zA-Z0-9])", text) is not None


def analyze_ats_readiness(resume_text, target_role=""):
    normalized = normalize_text(resume_text)
    paragraphs = [line.strip() for line in resume_text.splitlines() if line.strip()]
    target_terms = [token for token in tokenize(target_role) if len(token) > 3]
    checks = {
        "email": bool(re.search(r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}", resume_text)),
        "phone": bool(re.search(r"(?:\+?\d[\d(). -]{8,}\d)", resume_text)),
        "location": bool(
            re.search(
                r"\b(location|address|city|province|state|remote|canada|united states|montreal|toronto|vancouver|ottawa|new york)\b",
                normalized,
            )
        ),
        "summary": bool(re.search(SECTION_PATTERNS["summary"], normalized)),
        "education": bool(re.search(SECTION_PATTERNS["education"], normalized)),
        "experience": bool(re.search(SECTION_PATTERNS["experience"], normalized)),
        "skills_section": bool(re.search(SECTION_PATTERNS["skills"], normalized)),
        "bullets": bool(re.search(r"(?m)^\s*[-*•]\s+", resume_text)),
        "reasonable_length": 50 <= len(resume_text.split()) <= 1200,
        "dates": bool(re.search(r"\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b", normalized)),
        "measurable_results": bool(re.search(r"\b\d+(?:[.,]\d+)?%?\b", resume_text)),
        "concise_paragraphs": all(len(paragraph.split()) <= 55 for paragraph in paragraphs),
        "target_role": not target_terms or any(term in normalized for term in target_terms),
    }
    labels = {
        "email": "Email address",
        "phone": "Phone number",
        "location": "Location",
        "summary": "Summary section",
        "education": "Education section",
        "experience": "Experience section",
        "skills_section": "Skills section",
        "bullets": "Readable bullet points",
        "reasonable_length": "Resume length",
        "dates": "Experience dates",
        "measurable_results": "Measurable achievements",
        "concise_paragraphs": "Concise paragraphs",
        "target_role": "Target-role language",
    }
    passed = sum(checks.values())
    return {
        "score": round((passed / len(checks)) * 100),
        "checks": [
            {
                "id": check_id,
                "label": labels[check_id],
                "passed": passed_check,
            }
            for check_id, passed_check in checks.items()
        ],
        "issues": [labels[check_id] for check_id, passed_check in checks.items() if not passed_check],
    }


def score_requirement(requirement, resume_text):
    req_tokens = set(tokenize(requirement))
    resume_tokens = set(tokenize(resume_text))

    if not req_tokens:
        return 0, [], 0

    overlap = sorted(req_tokens & resume_tokens)
    overlap_score = (len(overlap) / len(req_tokens)) * 100
    similarity_score = max(
        calculate_text_similarity(requirement, segment)
        for segment in _resume_evidence_segments(resume_text)
    )
    requirement_skills = set(extract_skills(requirement))
    resume_skills = set(extract_skills(resume_text))
    satisfied_alternatives = satisfied_skill_alternatives(requirement, resume_skills)
    scored_requirement_skills = requirement_skills - (satisfied_alternatives - resume_skills)
    skill_score = (
        (len(scored_requirement_skills & resume_skills) / len(scored_requirement_skills)) * 100
        if scored_requirement_skills
        else overlap_score
    )
    score = round((overlap_score * 0.5) + (similarity_score * 0.25) + (skill_score * 0.25))
    return score, overlap, round(similarity_score)


def _resume_evidence_segments(resume_text):
    segments = [
        segment.strip(" -\t")
        for segment in re.split(r"[\n.;]+", resume_text)
        if len(segment.strip(" -\t").split()) >= 2
    ]
    return segments or [resume_text]


def calculate_text_similarity(requirement, resume_text):
    requirement_tokens = tokenize(requirement)
    resume_tokens = tokenize(resume_text)

    if not requirement_tokens or not resume_tokens:
        return 0

    requirement_counts = Counter(requirement_tokens)
    resume_counts = Counter(resume_tokens)
    vocabulary = set(requirement_counts) | set(resume_counts)
    document_count = 2

    idf = {}
    for token in vocabulary:
        document_frequency = int(token in requirement_counts) + int(token in resume_counts)
        idf[token] = log((document_count + 1) / (document_frequency + 1)) + 1

    requirement_vector = {
        token: requirement_counts[token] * idf[token]
        for token in vocabulary
    }
    resume_vector = {
        token: resume_counts[token] * idf[token]
        for token in vocabulary
    }

    numerator = sum(requirement_vector[token] * resume_vector[token] for token in vocabulary)
    requirement_magnitude = sqrt(sum(value * value for value in requirement_vector.values()))
    resume_magnitude = sqrt(sum(value * value for value in resume_vector.values()))

    if not requirement_magnitude or not resume_magnitude:
        return 0

    return (numerator / (requirement_magnitude * resume_magnitude)) * 100


def categorize_requirement(score):
    if score >= 70:
        return "matched"
    if score >= 40:
        return "partial"
    if score >= 20:
        return "weak"
    return "missing"


def requirement_priority(requirement):
    normalized = normalize_text(requirement)
    if re.search(r"\b(required|must|need|essential|minimum|should)\b", normalized):
        return "high"
    if re.search(r"\b(preferred|asset|bonus|nice to have|plus)\b", normalized):
        return "low"
    return "medium"


def priority_weight(priority):
    return {"high": 1.25, "medium": 1.0, "low": 0.7}[priority]


def skill_priority_weights(requirements, job_skills):
    weights = {}
    for requirement in requirements:
        weight = priority_weight(requirement_priority(requirement))
        for skill in extract_skills(requirement):
            weights[skill] = max(weights.get(skill, 0), weight)
    return {skill: weights.get(skill, 1.0) for skill in job_skills}


def skill_priority(weight):
    if weight >= 1.25:
        return "high"
    if weight <= 0.7:
        return "low"
    return "medium"


def satisfied_skill_alternatives(job_description, resume_skills):
    normalized = normalize_text(job_description)
    satisfied = set()
    skill_term = "|".join(re.escape(skill) for skill in sorted(SKILL_KEYWORDS, key=len, reverse=True))
    pattern = re.compile(
        rf"(?P<alternatives>(?:{skill_term})(?:\s*,\s*(?:{skill_term}))*\s*,?\s+(?:and/)?or\s+(?:{skill_term}))"
    )
    for match in pattern.finditer(normalized):
        alternatives = set(extract_skills(match.group("alternatives")))
        if alternatives & resume_skills:
            satisfied.update(alternatives)
    return satisfied


def analyze_resume_match(user_profile, resume_text, job_description):
    requirements = split_requirements(job_description)
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))
    satisfied_alternatives = satisfied_skill_alternatives(job_description, resume_skills)
    scored_job_skills = job_skills - (satisfied_alternatives - resume_skills)

    categories = {
        "matched": [],
        "partial": [],
        "weak": [],
        "missing": [],
    }

    for requirement in requirements:
        score, evidence, similarity = score_requirement(requirement, resume_text)
        category = categorize_requirement(score)
        priority = requirement_priority(requirement)
        categories[category].append(
            {
                "text": requirement,
                "score": score,
                "similarity": similarity,
                "evidence": evidence[:8],
                "priority": priority,
            }
        )

    missing_skills = sorted(scored_job_skills - resume_skills)
    matched_skills = sorted(scored_job_skills & resume_skills)
    scored_requirements = [item for group in categories.values() for item in group]
    total_requirement_weight = sum(priority_weight(item["priority"]) for item in scored_requirements) or 1
    requirement_score = round(
        sum(item["score"] * priority_weight(item["priority"]) for item in scored_requirements)
        / total_requirement_weight
    )
    skill_weights = skill_priority_weights(requirements, scored_job_skills)
    total_skill_weight = sum(skill_weights.values())
    skill_score = (
        round(sum(skill_weights[skill] for skill in matched_skills) / total_skill_weight * 100)
        if total_skill_weight
        else requirement_score
    )
    match_score = round((requirement_score * 0.65) + (skill_score * 0.35))
    ats = analyze_ats_readiness(resume_text, user_profile.get("target_role", ""))
    readiness_score = round((match_score * 0.8) + (ats["score"] * 0.2))
    recommendations = build_recommendations(
        user_profile=user_profile,
        categories=categories,
        missing_skills=missing_skills,
    )

    return {
        "summary": {
            "candidate_name": user_profile.get("name", ""),
            "target_role": user_profile.get("target_role", ""),
            "match_score": match_score,
            "readiness_score": readiness_score,
            "requirements_reviewed": len(requirements),
            "similarity_method": "weighted requirement evidence and tf-idf cosine",
            "score_breakdown": {
                "requirement_evidence": {
                    "score": requirement_score,
                    "weight": 65,
                },
                "skill_coverage": {
                    "score": skill_score,
                    "weight": 35,
                },
                "ats_preparation": {
                    "score": ats["score"],
                    "weight": 20,
                },
                "job_match_weight": 80,
            },
        },
        "skills": {
            "matched": matched_skills,
            "missing": missing_skills[:12],
            "matched_details": [
                {"name": skill, "priority": skill_priority(skill_weights[skill])}
                for skill in matched_skills
            ],
            "missing_details": [
                {"name": skill, "priority": skill_priority(skill_weights[skill])}
                for skill in missing_skills[:12]
            ],
        },
        "ats": ats,
        "requirements": categories,
        "recommendations": recommendations,
        "interview_prep": build_interview_prep(job_description, scored_job_skills),
    }


def build_interview_prep(job_description, job_skills=None):
    skills = sorted(job_skills or extract_skills(job_description))[:5]
    questions = [
        {
            "type": "role",
            "question": "What interests you about this role, and which part of your experience is most relevant?",
            "hint": "Connect one requirement from the posting to a specific project or result.",
        },
        {
            "type": "behavioral",
            "question": "Tell me about a time you solved a difficult problem with limited information.",
            "hint": "Use Situation, Task, Action, and Result. Include a measurable outcome when possible.",
        },
    ]
    questions.extend(
        {
            "type": "skill",
            "question": f"Describe a project where you used {skill}. What did you contribute and what improved?",
            "hint": "Name the context, your decision, and the result instead of only defining the skill.",
        }
        for skill in skills
    )
    return {
        "questions": questions[:7],
        "star_prompts": [
            {"label": "Situation", "detail": "Set the context in one or two sentences."},
            {"label": "Task", "detail": "Clarify your responsibility or the problem you owned."},
            {"label": "Action", "detail": "Explain the steps you personally took."},
            {"label": "Result", "detail": "Close with the outcome, ideally using a number."},
        ],
    }


def build_recommendations(user_profile, categories, missing_skills):
    target_role = user_profile.get("target_role") or "this role"
    recommendations = []

    if missing_skills:
        recommendations.append(
            {
                "title": "Add evidence for missing skills",
                "detail": (
                    "Strengthen the resume with project or work examples for "
                    + ", ".join(missing_skills[:5])
                    + "."
                ),
            }
        )

    if categories["missing"]:
        recommendations.append(
            {
                "title": "Address missing job requirements",
                "detail": "Add a targeted bullet for the most important missing requirement before applying.",
            }
        )

    if categories["partial"] or categories["weak"]:
        recommendations.append(
            {
                "title": "Make partial matches more explicit",
                "detail": f"Use language closer to the posting so your experience clearly maps to {target_role}.",
            }
        )

    if not recommendations:
        recommendations.append(
            {
                "title": "Resume is aligned",
                "detail": "Focus on tailoring the summary and strongest accomplishments for this job posting.",
            }
        )

    return recommendations
