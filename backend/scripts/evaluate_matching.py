import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.matching.services import analyze_resume_match, extract_skills


CASES = [
    {
        "resume": "Python SQL Tableau dashboards and communication",
        "job": "Required Python SQL Tableau AWS communication",
        "expected_matched": {"python", "sql", "tableau", "communication"},
    },
    {
        "resume": "React JavaScript REST API Git teamwork",
        "job": "JavaScript React REST Docker Git collaboration",
        "expected_matched": {"javascript", "react", "rest", "git", "teamwork"},
    },
    {
        "resume": "Data analytics projects using Python pandas Excel PowerBI and SQL",
        "job": "Business intelligence analyst with SQL Power BI Excel and data analysis",
        "expected_matched": {"sql", "power bi", "excel", "data analysis"},
    },
    {
        "resume": "Built Django RESTful APIs backed by PostgreSQL and Docker",
        "job": "Python Django REST API PostgreSQL Docker AWS",
        "expected_matched": {"django", "rest", "postgresql", "docker"},
    },
    {
        "resume": "Machine learning coursework in NLP and Python with pandas",
        "job": "ML engineer using Python machine learning natural language processing and AWS",
        "expected_matched": {"python", "machine learning", "nlp"},
    },
    {
        "resume": "Accessibility testing for React JavaScript interfaces",
        "job": "Frontend engineer: JavaScript React accessibility testing and Git",
        "expected_matched": {"javascript", "react", "accessibility", "testing"},
    },
    {
        "resume": "Tableau data visualization dashboards and stakeholder communication",
        "job": "Create Tableau reporting with data visualization and communication",
        "expected_matched": {"tableau", "data visualization", "communication"},
    },
    {
        "resume": "Azure deployment work with Docker and teamwork",
        "job": "Cloud engineer with Azure Docker AWS and collaboration",
        "expected_matched": {"azure", "docker", "teamwork"},
    },
    {
        "resume": "Java backend services with MySQL and Git",
        "job": "Java MySQL API development using Git",
        "expected_matched": {"java", "mysql", "git"},
    },
    {
        "resume": "Looker dashboards, business intelligence reporting, and leadership",
        "job": "Analytics lead with Looker BI leadership and communication",
        "expected_matched": {"looker", "business intelligence", "leadership"},
    },
]

SCORE_CASES = [
    {
        "label": "strong",
        "resume": "Data analyst with Python SQL Tableau communication. Built Tableau dashboards and improved reporting.",
    },
    {
        "label": "partial",
        "resume": "Data analyst with Python SQL. Built reporting scripts.",
    },
    {
        "label": "unrelated",
        "resume": "Retail associate with teamwork. Helped customers and managed inventory.",
    },
]

SCORE_JOB = (
    "We need a data analyst. Required: Python, SQL, Tableau, and communication. "
    "Build dashboards and improve reporting."
)


def evaluate():
    true_positive = false_positive = false_negative = 0
    for case in CASES:
        predicted = set(extract_skills(case["resume"])) & set(extract_skills(case["job"]))
        expected = case["expected_matched"]
        true_positive += len(predicted & expected)
        false_positive += len(predicted - expected)
        false_negative += len(expected - predicted)

    precision = true_positive / max(true_positive + false_positive, 1)
    recall = true_positive / max(true_positive + false_negative, 1)
    f1_score = 2 * precision * recall / max(precision + recall, 1)
    print(f"precision={precision:.3f}")
    print(f"recall={recall:.3f}")
    print(f"f1={f1_score:.3f}")
    print(f"cases={len(CASES)}")
    scores = [
        analyze_resume_match({"target_role": "Data Analyst"}, case["resume"], SCORE_JOB)["summary"]["match_score"]
        for case in SCORE_CASES
    ]
    ordering_correct = scores == sorted(scores, reverse=True)
    print("score_ordering=" + ",".join(f"{case['label']}:{score}" for case, score in zip(SCORE_CASES, scores)))
    print(f"score_ordering_correct={ordering_correct}")


if __name__ == "__main__":
    evaluate()
