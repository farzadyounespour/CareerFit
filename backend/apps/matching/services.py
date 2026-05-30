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
}

SKILL_ALIASES = {
    "bi": "business intelligence",
    "powerbi": "power bi",
    "rest api": "rest",
    "restful": "rest",
    "js": "javascript",
    "ml": "machine learning",
    "natural language processing": "nlp",
    "data analytics": "data analysis",
    "collaboration": "teamwork",
    "problem-solving": "problem solving",
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
        token.strip(".,;:-")
        for token in re.findall(r"[a-zA-Z][a-zA-Z+#.-]*", normalize_text(text))
        if token.strip(".,;:-") not in STOP_WORDS and len(token.strip(".,;:-")) > 2
    ]


def split_requirements(job_description):
    chunks = re.split(r"[\n.;]+", job_description)
    requirements = []

    for chunk in chunks:
        cleaned = chunk.strip(" -\t")
        if len(cleaned.split()) < 3:
            continue
        if len(cleaned) > 180:
            cleaned = cleaned[:177].rstrip() + "..."
        requirements.append(cleaned)

    return requirements[:12]


def extract_skills(text):
    normalized = normalize_text(text)
    skills = {skill for skill in SKILL_KEYWORDS if _contains_phrase(normalized, skill)}
    for alias, canonical_skill in SKILL_ALIASES.items():
        if _contains_phrase(normalized, alias):
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
    similarity_score = calculate_text_similarity(requirement, resume_text)
    score = round((overlap_score * 0.7) + (similarity_score * 0.3))
    return score, overlap, round(similarity_score)


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


def analyze_resume_match(user_profile, resume_text, job_description):
    requirements = split_requirements(job_description)
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(job_description))

    categories = {
        "matched": [],
        "partial": [],
        "weak": [],
        "missing": [],
    }

    for requirement in requirements:
        score, evidence, similarity = score_requirement(requirement, resume_text)
        category = categorize_requirement(score)
        categories[category].append(
            {
                "text": requirement,
                "score": score,
                "similarity": similarity,
                "evidence": evidence[:8],
            }
        )

    missing_skills = sorted(job_skills - resume_skills)
    matched_skills = sorted(job_skills & resume_skills)
    total_requirements = max(len(requirements), 1)
    weighted_score = (
        len(categories["matched"]) * 1.0
        + len(categories["partial"]) * 0.65
        + len(categories["weak"]) * 0.35
    ) / total_requirements
    match_score = round(weighted_score * 100)
    readiness_score = max(0, min(100, round(match_score - len(missing_skills[:8]) * 2)))

    recommendations = build_recommendations(
        user_profile=user_profile,
        categories=categories,
        missing_skills=missing_skills,
    )
    ats = analyze_ats_readiness(resume_text, user_profile.get("target_role", ""))

    return {
        "summary": {
            "candidate_name": user_profile.get("name", ""),
            "target_role": user_profile.get("target_role", ""),
            "match_score": match_score,
            "readiness_score": readiness_score,
            "requirements_reviewed": len(requirements),
            "similarity_method": "tf-idf cosine",
        },
        "skills": {
            "matched": matched_skills,
            "missing": missing_skills[:12],
        },
        "ats": ats,
        "requirements": categories,
        "recommendations": recommendations,
        "interview_prep": build_interview_prep(job_description, job_skills),
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
