import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReportScreen from "./ReportScreen.jsx";


const report = {
  summary: {
    candidate_name: "Student User",
    target_role: "Data Analyst",
    match_score: 62,
    readiness_score: 56,
    requirements_reviewed: 3,
  },
  skills: {
    matched: ["python", "sql"],
    missing: ["tableau"],
  },
  ats: {
    score: 77,
    issues: ["Summary section"],
    checks: [
      { id: "email", label: "Email address", passed: true },
      { id: "summary", label: "Summary section", passed: false },
    ],
  },
  requirements: {
    matched: [{ text: "Use Python for reporting", score: 82, evidence: ["python"] }],
    partial: [],
    weak: [],
    missing: [{ text: "Build Tableau dashboards", score: 0, evidence: [] }],
  },
  recommendations: [
    { title: "Add evidence for missing skills", detail: "Add a truthful Tableau example." },
  ],
  interview_prep: {
    questions: [{ question: "Tell me about a dashboard.", hint: "Use a real example." }],
    star_prompts: [{ label: "Situation", detail: "Set the context." }],
  },
  ai_coaching: {
    status: "skipped",
    detail: "AI coaching was not requested.",
    recommendations: [],
  },
};


describe("ReportScreen", () => {
  it("leads with scores, priorities, and optional specific improvements", () => {
    const onRequestAiCoaching = vi.fn();
    render(
      <ReportScreen
        report={report}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
        onRequestAiCoaching={onRequestAiCoaching}
      />,
    );

    expect(screen.getByText("Your application at a glance")).toBeVisible();
    expect(screen.getByText("Improve these first")).toBeVisible();
    expect(screen.getByText("Skills for this job")).toBeVisible();
    expect(screen.getByText("Want more specific improvements?")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Get specific improvements" }));
    expect(onRequestAiCoaching).toHaveBeenCalledOnce();
  });

  it("shows completed specific improvements when coaching is available", () => {
    render(
      <ReportScreen
        report={{
          ...report,
          ai_coaching: {
            status: "completed",
            headline: "Make your results easier to scan",
            summary: "Start with the missing dashboard evidence.",
            recommendations: [{ priority: "high", title: "Add a Tableau bullet", detail: "Describe a real Tableau dashboard result." }],
          },
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
      />,
    );

    expect(screen.getByText("Specific improvements")).toBeVisible();
    expect(screen.getByText("Add a Tableau bullet")).toBeVisible();
  });
});
