import hashlib
import json
import re
from collections import Counter
from math import log, sqrt
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache


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
    "role",
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
    "ai-assisted development",
    "attack surface",
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
    "express",
    "etl",
    "elasticsearch",
    "event-driven architecture",
    "full-stack",
    "golang",
    "html",
    "kafka",
    "kubernetes",
    "linux",
    "microservices",
    "mongodb",
    "node.js",
    "next.js",
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
    "supabase",
    "statistics",
    "tensorflow",
    "typescript",
}

SKILL_ALIASES = {
    "bi": "business intelligence",
    "powerbi": "power bi",
    "nodejs": "node.js",
    "node js": "node.js",
    "nextjs": "next.js",
    "next js": "next.js",
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
    "ai assisted": "ai-assisted development",
    "ai-assisted": "ai-assisted development",
    "ai assisted development": "ai-assisted development",
    "full stack": "full-stack",
    "postgresql/supabase": "postgresql",
}

HIRING_CONTEXT_PATTERNS = (
    r"\b(about us|who we are|our company|company|culture|benefits|perks|what we offer)\b",
    r"\b(remote[- ]?first culture|join our|we are committed|we offer|vacation|salary|benefits)\b",
    r"\b(equal opportunity|diversity|inclusion|office|work from home)\b",
    r"\b(hiring process|hiring practices|recruitment process|application process|selection process)\b",
)

REQUIREMENT_SIGNAL_PATTERNS = (
    r"\b(required|must|need|essential|minimum|should|responsible|responsibilities|qualifications)\b",
    r"\b(experience|expertise|proficien|knowledge|familiar|comfortable|hands[- ]?on)\b",
    r"\b(build|design|develop|deliver|implement|maintain|manage|own|lead|support|integrate|collaborate)\b",
)

NON_RESUME_REQUIREMENT_PATTERNS = (
    r"\b(if you have questions|questions regarding|please contact|contact\s+\[?email|email protected|reach out)\b",
    r"\b(hiring practices|hiring process|recruitment process|application process|selection process|screening process|interview process|recruiting team|talent acquisition)\b",
    r"\b(artificial intelligence|ai tools?|automated tools?|automated decision|algorithmic)\b.*\b(hiring|recruit|application|selection|screening|assessment)\b",
    r"\b(hiring|recruit|application|selection|screening|assessment)\b.*\b(artificial intelligence|ai tools?|automated tools?|automated decision|algorithmic)\b",
    r"\b(equal opportunity|eeo|affirmative action|reasonable accommodation|accommodation request|diversity and inclusion|veteran status|disability status)\b",
    r"\b(privacy policy|privacy notice|personal information|personal data|gdpr|ccpa|data retention|cookies?)\b",
    r"\b(apply now|submit your application|click apply|learn more|job alert|talent community|careers page|application portal)\b",
    r"\b(compensation|salary range|pay range|benefits package|vacation policy|paid time off|stock options|bonus eligible|equity package)\b",
    r"\b(background check|reference check|employment verification|work authorization|visa sponsorship|e-verify|criminal history)\b",
    r"\b(agency|agencies|recruiters?|staffing firms?|unsolicited resumes?)\b",
    r"\b(job id|job number|requisition|req id|posted date|posting date|employment type|work location)\b",
)

