import { fireEvent, render, screen, within } from "@testing-library/react";
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
    matched: [
      { text: "Use Python for reporting", score: 82, evidence: ["python"] },
      {
        text: "Experience with REST API development",
        score: 82,
        evidence: [],
        match_label: "Semantic match",
        semantic_evidence: "Built backend endpoints and integrated third-party services",
        semantic_explanation: "Different wording, related technical meaning",
      },
    ],
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
    expect(screen.getAllByText("Job asks for")[0]).toBeVisible();
    expect(screen.getAllByText("Resume shows")[0]).toBeVisible();
    expect(screen.getAllByText("Add this proof")[0]).toBeVisible();
    expect(screen.getAllByText("Best place")[0]).toBeVisible();
    expect(screen.getAllByText("A strong fix includes")[0]).toBeVisible();
    expect(screen.getByText("Experience or Projects")).toBeVisible();
    expect(screen.getByText("Skill used")).toBeVisible();
    expect(screen.getAllByText("Suggested resume bullet")[0]).toBeVisible();
    expect(screen.getByText("Skills for this job")).toBeVisible();
    expect(screen.getByText("How CareerFit calculates the score")).toBeVisible();
    expect(screen.getByText("Readiness improvement history")).toBeVisible();
    expect(screen.getByText("65% of job match")).toBeVisible();
    expect(screen.getByText("optional")).toBeVisible();
    expect(screen.getByText("Want more specific improvements?")).toBeVisible();
    expect(screen.getByText("Resume draft workspace")).toBeVisible();
    expect(screen.getAllByText("Additional tools")[0]).toBeVisible();
    expect(screen.getByText("Open these only when you need the extra detail")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Report sections" })).toBeVisible();

    const resumeDraft = screen.getByRole("button", { name: "Resume draft" });
    const scrollIntoView = vi.fn();
    document.getElementById("resume-draft").scrollIntoView = scrollIntoView;
    fireEvent.click(resumeDraft);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });

    fireEvent.click(screen.getByLabelText("Mark priority 1: Add evidence for missing skills complete"));
    expect(screen.getByText(/1 of \d+ complete/)).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Get specific improvements" }));
    expect(onRequestAiCoaching).toHaveBeenCalledOnce();

    expect(screen.getByText("Semantic match")).toBeVisible();
    expect(screen.getByText("Built backend endpoints and integrated third-party services")).toBeVisible();
    expect(screen.getByText("Different wording, related technical meaning")).toBeVisible();
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
            recommendations: [{
              priority: "high",
              title: "Add a Tableau bullet",
              detail: "Describe a real Tableau dashboard result.",
              job_requirement: "Build Tableau dashboards",
              resume_evidence: "Python SQL dashboard experience",
              where_to_add: "Projects",
              what_to_add: "Add one truthful dashboard project and result.",
              bullet_template: "Built [dashboard] for [audience], improving [decision or workflow].",
              truthfulness_note: "Use only if this reflects your real experience.",
            }],
          },
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
      />,
    );

    expect(screen.getByText("Specific improvements")).toBeVisible();
    expect(screen.getByText("Add a Tableau bullet")).toBeVisible();
    expect(screen.getByText("Where to add")).toBeVisible();
    expect(screen.getAllByText("Projects")[0]).toBeVisible();
    expect(screen.getByText("Built [dashboard] for [audience], improving [decision or workflow].")).toBeVisible();

    fireEvent.click(screen.getByTitle("Accept Add a Tableau bullet"));
    expect(screen.getByText("Added to your tailoring checklist")).toBeVisible();
    fireEvent.click(screen.getByTitle("Edit Add a Tableau bullet"));
    fireEvent.change(screen.getByDisplayValue("Describe a real Tableau dashboard result."), { target: { value: "Add the measurable dashboard result." } });
    expect(screen.getByDisplayValue("Add the measurable dashboard result.")).toBeVisible();
    fireEvent.click(screen.getByTitle("Dismiss Add a Tableau bullet"));
    expect(screen.queryByText("Add a Tableau bullet")).not.toBeInTheDocument();
  });

  it("does not turn hiring boilerplate into resume improvement actions", () => {
    render(
      <ReportScreen
        report={{
          ...report,
          skills: { matched: ["typescript"], missing: [] },
          requirements: {
            matched: [],
            partial: [],
            weak: [],
            missing: [
              {
                text: "If you have questions regarding our hiring practices, please contact [email protected]. We may use artificial intelligence tools to support parts of the hiring process.",
                score: 0,
                evidence: ["artificial", "intelligence", "tool"],
              },
              {
                text: "Build customer-facing features with TypeScript.",
                score: 0,
                evidence: [],
              },
            ],
          },
          recommendations: [
            {
              title: "Address missing job requirements",
              detail: "Add a targeted bullet for this requirement: If you have questions regarding our hiring practices, please contact [email protected].",
            },
          ],
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
        onRequestAiCoaching={() => {}}
      />,
    );

    const prioritySection = within(document.getElementById("priority-improvements"));
    expect(prioritySection.getAllByText(/Build customer-facing features with TypeScript/)[0]).toBeVisible();
    expect(prioritySection.queryByText(/hiring practices, please contact/)).not.toBeInTheDocument();
  });

  it("uses backend priority fixes when available", () => {
    render(
      <ReportScreen
        report={{
          ...report,
          priority_fixes: [
            {
              title: "Strengthen REST API evidence",
              detail: "CareerFit found related evidence, but the wording can be clearer.",
              priority: "high",
              jobSignal: "Experience with REST API development",
              resumeSignal: "Built backend endpoints and integrated third-party services",
              where: "Projects",
              evidenceNeeded: "Mention REST API design or integration if truthful.",
              checklist: ["API or service", "Your action", "Result"],
              example: "Built REST API endpoints for [feature], integrating [service] and improving [result].",
              truthfulnessNote: "Use this only if it reflects work you actually did.",
            },
          ],
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
        onRequestAiCoaching={() => {}}
      />,
    );

    expect(screen.getByText("Strengthen REST API evidence")).toBeVisible();
    expect(screen.getAllByText("Experience with REST API development")[0]).toBeVisible();
    expect(screen.getAllByText("Built backend endpoints and integrated third-party services")[0]).toBeVisible();
    expect(screen.getByText("Mention REST API design or integration if truthful.")).toBeVisible();
    expect(screen.getByText("Use this only if it reflects work you actually did.")).toBeVisible();
    expect(screen.queryByText("Add evidence for missing skills")).not.toBeInTheDocument();
  });

  it("builds a professional resume tailoring workspace from the uploaded resume", () => {
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

    fireEvent.click(screen.getByText("Resume draft workspace"));
    expect(screen.getByText("Resume tailoring workspace")).toBeVisible();
    expect(screen.getByText("Create a tailored resume version")).toBeVisible();
    expect(screen.getByText("Resume preview")).toBeVisible();
    expect(screen.getByText("Truthfulness check")).toBeVisible();

    const summaryEditor = screen.getByLabelText("Edit Professional summary");
    expect(summaryEditor.value).toContain("Data analyst with reporting experience.");

    fireEvent.click(screen.getByRole("button", { name: "Edit Experience section" }));
    const experienceEditor = screen.getByLabelText("Edit Experience");
    expect(experienceEditor.value).toContain("- Built a dashboard for a student project.");

    fireEvent.click(screen.getByRole("button", { name: "Edit Education section" }));
    const educationEditor = screen.getByLabelText("Edit Education");
    expect(educationEditor.value).toContain("Example University");

    fireEvent.click(screen.getByRole("button", { name: "Use this resume version" }));
    expect(onUseResumeTemplate).toHaveBeenCalledWith(expect.stringContaining("EDUCATION\nExample University"));
  });
});
