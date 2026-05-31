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
    score_breakdown: {
      requirement_evidence: { score: 58, weight: 65 },
      skill_coverage: { score: 67, weight: 35 },
      ats_preparation: { score: 77, weight: 20 },
      job_match_weight: 80,
    },
  },
  skills: {
    matched: ["python", "sql"],
    missing: ["tableau", "nlp"],
    missing_details: [
      { name: "tableau", priority: "high" },
      { name: "nlp", priority: "low" },
    ],
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
        history={[
          { id: 2, target_role: "Data Analyst", summary: { readiness_score: 56 } },
          { id: 1, target_role: "Data Analyst", summary: { readiness_score: 48 } },
        ]}
      />,
    );

    expect(screen.getByText("Your application at a glance")).toBeVisible();
    expect(screen.getByText("Improve these first")).toBeVisible();
    expect(screen.getByText("Skills for this job")).toBeVisible();
    expect(screen.getByText("How CareerFit calculates the score")).toBeVisible();
    expect(screen.getByText("Readiness improvement history")).toBeVisible();
    expect(screen.getByText("65% of job match")).toBeVisible();
    expect(screen.getByText("optional")).toBeVisible();
    expect(screen.getByText("Want more specific improvements?")).toBeVisible();
    expect(screen.getByText("Resume section examples")).toBeVisible();
    expect(screen.getByText("Professional summary header")).toBeVisible();
    expect(screen.getByText("Experience bullet example")).toBeVisible();
    expect(screen.getByText("Optional certifications header")).toBeVisible();
    expect(screen.getByText(/Data Analyst with experience using python, sql/)).toBeVisible();

    fireEvent.click(screen.getByLabelText("Mark priority 1: Add evidence for missing skills complete"));
    expect(screen.getByText(/1 of \d+ complete/)).toBeVisible();

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

    fireEvent.click(screen.getByTitle("Accept Add a Tableau bullet"));
    expect(screen.getByText("Added to your tailoring checklist")).toBeVisible();
    fireEvent.click(screen.getByTitle("Edit Add a Tableau bullet"));
    fireEvent.change(screen.getByDisplayValue("Describe a real Tableau dashboard result."), { target: { value: "Add the measurable dashboard result." } });
    expect(screen.getByDisplayValue("Add the measurable dashboard result.")).toBeVisible();
    fireEvent.click(screen.getByTitle("Dismiss Add a Tableau bullet"));
    expect(screen.queryByText("Add a Tableau bullet")).not.toBeInTheDocument();
  });

  it("builds an editable ATS-friendly draft from the uploaded resume", () => {
    const onUseResumeTemplate = vi.fn();
    render(
      <ReportScreen
        report={report}
        resumeText={`Student User
student@example.com | +1 514 555 1212 | Montreal

Summary
Data analyst with reporting experience.

Skills
Python, SQL

Experience
- Built a dashboard for a student project.

Education
Example University`}
        jobDescription="Job description text"
        onNavigate={() => {}}
        onUseResumeTemplate={onUseResumeTemplate}
      />,
    );

    const draft = screen.getByLabelText("ATS-friendly resume draft");
    expect(draft.value).toContain("PROFESSIONAL SUMMARY\nData analyst with reporting experience.");
    expect(draft.value).toContain("EXPERIENCE\n- Built a dashboard for a student project.");
    expect(draft.value).toContain("CERTIFICATIONS\n[Add relevant certifications only if applicable.");

    fireEvent.click(screen.getByRole("button", { name: "Open in resume workspace" }));
    expect(onUseResumeTemplate).toHaveBeenCalledWith(expect.stringContaining("EDUCATION\nExample University"));
  });
});