SEMANTIC_SKILL_ALIASES = {
    "backend endpoint": {"api", "rest"},
    "backend endpoints": {"api", "rest"},
    "api endpoint": {"api", "rest"},
    "api endpoints": {"api", "rest"},
    "web service": {"api", "rest"},
    "web services": {"api", "rest"},
    "http service": {"api", "rest"},
    "http services": {"api", "rest"},
    "third-party service": {"api"},
    "third-party services": {"api"},
    "third party service": {"api"},
    "third party services": {"api"},
    "external service": {"api"},
    "external services": {"api"},
    "integrated services": {"api"},
    "service integration": {"api"},
    "service integrations": {"api"},
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

SEMANTIC_CONCEPT_GROUPS = {
    "api_backend": {
        "api",
        "apis",
        "backend",
        "endpoint",
        "endpoints",
        "external service",
        "http",
        "integration",
        "integrations",
        "microservice",
        "microservices",
        "rest",
        "restful",
        "service",
        "services",
        "third party",
        "third-party",
    },
    "testing_quality": {
        "chaos",
        "defect",
        "defects",
        "functional",
        "integration test",
        "performance",
        "qa",
        "quality",
        "regression",
        "reliability",
        "sdlc",
        "test",
        "testing",
        "unit test",
        "validate",
        "validation",
    },
    "frontend_product": {
        "accessibility",
        "browser",
        "css",
        "customer-facing",
        "frontend",
        "full-stack",
        "html",
        "interface",
        "javascript",
        "next.js",
        "react",
        "typescript",
        "ui",
        "user experience",
        "workflow",
    },
    "data_analytics": {
        "analysis",
        "analytics",
        "business intelligence",
        "dashboard",
        "dashboards",
        "data",
        "data analysis",
        "data visualization",
        "insight",
        "insights",
        "metric",
        "metrics",
        "report",
        "reporting",
        "sql",
        "statistics",
        "tableau",
        "visualization",
    },
    "database_storage": {
        "bigquery",
        "clickhouse",
        "database",
        "databases",
        "mongodb",
        "mysql",
        "postgresql",
        "redis",
        "sql",
        "storage",
        "supabase",
        "warehouse",
    },
    "cloud_devops": {
        "aws",
        "azure",
        "cloud",
        "container",
        "containers",
        "deployment",
        "devops",
        "docker",
        "infrastructure",
        "kubernetes",
        "linux",
        "monitoring",
        "production",
        "reliability",
    },
    "collaboration_delivery": {
        "agile",
        "collaborate",
        "collaborated",
        "communication",
        "cross-functional",
        "deliver",
        "delivery",
        "lead",
        "partnered",
        "scrum",
        "stakeholder",
        "stakeholders",
        "team",
        "teamwork",
    },
    "security_risk": {
        "attack surface",
        "authentication",
        "authorization",
        "compliance",
        "risk",
        "security",
        "threat",
        "vulnerability",
    },
}

ACTION_GROUPS = {
    "build": {"build", "built", "create", "created", "develop", "developed", "deliver", "delivered", "implement", "implemented"},
    "design": {"architect", "architected", "design", "designed", "model", "modeled", "structure", "structured"},
    "integrate": {"connect", "connected", "integrate", "integrated", "link", "linked"},
    "operate": {"debug", "debugged", "maintain", "maintained", "monitor", "monitored", "support", "supported", "troubleshoot"},
    "analyze": {"analyze", "analyzed", "measure", "measured", "report", "reported", "visualize", "visualized"},
    "test": {"test", "tested", "validate", "validated", "verify", "verified"},
    "collaborate": {"collaborate", "collaborated", "coordinate", "coordinated", "lead", "led", "partner", "partnered"},
}

MATCH_METHOD_LABELS = {
    "embedding": "Embedding semantic match",
    "semantic": "Semantic concept match",
    "skill": "Skill evidence match",
    "hybrid": "Hybrid lexical and semantic match",
    "lexical": "Keyword evidence match",
    "weak": "Weak related wording",
}


def normalize_text(text):
    return re.sub(r"\s+", " ", text.lower()).strip()


def strip_urls(text):
    return re.sub(r"https?://\S+|www\.\S+", " ", text)


def strip_source_metadata(text):
    return "\n".join(
        line
        for line in text.splitlines()
        if not re.match(r"\s*(source|url|apply|posting|company|location)\s*:", line, flags=re.IGNORECASE)
    )


def clean_match_text(text):
    return strip_urls(strip_source_metadata(text))


def tokenize(text):
    text = clean_match_text(text)
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
    job_description = clean_match_text(job_description)
    chunks = re.split(r"[\n;]+|(?<=[.!?])\s+", job_description)
    requirements = []
    seen = set()

    for chunk in chunks:
        cleaned = chunk.strip(" -\t.")
        if not is_requirement_candidate(cleaned):
            continue
        if len(cleaned) > 180:
            cleaned = cleaned[:177].rstrip() + "..."
        key = normalize_text(cleaned)
        if key in seen:
            continue
        seen.add(key)
        requirements.append(cleaned)

    return requirements[:12]


def is_requirement_candidate(text):
    cleaned = text.strip(" -\t")
    words = cleaned.split()
    if len(words) < 4:
        return False
    normalized = normalize_text(cleaned)
    if is_non_resume_requirement(normalized):
        return False
    has_skill = bool(extract_skills(cleaned))
    has_requirement_signal = any(re.search(pattern, normalized) for pattern in REQUIREMENT_SIGNAL_PATTERNS)
    has_context_signal = any(re.search(pattern, normalized) for pattern in HIRING_CONTEXT_PATTERNS)
    if has_context_signal and not has_skill and not has_requirement_signal:
        return False
    if has_context_signal and len(words) < 9:
        return False
    return has_skill or has_requirement_signal


def is_non_resume_requirement(normalized_text):
    return any(re.search(pattern, normalized_text) for pattern in NON_RESUME_REQUIREMENT_PATTERNS)


def extract_skills(text):
    text = clean_match_text(text)
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
    skills.update(extract_semantic_skill_matches(text))
    return sorted(skills)


def _contains_phrase(text, phrase):
    return re.search(rf"(?<![a-zA-Z0-9]){re.escape(phrase)}(?![a-zA-Z0-9])", text) is not None


def extract_semantic_skill_matches(text):
    text = clean_match_text(text)
    normalized = normalize_text(text)
    matches = set()
    for phrase, skills in SEMANTIC_SKILL_ALIASES.items():
        if _contains_phrase(normalized, phrase):
            matches.update(skills)
    return matches


def extract_semantic_concepts(text):
    text = clean_match_text(text)
    normalized = normalize_text(text)
    tokens = set(tokenize(text))
    skills = set(extract_skills(text))
    concepts = set()
    for concept, signals in SEMANTIC_CONCEPT_GROUPS.items():
        for signal in signals:
            if " " in signal or "-" in signal:
                signal_found = _contains_phrase(normalized, signal)
            else:
                signal_found = signal in tokens or signal in skills
            if signal_found:
                concepts.add(concept)
                break
    return concepts


def semantic_concept_score(requirement, evidence):
    requirement_concepts = extract_semantic_concepts(requirement)
    if not requirement_concepts:
        return 0, []
    evidence_concepts = extract_semantic_concepts(evidence)
    shared = sorted(requirement_concepts & evidence_concepts)
    if not shared:
        return 0, []
    coverage = len(shared) / len(requirement_concepts)
    return round(58 + (coverage * 24)), shared


def extract_action_groups(text):
    tokens = set(tokenize(text))
    actions = set()
    for action, variants in ACTION_GROUPS.items():
        if tokens & variants:
            actions.add(action)
    return actions


def action_alignment_score(requirement, evidence):
    requirement_actions = extract_action_groups(requirement)
    if not requirement_actions:
        return 0
    evidence_actions = extract_action_groups(evidence)
    shared = requirement_actions & evidence_actions
    if not shared:
        return 0
    return round((len(shared) / len(requirement_actions)) * 100)


def semantic_requirement_match(requirement, resume_text, ranked_segments=None):
    requirement = clean_match_text(requirement)
    resume_text = clean_match_text(resume_text)
    requirement_skills = set(extract_skills(requirement))
    ranked_segments = ranked_segments or rank_resume_evidence(requirement, resume_text)

    normalized_resume = normalize_text(resume_text)
    matched_skills = set()
    matched_phrases = []
    for phrase, skills in SEMANTIC_SKILL_ALIASES.items():
        if _contains_phrase(normalized_resume, phrase) and requirement_skills & skills:
            matched_skills.update(requirement_skills & skills)
            matched_phrases.append(phrase)
    if not matched_skills:
        if ranked_segments:
            best_segment = ranked_segments[0]
            if best_segment.get("embedding_score", 0) >= 78:
                return {
                    "label": "Semantic match",
                    "score": max(78, best_segment["embedding_score"]),
                    "skills": sorted(requirement_skills & set(extract_skills(best_segment["text"]))),
                    "evidence": best_segment["text"],
                    "explanation": "Different wording, related meaning detected by semantic embeddings",
                }
            if best_segment["concept_score"] >= 76 and best_segment["score"] >= 56:
                return {
                    "label": "Semantic match",
                    "score": max(76, best_segment["concept_score"]),
                    "skills": sorted(requirement_skills & set(extract_skills(best_segment["text"]))),
                    "evidence": best_segment["text"],
                    "explanation": "Different wording, related technical meaning",
                }
        return {}

    return {
        "label": "Semantic match",
        "score": 82,
        "skills": sorted(matched_skills),
        "evidence": _semantic_evidence_segment(resume_text, matched_phrases),
        "explanation": "Different wording, related technical meaning",
    }


def _semantic_evidence_segment(resume_text, matched_phrases):
    for segment in _resume_evidence_segments(resume_text):
        normalized_segment = normalize_text(segment)
        if any(_contains_phrase(normalized_segment, phrase) for phrase in matched_phrases):
            return segment
    return ""


def analyze_ats_readiness(resume_text, target_role=""):
    resume_text = clean_match_text(resume_text)
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
    requirement = clean_match_text(requirement)
    resume_text = clean_match_text(resume_text)
    req_tokens = set(tokenize(requirement))
    resume_tokens = set(tokenize(resume_text))

    if not req_tokens:
        return 0, [], 0, {}

    overlap = sorted(req_tokens & resume_tokens)
    overlap_score = (len(overlap) / len(req_tokens)) * 100
    ranked_segments = rank_resume_evidence(requirement, resume_text)
    best_segment = ranked_segments[0] if ranked_segments else empty_evidence_rank()
    similarity_score = best_segment["score"]
    requirement_skills = set(extract_skills(requirement))
    resume_skills = set(extract_skills(resume_text))
    satisfied_alternatives = satisfied_skill_alternatives(requirement, resume_skills)
    scored_requirement_skills = requirement_skills - (satisfied_alternatives - resume_skills)
    skill_score = (
        (len(scored_requirement_skills & resume_skills) / len(scored_requirement_skills)) * 100
        if scored_requirement_skills
        else max(overlap_score, best_segment["concept_score"] * 0.6)
    )
    semantic_match = semantic_requirement_match(requirement, resume_text, ranked_segments)
    semantic_score = semantic_match.get("score", 0)
    embedding_score = best_segment.get("embedding_score", 0)
    concept_floor = 24 if best_segment["concept_score"] >= 76 and best_segment["score"] >= 35 else 0
    hybrid_score = (
        (overlap_score * 0.15)
        + (similarity_score * 0.35)
        + (skill_score * 0.3)
        + (embedding_score * 0.2)
        if embedding_score
        else (overlap_score * 0.2) + (similarity_score * 0.45) + (skill_score * 0.35)
    )
    score = round(
        max(
            hybrid_score,
            semantic_score,
            concept_floor,
        )
    )
    details = {
        "best_evidence": best_segment["text"] if score >= 20 or best_segment["score"] >= 22 else "",
        "match_basis": requirement_match_basis(score, skill_score, best_segment, semantic_match),
        "lexical_score": best_segment["lexical_score"],
        "semantic_score": max(best_segment["concept_score"], semantic_score),
        "embedding_score": embedding_score,
        "action_score": best_segment["action_score"],
        "shared_concepts": best_segment["shared_concepts"],
    }
    return score, overlap, round(max(similarity_score, semantic_score, embedding_score)), semantic_match, details


def _resume_evidence_segments(resume_text):
    text = clean_match_text(resume_text)
    lines = [line.strip(" -\t") for line in text.splitlines() if line.strip(" -\t")]
    segments = []
    current_heading = ""
    for line in lines:
        is_heading = (
            len(line.split()) <= 4
            and not re.search(r"[.!?]$", line)
            and not re.match(r"^\s*[-*•]", line)
            and bool(re.search(r"[A-Z]", line))
        )
        if is_heading:
            current_heading = line
            continue
        cleaned_line = re.sub(r"^\s*[-*•]\s*", "", line).strip()
        if current_heading and len(cleaned_line.split()) >= 3:
            segments.append(f"{current_heading}: {cleaned_line}")
        segments.extend(
            segment.strip(" -\t")
            for segment in re.split(r"[.;]+", cleaned_line)
            if len(segment.strip(" -\t").split()) >= 2
        )
    if not segments:
        segments = [
            segment.strip(" -\t")
            for segment in re.split(r"[\n.;]+", text)
            if len(segment.strip(" -\t").split()) >= 2
        ]
    return segments or [resume_text]


def rank_resume_evidence(requirement, resume_text):
    segments = _resume_evidence_segments(resume_text)
    if not segments:
        return [empty_evidence_rank()]
    bm25_scores = calculate_bm25_segment_scores(requirement, segments)
    embedding_scores = calculate_embedding_segment_scores(requirement, segments)
    ranked = []
    for index, segment in enumerate(segments):
        tfidf_score = calculate_text_similarity(requirement, segment)
        bm25_score = bm25_scores[index]
        embedding_score = embedding_scores[index]
        concept_score, shared_concepts = semantic_concept_score(requirement, segment)
        lexical_score = round((bm25_score * 0.6) + (tfidf_score * 0.4))
        action_score = action_alignment_score(requirement, segment) if lexical_score or concept_score else 0
        score = (
            round((bm25_score * 0.15) + (tfidf_score * 0.15) + (concept_score * 0.35) + (action_score * 0.1) + (embedding_score * 0.25))
            if embedding_score
            else round((bm25_score * 0.2) + (tfidf_score * 0.15) + (concept_score * 0.5) + (action_score * 0.15))
        )
        ranked.append(
            {
                "text": segment,
                "score": min(100, score),
                "lexical_score": min(100, lexical_score),
                "bm25_score": min(100, round(bm25_score)),
                "tfidf_score": min(100, round(tfidf_score)),
                "concept_score": min(100, concept_score),
                "embedding_score": min(100, embedding_score),
                "action_score": min(100, action_score),
                "shared_concepts": shared_concepts,
            }
        )
    return sorted(ranked, key=lambda item: item["score"], reverse=True)


def empty_evidence_rank():
    return {
        "text": "",
        "score": 0,
        "lexical_score": 0,
        "bm25_score": 0,
        "tfidf_score": 0,
        "concept_score": 0,
        "embedding_score": 0,
        "action_score": 0,
        "shared_concepts": [],
    }


def calculate_text_similarity(requirement, resume_text):
    requirement = clean_match_text(requirement)
    resume_text = clean_match_text(resume_text)
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


def calculate_bm25_segment_scores(requirement, segments):
    query_tokens = tokenize(requirement)
    documents = [tokenize(segment) for segment in segments]
    if not query_tokens or not documents:
        return [0 for _ in segments]

    document_count = len(documents)
    average_length = sum(len(document) for document in documents) / document_count if document_count else 0
    document_frequency = Counter()
    for document in documents:
        for token in set(document):
            document_frequency[token] += 1

    k1 = 1.2
    b = 0.75
    query_terms = sorted(set(query_tokens))
    idf = {
        token: log(1 + ((document_count - document_frequency.get(token, 0) + 0.5) / (document_frequency.get(token, 0) + 0.5)))
        for token in query_terms
    }
    max_score = sum(value * (k1 + 1) for value in idf.values()) or 1

    scores = []
    for document in documents:
        if not document:
            scores.append(0)
            continue
        counts = Counter(document)
        document_length = len(document)
        raw_score = 0
        for token in query_terms:
            term_frequency = counts.get(token, 0)
            if not term_frequency:
                continue
            denominator = term_frequency + k1 * (1 - b + b * (document_length / average_length if average_length else 0))
            raw_score += idf[token] * ((term_frequency * (k1 + 1)) / denominator)
        scores.append(min(100, (raw_score / max_score) * 100))
    return scores


def calculate_embedding_segment_scores(requirement, segments):
    if not embeddings_enabled() or not segments:
        return [0 for _ in segments]
    texts = [clean_match_text(requirement), *[clean_match_text(segment) for segment in segments]]
    cache_key = "careerfit:matching-embeddings:" + hashlib.sha256(
        json.dumps(
            {
                "model": settings.OLLAMA_EMBEDDING_MODEL,
                "texts": texts,
            },
            sort_keys=True,
        ).encode("utf-8")
    ).hexdigest()
    cached_scores = cache.get(cache_key)
    if cached_scores is not None:
        return cached_scores
    try:
        embeddings = fetch_ollama_embeddings(texts)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError, KeyError, ValueError):
        return [0 for _ in segments]
    requirement_embedding = embeddings[0]
    scores = [
        min(100, max(0, round(cosine_similarity(requirement_embedding, segment_embedding) * 100)))
        for segment_embedding in embeddings[1:]
    ]
    cache.set(cache_key, scores, settings.CAREERFIT_EMBEDDING_CACHE_SECONDS)
    return scores


