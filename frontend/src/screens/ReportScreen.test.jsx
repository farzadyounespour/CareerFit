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
  it("leads with scores, priorities, and AI retry controls", () => {
    const onRequestAiCoaching = vi.fn();
    const onAddToTracker = vi.fn();
    render(
      <ReportScreen
        report={report}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
        onRequestAiCoaching={onRequestAiCoaching}
        onAddToTracker={onAddToTracker}
      />,
    );

    expect(screen.getByText("Your application at a glance")).toBeVisible();
    expect(screen.getByText("Improve these first")).toBeVisible();
    expect(screen.getAllByText("Job asks for")[0]).toBeVisible();
    expect(screen.getAllByText("Resume shows")[0]).toBeVisible();
    expect(screen.getAllByText("Add this proof")[0]).toBeVisible();
    expect(screen.getAllByText("Best place")[0]).toBeVisible();
    expect(screen.getAllByText("A strong fix includes")[0]).toBeVisible();
    expect(screen.getAllByText("Experience or Projects")[0]).toBeVisible();
    expect(screen.getByText("Skill used")).toBeVisible();
    expect(screen.getAllByText("Suggested resume bullet")[0]).toBeVisible();
    expect(screen.getByText("Resume wording suggestions")).toBeVisible();
    expect(screen.getByText("Text to adapt for each problem")).toBeVisible();
    expect(screen.getAllByText("CareerFit starter")[0]).toBeVisible();
    expect(screen.getByText("Skills for this job")).toBeVisible();
    expect(screen.getByText("How CareerFit calculates the score")).toBeVisible();
    expect(screen.queryByText("Readiness improvement history")).not.toBeInTheDocument();
    expect(screen.getByText("65% of job match")).toBeVisible();
    expect(screen.getByText("optional")).toBeVisible();
    expect(screen.queryByText("Resume draft workspace")).not.toBeInTheDocument();
    expect(screen.queryByText("Specific improvements")).not.toBeInTheDocument();
    expect(screen.getAllByText("Additional tools")[0]).toBeVisible();
    expect(screen.getByText("Open these only when you need the extra detail")).toBeVisible();
    expect(screen.getByRole("navigation", { name: "Report sections" })).toBeVisible();
    expect(screen.getByRole("button", { name: /Wording suggestions/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Update resume" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add to tracker" }));
    expect(onAddToTracker).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Retry guidance" }));
    expect(onRequestAiCoaching).toHaveBeenCalledOnce();

    expect(screen.queryByRole("button", { name: "Resume draft" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Mark priority 1: Add evidence for missing skills complete"));
    expect(screen.getByText(/1 of \d+ complete/)).toBeVisible();

    expect(screen.getByText("Semantic match")).toBeVisible();
    expect(screen.getByText("Built backend endpoints and integrated third-party services")).toBeVisible();
    expect(screen.getByText("Different wording, related technical meaning")).toBeVisible();
  });

  it("uses requirement-specific proof guidance for missing requirements", () => {
    render(
      <ReportScreen
        report={{
          ...report,
          skills: {
            matched: ["python"],
            missing: [],
            missing_details: [],
          },
          requirements: {
            matched: [],
            partial: [],
            weak: [{
              text: "Validate software development lifecycle quality with functional and performance testing.",
              score: 25,
              evidence: ["testing"],
              priority: "medium",
            }],
            missing: [{
              text: "Design REST API endpoints and integrate external systems.",
              score: 0,
              evidence: [],
              priority: "high",
            }],
          },
          recommendations: [],
          priority_fixes: [],
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
        onRequestAiCoaching={() => {}}
        history={[]}
      />,
    );

    expect(screen.getByText(/API\/service name/)).toBeVisible();
    expect(screen.getByText(/integration or endpoint/)).toBeVisible();
    expect(screen.getAllByText(/test type/)[0]).toBeVisible();
    expect(screen.getByText(/release-quality result/)).toBeVisible();
  });

  it("adds completed AI guidance to the priority checklist when coaching is available", () => {
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
            report_sections: [{
              title: "Dashboard gap",
              summary: "The job asks for dashboard proof, and the resume needs a clearer example.",
              evidence: "Python SQL dashboard experience",
              next_step: "Add one truthful dashboard result.",
            }],
            skill_insights: [{
              skill: "tableau",
              status: "missing",
              detail: "The job mentions Tableau, but the resume does not prove Tableau work.",
              evidence: "No related resume evidence detected.",
              next_step: "Add Tableau only if you have a real project.",
            }],
          },
        }}
        resumeText="Resume text"
        jobDescription="Job description text"
        onNavigate={() => {}}
      />,
    );

    expect(screen.queryByText("Specific improvements")).not.toBeInTheDocument();
    expect(within(document.getElementById("priority-improvements")).getByText("Add a Tableau bullet")).toBeVisible();
    expect(within(document.getElementById("priority-improvements")).getAllByText("Add a Tableau bullet")).toHaveLength(1);
    expect(screen.getByText("Tailored report highlights")).toBeVisible();
    expect(screen.getByText("Dashboard gap")).toBeVisible();
    expect(screen.getByText("Add one truthful dashboard result.")).toBeVisible();
    expect(screen.getByText("Ollama guidance ready")).toBeVisible();
    expect(screen.queryByText("AI suggested")).not.toBeInTheDocument();
    expect(screen.getByText("The job mentions Tableau, but the resume does not prove Tableau work.")).toBeVisible();
    expect(screen.getAllByText("Best place")[0]).toBeVisible();
    expect(screen.getAllByText("Projects")[0]).toBeVisible();
    const prioritySection = within(document.getElementById("priority-improvements"));
    expect(prioritySection.getByText("Before / after resume wording")).toBeVisible();
    expect(prioritySection.getByText("Before")).toBeVisible();
    expect(prioritySection.getByText("Stronger wording")).toBeVisible();
    expect(prioritySection.getByText("Python SQL dashboard experience")).toBeVisible();
    const wordingSection = within(document.getElementById("wording-suggestions"));
    expect(wordingSection.getByText("Add a Tableau bullet")).toBeVisible();
    expect(wordingSection.getByText("Generated guidance")).toBeVisible();
    expect(wordingSection.getByText("Built [dashboard] for [audience], improving [decision or workflow].")).toBeVisible();
    expect(screen.getAllByText("Built [dashboard] for [audience], improving [decision or workflow].")[0]).toBeVisible();
  });

  it("backfills empty AI job and resume evidence fields from requirement analysis", () => {
    render(
      <ReportScreen
        report={{
          ...report,
          skills: {
            matched: ["aws"],
            missing: [],
            missing_details: [],
          },
          requirements: {
            matched: [],
            partial: [{
              text: "AWS hands-on ownership - has provisioned, deployed, monitored, and debugged AWS infrastructure.",
              score: 48,
              priority: "high",
              evidence: ["AWS", "ECS"],
              best_evidence: "Software Engineer: deployed Kafka on AWS ECS and monitored service health.",
            }],
            weak: [],
            missing: [],
          },
          priority_fixes: [],
          ai_coaching: {
            status: "completed",
            headline: "Strengthen cloud proof",
            summary: "Expand the AWS evidence.",
            recommendations: [{
              priority: "high",
              title: "Strengthen AWS evidence",
              detail: "Expand your specific contributions to align with the job posting's requirement for 'AWS hands-on ownership'.",
              job_requirement: "",
              resume_evidence: "",
              where_to_add: "Experience or Projects",
              what_to_add: "Detail the AWS services you used and the actions you took.",
              bullet_template: "",
              truthfulness_note: "Use only if this reflects your real experience.",
            }],
          },
        }}
        resumeText="Software Engineer: deployed Kafka on AWS ECS and monitored service health."
        jobDescription="AWS hands-on ownership - has provisioned, deployed, monitored, and debugged AWS infrastructure."
        onNavigate={() => {}}
      />,
    );

    const prioritySection = within(document.getElementById("priority-improvements"));
    expect(prioritySection.getByText("AWS hands-on ownership - has provisioned, deployed, monitored, and debugged AWS infrastructure.")).toBeVisible();
    expect(prioritySection.getByText("Software Engineer: deployed Kafka on AWS ECS and monitored service health.")).toBeVisible();
    expect(prioritySection.getByText("Before / after resume wording")).toBeVisible();
    expect(prioritySection.getByText("Before")).toBeVisible();
    expect(prioritySection.getByText("Stronger wording")).toBeVisible();
    expect(prioritySection.getByText("Provisioned or improved [cloud service/infrastructure] for [project/system], using [AWS service/tool] to improve [reliability, deployment speed, monitoring, or cost].")).toBeVisible();
    expect(screen.queryByText("Specific improvements")).not.toBeInTheDocument();
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

    expect(screen.getAllByText("Strengthen REST API evidence")[0]).toBeVisible();
    expect(screen.getAllByText("Experience with REST API development")[0]).toBeVisible();
    expect(screen.getAllByText("Built backend endpoints and integrated third-party services")[0]).toBeVisible();
    expect(screen.getByText("Mention REST API design or integration if truthful.")).toBeVisible();
    expect(screen.getAllByText("Built [backend service/API endpoint] for [use case], integrating [system/tool] and improving [latency, reliability, automation, or user workflow].")[0]).toBeVisible();
    expect(screen.getAllByText("Use this only if it reflects work you actually did.")[0]).toBeVisible();
    expect(screen.queryByText("Add evidence for missing skills")).not.toBeInTheDocument();
  });

});
