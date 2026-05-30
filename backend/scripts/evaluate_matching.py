from apps.matching.services import extract_skills


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
]


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


if __name__ == "__main__":
    evaluate()
