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
    return sorted(skill for skill in SKILL_KEYWORDS if skill in normalized)


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
        "requirements": categories,
        "recommendations": recommendations,
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