def embeddings_enabled():
    return bool(settings.CAREERFIT_ENABLE_EMBEDDINGS and settings.OLLAMA_EMBEDDING_MODEL)


def fetch_ollama_embeddings(texts):
    request = Request(
        f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embed",
        data=json.dumps({"model": settings.OLLAMA_EMBEDDING_MODEL, "input": texts}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urlopen(request, timeout=settings.OLLAMA_TIMEOUT_SECONDS) as response:
        payload = json.loads(response.read().decode("utf-8"))
    embeddings = payload["embeddings"]
    if not isinstance(embeddings, list) or len(embeddings) != len(texts):
        raise ValueError("Ollama returned an unexpected embedding response.")
    return embeddings


def cosine_similarity(first_vector, second_vector):
    if len(first_vector) != len(second_vector):
        raise ValueError("Embedding vectors must have the same dimensions.")
    numerator = sum(first * second for first, second in zip(first_vector, second_vector))
    first_magnitude = sqrt(sum(value * value for value in first_vector))
    second_magnitude = sqrt(sum(value * value for value in second_vector))
    if not first_magnitude or not second_magnitude:
        return 0
    return numerator / (first_magnitude * second_magnitude)


def calculate_hybrid_text_similarity(requirement, evidence):
    ranked = rank_resume_evidence(requirement, evidence)
    return ranked[0]["score"] if ranked else 0


def requirement_match_basis(score, skill_score, best_segment, semantic_match):
    if best_segment.get("embedding_score", 0) >= 78:
        return MATCH_METHOD_LABELS["embedding"]
    if semantic_match:
        return MATCH_METHOD_LABELS["semantic"]
    if skill_score >= 80:
        return MATCH_METHOD_LABELS["skill"]
    if best_segment["concept_score"] >= 58:
        return MATCH_METHOD_LABELS["hybrid"]
    if best_segment["lexical_score"] >= 35:
        return MATCH_METHOD_LABELS["lexical"]
    if score >= 20:
        return MATCH_METHOD_LABELS["weak"]
    return ""


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
    job_description = clean_match_text(job_description)
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
    resume_text = clean_match_text(resume_text)
    job_description = clean_match_text(job_description)
    requirements = split_requirements(job_description)
    requirement_text = "\n".join(requirements)
    resume_skills = set(extract_skills(resume_text))
    job_skills = set(extract_skills(requirement_text))
    satisfied_alternatives = satisfied_skill_alternatives(requirement_text, resume_skills)
    scored_job_skills = job_skills - (satisfied_alternatives - resume_skills)

    categories = {
        "matched": [],
        "partial": [],
        "weak": [],
        "missing": [],
    }

    for requirement in requirements:
        score, evidence, similarity, semantic_match, match_details = score_requirement(requirement, resume_text)
        category = categorize_requirement(score)
        priority = requirement_priority(requirement)
        requirement_result = {
            "text": requirement,
            "score": score,
            "similarity": similarity,
            "evidence": evidence[:8],
            "priority": priority,
            "best_evidence": match_details["best_evidence"],
            "match_basis": match_details["match_basis"],
            "lexical_score": match_details["lexical_score"],
            "semantic_score": match_details["semantic_score"],
            "embedding_score": match_details["embedding_score"],
            "action_score": match_details["action_score"],
            "shared_concepts": match_details["shared_concepts"],
        }
        if semantic_match:
            requirement_result["match_label"] = semantic_match["label"]
            requirement_result["semantic_explanation"] = semantic_match["explanation"]
            requirement_result["semantic_skills"] = semantic_match["skills"]
            requirement_result["semantic_evidence"] = semantic_match["evidence"]
        categories[category].append(requirement_result)

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
    priority_fixes = build_priority_fixes(
        categories=categories,
        missing_skills=missing_skills,
        matched_skills=matched_skills,
        resume_text=resume_text,
        ats_issues=ats["issues"],
    )

    return {
        "summary": {
            "candidate_name": user_profile.get("name", ""),
            "target_role": user_profile.get("target_role", ""),
            "match_score": match_score,
            "readiness_score": readiness_score,
            "requirements_reviewed": len(requirements),
            "similarity_method": "hybrid BM25 evidence ranking, tf-idf cosine, skill coverage, semantic concept matching, and optional local embeddings",
            "confidence": score_confidence(job_description, requirements, scored_job_skills),
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
        "priority_fixes": priority_fixes,
        "interview_prep": build_interview_prep(job_description, scored_job_skills),
    }


def score_confidence(job_description, requirements, job_skills):
    word_count = len(job_description.split())
    skill_count = len(job_skills)
    if word_count >= 80 and len(requirements) >= 4 and skill_count >= 3:
        return {
            "level": "high",
            "label": "High confidence",
            "detail": "Score is based on a detailed job description with multiple requirements and skills.",
        }
    if word_count >= 35 and len(requirements) >= 2:
        return {
            "level": "medium",
            "label": "Medium confidence",
            "detail": "Score is based on useful job text, but a full posting may change the result.",
        }
    return {
        "level": "low",
        "label": "Low confidence",
        "detail": "This job text looks short or generic. Paste the full posting before trusting the percentage.",
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
        skill_examples = ", ".join(missing_skills[:3])
        recommendations.append(
            {
                "title": "Add evidence for missing skills",
                "detail": (
                    f"Add one truthful bullet that shows where you used {skill_examples}. "
                    "Avoid only listing the skill; connect it to a project, decision, or result."
                ),
                "why": "CareerFit found the skills in the job posting, but not enough resume evidence to support them.",
                "example": (
                    f"Used {missing_skills[0]} to [build, improve, or debug something real], "
                    "resulting in [truthful outcome or measurable result]."
                ),
            }
        )

    if categories["missing"]:
        requirement = categories["missing"][0]["text"]
        recommendations.append(
            {
                "title": "Address missing job requirements",
                "detail": f"Add a targeted bullet for this requirement: {requirement}",
                "why": "This requirement has little or no supporting evidence in the uploaded resume.",
                "example": (
                    "Built or contributed to [project/system] involving "
                    f"{requirement.lower()}, using [tools] to achieve [result]."
                ),
            }
        )

    if categories["partial"] or categories["weak"]:
        requirement = (categories["weak"] or categories["partial"])[0]["text"]
        recommendations.append(
            {
                "title": "Make partial matches more explicit",
                "detail": f"Rewrite one existing bullet so it clearly maps to {target_role}: {requirement}",
                "why": "The resume has related words, but the evidence is not specific enough for a strong match.",
                "example": (
                    "Instead of a broad task description, write: "
                    "'Designed [specific feature/system] with [job keyword], improving [quality, speed, reliability, or user outcome].'"
                ),
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


def build_priority_fixes(categories, missing_skills, matched_skills, resume_text, ats_issues=None):
    fixes = []
    requirement_fixes = grouped_requirement_fixes(categories, resume_text)
    skill_fix = missing_skill_fix(missing_skills, matched_skills)
    ats_fixes = ats_priority_fixes(ats_issues or [])

    if skill_fix:
        fixes.append(skill_fix)
    fixes.extend(requirement_fixes)
    fixes.extend(ats_fixes)

    fixes = [fix for fix in fixes if is_actionable_fix(fix)]
    fixes.sort(key=lambda fix: (priority_rank(fix["priority"]), fix.get("sort_score", 100)))
    return [
        {key: value for key, value in fix.items() if key != "sort_score"}
        for fix in unique_priority_fixes(fixes)[:5]
    ]


def grouped_requirement_fixes(categories, resume_text):
    grouped = {}
    for category in ("missing", "weak", "partial"):
        for requirement in categories.get(category, []):
            if not is_requirement_candidate(requirement["text"]):
                continue
            key = requirement_group_key(requirement["text"])
            grouped.setdefault(key, []).append({**requirement, "category": category})

    fixes = []
    for requirements in grouped.values():
        representative = sorted(
            requirements,
            key=lambda item: (priority_rank(item.get("priority", "medium")), item.get("score", 0)),
        )[0]
        skill_names = sorted({skill for item in requirements for skill in extract_skills(item["text"])})
        status = requirement_status_label(representative)
        best_evidence = best_resume_evidence(representative, resume_text)
        job_signal = format_requirement_signal(requirements)
        title = requirement_fix_title(skill_names, representative["text"], status)
        fixes.append(
            {
                "id": f"requirement-{requirement_group_key(representative['text'])}",
                "type": "requirement",
                "title": title,
                "detail": requirement_fix_detail(status, job_signal),
                "priority": representative.get("priority", "medium"),
                "status": status,
                "score": representative.get("score", 0),
                "jobSignal": job_signal,
                "resumeSignal": best_evidence or requirement_evidence_signal(representative),
                "where": resume_section_for_requirement(representative["text"], skill_names),
                "evidenceNeeded": requirement_evidence_needed(representative["text"], skill_names, status),
                "checklist": requirement_fix_checklist(representative["text"], skill_names),
                "why": requirement_fix_why(status),
                "example": requirement_bullet_example(representative["text"], skill_names),
                "truthfulnessNote": "Use this only if it reflects work you actually did.",
                "requirements": [item["text"] for item in requirements[:4]],
                "skills": skill_names,
                "sort_score": representative.get("score", 0),
            }
        )
    return fixes


def missing_skill_fix(missing_skills, matched_skills):
    priority_skills = missing_skills[:5]
    if not priority_skills:
        return None
    primary_skill = priority_skills[0]
    return {
        "id": "skills-" + "-".join(priority_skills[:3]),
        "type": "skill",
        "title": "Add proof for missing job skills",
        "detail": f"The job mentions {format_list(priority_skills)}, but CareerFit could not find clear resume evidence for {primary_skill}.",
        "priority": "high",
        "status": "missing",
        "jobSignal": format_list(priority_skills),
        "resumeSignal": resume_skill_signal(matched_skills),
        "where": resume_section_for_requirement(primary_skill, priority_skills),
        "evidenceNeeded": f"One real example that uses {primary_skill}, names the project or system, and explains your result.",
        "checklist": skill_evidence_checklist(primary_skill),
        "why": "A missing skill should be added only as evidence in a real bullet, not as an unsupported keyword.",
        "example": skill_bullet_example(primary_skill),
        "truthfulnessNote": "Do not add a skill unless your resume can truthfully support it.",
        "skills": priority_skills,
        "sort_score": 0,
    }


def ats_priority_fixes(ats_issues):
    fixes = []
    for issue in ats_issues[:2]:
        fixes.append(
            {
                "id": f"ats-{normalize_text(issue).replace(' ', '-')}",
                "type": "ats",
                "title": f"Improve {issue.lower()}",
                "detail": f"Make your {issue.lower()} easy for recruiters and applicant tracking systems to detect.",
                "priority": "medium",
                "status": "ats",
                "jobSignal": "ATS structure check",
                "resumeSignal": f"CareerFit flagged {issue.lower()} as incomplete or hard to detect.",
                "where": resume_section_for_ats_issue(issue),
                "evidenceNeeded": ats_evidence_detail(issue),
                "checklist": ["Clear heading", "Plain text", "Consistent formatting"],
                "truthfulnessNote": "Keep formatting simple and avoid adding unsupported claims.",
                "sort_score": 40,
            }
        )
    return fixes


def requirement_group_key(requirement):
    skills = extract_skills(requirement)
    if skills:
        return "skills:" + "|".join(sorted(skills)[:3])
    concepts = extract_semantic_concepts(requirement)
    if concepts:
        return "concepts:" + "|".join(sorted(concepts)[:3])
    tokens = [token for token in tokenize(requirement) if token not in {"build", "develop", "design", "support", "manage"}]
    return "tokens:" + "|".join(tokens[:5])


def requirement_status_label(requirement):
    if requirement.get("match_label"):
        return "semantic_match"
    category = requirement.get("category")
    if category == "partial":
        return "partial"
    if category == "weak":
        return "weak"
    return "missing"


def best_resume_evidence(requirement, resume_text):
    if requirement.get("semantic_evidence"):
        return requirement["semantic_evidence"]
    if requirement.get("best_evidence"):
        return requirement["best_evidence"]
    ranked_segments = rank_resume_evidence(requirement["text"], resume_text)
    best_segment = ranked_segments[0] if ranked_segments else empty_evidence_rank()
    if best_segment["score"] >= 22:
        return best_segment["text"]
    if requirement.get("evidence"):
        return f"Related wording found: {format_list(requirement['evidence'][:5])}."
    return ""


def requirement_evidence_signal(requirement):
    if requirement.get("evidence"):
        return f"Related wording found: {format_list(requirement['evidence'][:5])}."
    return "No direct resume evidence detected for this requirement."


def format_requirement_signal(requirements):
    if len(requirements) == 1:
        return requirements[0]["text"]
    return " | ".join(item["text"] for item in requirements[:3])


def requirement_fix_title(skills, requirement, status):
    if skills:
        if status == "missing":
            return f"Add evidence for {skills[0]}"
        return f"Strengthen {skills[0]} evidence"
    if status == "missing":
        return "Address a missing requirement"
    return "Strengthen a weak requirement"


def requirement_fix_detail(status, job_signal):
    if status == "semantic_match":
        return "CareerFit found related resume evidence, but the wording can be clearer for recruiters and ATS tools."
    if status == "partial":
        return "CareerFit found partial evidence. Add context so this requirement is easier to verify."
    if status == "weak":
        return "CareerFit found related wording, but not enough concrete proof for a strong match."
    return f"The resume does not yet show clear evidence for this requirement: {shorten_text(job_signal, 150)}"


def requirement_evidence_needed(requirement, skills, status):
    primary = skills[0] if skills else "this requirement"
    if status == "semantic_match":
        return f"Make the existing evidence explicitly mention {primary} or the job wording, if truthful."
    if status in {"weak", "partial"}:
        return f"Add the project context, your specific action, and a result connected to {primary}."
    return f"One truthful bullet that maps your real work directly to {primary}."


def requirement_fix_why(status):
    if status == "semantic_match":
        return "Semantic matches are useful, but clearer job wording helps both recruiters and automated scans understand the connection."
    if status in {"weak", "partial"}:
        return "Weak matches often happen when the resume names a related tool or task but does not prove depth or impact."
    return "A missing requirement means CareerFit could not connect the job ask to resume evidence."


def requirement_fix_checklist(requirement, skills):
    text = requirement.lower()
    if re.search(r"test|quality|qa|sdlc", text):
        return ["Testing type", "Feature or API", "Tool or method", "Result"]
    if re.search(r"api|backend|service|endpoint", text):
        return ["API or service", "Integration or endpoint", "Your action", "Result"]
    if skills:
        return ["Skill used", "Project context", "Your action", "Result"]
    return ["Requirement keyword", "Concrete project", "Your action", "Outcome"]


def requirement_bullet_example(requirement, skills):
    text = requirement.lower()
    if re.search(r"test|quality|qa|sdlc", text):
        return "Applied [testing method] to validate [feature/system], covering [edge case] and improving [release quality, reliability, or defect detection]."
    if re.search(r"api|backend|service|endpoint", text):
        return "Built [REST API/backend service] for [use case], integrating [system/tool] and improving [latency, reliability, automation, or workflow]."
    if re.search(r"full.?stack|react|next|typescript", text):
        return "Delivered [full-stack feature] using [frontend/backend tools], connecting [data/API] to [user workflow] and improving [specific outcome]."
    if skills:
        return f"Used {skills[0]} to [build, improve, or troubleshoot a real project], resulting in [truthful outcome or measurable result]."
    return f"Built or improved [specific project/system] related to \"{shorten_text(requirement, 80)}\", using [tools/method] to achieve [truthful result]."


def resume_section_for_requirement(requirement, skills):
    text = " ".join([requirement, " ".join(skills)]).lower()
    if re.search(r"summary|target role", text):
        return "Professional Summary"
    if re.search(r"education|degree|certification|credential", text):
        return "Education or Certifications"
    if re.search(r"project|portfolio|academic", text):
        return "Projects"
    return "Experience or Projects"


def resume_skill_signal(matched_skills):
    if not matched_skills:
        return "No strong skill evidence detected yet."
    return f"CareerFit currently detects {format_list(matched_skills[:4])}, but not this missing skill evidence."


def skill_evidence_checklist(skill):
    if re.search(r"test|qa|quality", skill, flags=re.IGNORECASE):
        return ["Testing type", "Feature or API", "Tool or method", "Defect/result"]
    if re.search(r"sql|postgres|database|mongodb|redis|supabase", skill, flags=re.IGNORECASE):
        return ["Dataset or table", "Query/design choice", "Business result", "Scale"]
    if re.search(r"react|next|typescript|javascript|node|express", skill, flags=re.IGNORECASE):
        return ["Feature built", "Framework/tool", "User impact", "Deployment/result"]
    return ["Skill used", "Project context", "Your action", "Result"]


def skill_bullet_example(skill):
    if re.search(r"test|qa|quality", skill, flags=re.IGNORECASE):
        return "Tested [feature/API/workflow] using [unit, integration, functional, performance, or chaos testing], improving [release confidence, defects found, or reliability]."
    if re.search(r"sql|postgres|database|mongodb|redis|supabase", skill, flags=re.IGNORECASE):
        return f"Used {skill} to [model, query, or optimize] [dataset/system], improving [reporting speed, data quality, reliability, or decision-making]."
    if re.search(r"react|next|typescript|javascript|node|express", skill, flags=re.IGNORECASE):
        return f"Built [feature or workflow] with {skill}, improving [user task, performance, maintainability, or delivery speed]."
    return f"Used {skill} to [describe a real feature, tool, or project], resulting in [truthful outcome or measurable result]."


def resume_section_for_ats_issue(issue):
    if re.search(r"summary", issue, flags=re.IGNORECASE):
        return "Professional Summary"
    if re.search(r"education", issue, flags=re.IGNORECASE):
        return "Education"
    if re.search(r"experience|dates|bullet|measurable", issue, flags=re.IGNORECASE):
        return "Experience"
    if re.search(r"skill", issue, flags=re.IGNORECASE):
        return "Skills"
    return "Header or relevant resume section"


def ats_evidence_detail(issue):
    if re.search(r"summary", issue, flags=re.IGNORECASE):
        return "A 2-3 line summary with target-role language and one truthful strength."
    if re.search(r"bullet", issue, flags=re.IGNORECASE):
        return "Short bullets that start with action verbs and describe outcomes."
    if re.search(r"measurable", issue, flags=re.IGNORECASE):
        return "A truthful number, scale, frequency, or observable result."
    return f"A clearly labeled {issue.lower()} section or detail."


def is_actionable_fix(fix):
    text = normalize_text(" ".join(str(fix.get(field, "")) for field in ("title", "detail", "jobSignal", "example")))
    return not is_non_resume_requirement(text)


def unique_priority_fixes(fixes):
    seen = set()
    unique = []
    for fix in fixes:
        key = normalize_text(f"{fix.get('type')} {fix.get('title')} {fix.get('jobSignal')}")
        if key in seen:
            continue
        seen.add(key)
        unique.append(fix)
    return unique


def priority_rank(priority):
    return {"high": 0, "medium": 1, "low": 2}.get(priority, 1)


def format_list(items):
    items = [str(item) for item in items if item]
    if len(items) <= 1:
        return items[0] if items else ""
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return f"{', '.join(items[:-1])}, and {items[-1]}"


def shorten_text(text, max_length):
    return f"{text[: max_length - 3].rstrip()}..." if len(text) > max_length else text
