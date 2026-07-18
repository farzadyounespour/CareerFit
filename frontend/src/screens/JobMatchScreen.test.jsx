import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import JobMatchScreen, { getMatchGuidance } from "./JobMatchScreen.jsx";


describe("JobMatchScreen", () => {
  it("explains how to act on a low resume match", () => {
    expect(getMatchGuidance(8)).toMatchObject({
      title: "Low alignment with this resume",
      detail: expect.stringContaining("add only skills and examples you genuinely have"),
    });
  });

  it("shows the current and total number of result pages", () => {
    const onImportJobUrl = vi.fn().mockResolvedValue({});
    render(
      <JobMatchScreen
        jobDescription=""
        onChange={() => {}}
        onLoadSample={() => {}}
        jobSearch={{
          title: "Data Analyst",
          location: "",
          country: "ca",
          source: "all",
          workplace: "any",
          skills: "",
          experience_level: "any",
          employment_type: "any",
          salary_min: "",
          salary_max: "",
          page: 2,
        }}
        onJobSearchChange={() => {}}
        jobResults={[{
          id: "job-1",
          title: "Data Analyst",
          company: "Example Co",
          location: "Montreal",
          description: "Build dashboards.",
          source: "Adzuna",
          match_scope: "related",
          search_note: "Related result for Junior Data Analyst; matched broader role Data Analyst.",
        }]}
        roleInsights={{
          postings_analyzed: 3,
          partial_postings: 1,
          common_skills: [{ name: "python", count: 2, percentage: 67 }],
          related_titles: ["Business Intelligence Analyst"],
        }}
        onJobSearch={() => {}}
        onSelectJob={() => {}}
        onImportJobUrl={onImportJobUrl}
        isSearchingJobs={false}
        jobSearchError=""
        jobSearchNotice=""
        onSaveJob={() => {}}
        onCreateSearchAlert={() => {}}
        onPageChange={() => {}}
        pagination={{ page: 2, count: 24, total_pages: 3, has_previous: true, has_next: true }}
        selectedJob={null}
        onAnalyze={() => {}}
        isLoading={false}
        error=""
        useAiCoaching={false}
        onAiCoachingChange={() => {}}
      />,
    );

    expect(screen.getByText("Page 2 of 3")).toBeVisible();
    expect(screen.getByText("Role insights from 3 retrieved postings")).toBeVisible();
    expect(screen.getByText("python · 2/3")).toBeVisible();
    expect(screen.getByText("1 provider excerpt")).toBeVisible();
    expect(screen.getByRole("button", { name: "Business Intelligence Analyst" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Sample demo" })).not.toBeInTheDocument();
    expect(screen.getByText("Related")).toBeVisible();

    fireEvent.change(screen.getByPlaceholderText("https://company.example/jobs/data-analyst"), { target: { value: "https://example.com/jobs/analyst" } });
    fireEvent.click(screen.getByRole("button", { name: "Import URL" }));
    return waitFor(() => expect(onImportJobUrl).toHaveBeenCalledWith("https://example.com/jobs/analyst"));
  });

  it("compares selected jobs side by side and clears the comparison", () => {
    render(
      <JobMatchScreen
        jobDescription=""
        onChange={() => {}}
        onLoadSample={() => {}}
        jobSearch={{
          title: "Data Analyst",
          location: "",
          country: "ca",
          source: "all",
          workplace: "any",
          skills: "",
          excluded_keywords: "",
          experience_level: "any",
          employment_type: "any",
          salary_min: "",
          salary_max: "",
          page: 1,
        }}
        onJobSearchChange={() => {}}
        jobResults={[
          { id: "job-1", title: "Data Analyst", company: "Example Co", location: "Montreal", description: "Build dashboards.", source: "Adzuna", posted_at: "2026-05-30T14:00:00Z" },
          { id: "job-2", title: "Reporting Analyst", company: "Sample Co", location: "Toronto", description: "Prepare reports.", source: "Sample" },
        ]}
        onJobSearch={() => {}}
        onSelectJob={() => {}}
        isSearchingJobs={false}
        jobSearchError=""
        jobSearchNotice=""
        onSaveJob={() => {}}
        onCreateSearchAlert={() => {}}
        onPageChange={() => {}}
        pagination={{ page: 1, count: 2, total_pages: 1, has_previous: false, has_next: false }}
        selectedJob={null}
        onAnalyze={() => {}}
        isLoading={false}
        error=""
        useAiCoaching={false}
        onAiCoachingChange={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add Data Analyst to comparison" }));
    fireEvent.click(screen.getByRole("button", { name: "Add Reporting Analyst to comparison" }));
    expect(screen.getByText("Compare jobs side by side")).toBeVisible();
    expect(screen.getAllByText("Example Co")).toHaveLength(2);
    expect(screen.getByText("Date not listed")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear comparison" }));
    expect(screen.queryByText("Compare jobs side by side")).not.toBeInTheDocument();
  });

  it("shows a quick resume comparison for the selected job", () => {
    const onSaveJob = vi.fn();
    const onOpenTracker = vi.fn();
    render(
      <JobMatchScreen
        jobDescription="Build dashboards with Python and Tableau."
        onChange={() => {}}
        onLoadSample={() => {}}
        jobSearch={{
          title: "Data Analyst",
          location: "",
          country: "ca",
          source: "all",
          workplace: "any",
          skills: "",
          experience_level: "any",
          employment_type: "any",
          salary_min: "",
          salary_max: "",
          page: 1,
        }}
        onJobSearchChange={() => {}}
        jobResults={[]}
        onJobSearch={() => {}}
        onSelectJob={() => {}}
        isSearchingJobs={false}
        jobSearchError=""
        jobSearchNotice=""
        onSaveJob={onSaveJob}
        onOpenTracker={onOpenTracker}
        onCreateSearchAlert={() => {}}
        onPageChange={() => {}}
        pagination={{ page: 1, count: 0, total_pages: 0, has_previous: false, has_next: false }}
        selectedJob={{ id: "job-1", title: "Data Analyst", company: "Example Co", url: "https://example.com/job?utm_medium=api", description_is_partial: true }}
        matchPreview={{
          summary: {
            match_score: 76,
            readiness_score: 68,
            score_breakdown: {
              requirement_evidence: { score: 72, weight: 65 },
              skill_coverage: { score: 83, weight: 35 },
              ats_preparation: { score: 60, weight: 20 },
              job_match_weight: 80,
            },
            confidence: {
              level: "medium",
              label: "Medium confidence",
              detail: "Score is based on useful job text, but a full posting may change the result.",
            },
          },
          skills: { matched: ["python", "sql"], missing: ["tableau"], missing_details: [{ name: "tableau", priority: "low" }] },
          semantic_matches: [
            {
              label: "Semantic match",
              requirement: "Experience with REST API development",
              evidence: "Built backend endpoints and integrated third-party services",
              score: 82,
              explanation: "Different wording, related technical meaning",
            },
          ],
          requirements_summary: {
            counts: { matched: 1, partial: 1, weak: 1, missing: 1 },
            top_gaps: [
              {
                category: "missing",
                text: "Build Tableau dashboards for stakeholders.",
                score: 0,
                priority: "high",
                evidence: "",
                match_basis: "",
              },
            ],
            top_evidence: [
              {
                category: "matched",
                text: "Use Python for reporting.",
                score: 90,
                priority: "medium",
                evidence: "Built Python reporting workflow.",
                match_basis: "Keyword evidence match",
              },
            ],
          },
          priority_fixes: [
            {
              title: "Add proof for missing job skills",
              evidenceNeeded: "One real Tableau example with a project and result.",
              priority: "high",
            },
          ],
        }}
        isPreviewingMatch={false}
        matchPreviewError=""
        onAnalyze={() => {}}
        isLoading={false}
        error=""
        useAiCoaching={false}
        onAiCoachingChange={() => {}}
      />,
    );

    expect(screen.getByText("Quick resume comparison")).toBeVisible();
    expect(screen.getByText("Strong fit")).toBeVisible();
    expect(screen.getByText("76%")).toBeVisible();
    expect(screen.getByText("68%")).toBeVisible();
    expect(screen.getByText("Requirement gaps")).toBeVisible();
    expect(screen.getByText("2 open, 1 partial")).toBeVisible();
    expect(screen.getByText("Score breakdown")).toBeVisible();
    expect(screen.getByText("Review before applying")).toBeVisible();
    expect(screen.getByText("Add proof for missing job skills")).toBeVisible();
    expect(screen.getByText("One real Tableau example with a project and result.")).toBeVisible();
    expect(screen.getByText("Requirements")).toBeVisible();
    expect(screen.getByText("Matched 1")).toBeVisible();
    expect(screen.getByText("Build Tableau dashboards for stakeholders.")).toBeVisible();
    expect(screen.getByText("Built Python reporting workflow.")).toBeVisible();
    expect(screen.getByText(/Medium confidence:/)).toBeVisible();
    expect(screen.getByText(/a full posting may change the result/)).toBeVisible();
    expect(screen.getByText("Requirement evidence")).toBeVisible();
    expect(screen.getByText("Skill coverage")).toBeVisible();
    expect(screen.getByText("ATS preparation")).toBeVisible();
    expect(screen.getByText("python")).toBeVisible();
    expect(screen.getByText("Semantic evidence")).toBeVisible();
    expect(screen.getByText("Semantic match")).toBeVisible();
    expect(screen.getByText("Experience with REST API development")).toBeVisible();
    expect(screen.getByText("Built backend endpoints and integrated third-party services")).toBeVisible();
    expect(screen.getByText("Different wording, related technical meaning")).toBeVisible();
    expect(screen.getByText("tableau · optional")).toBeVisible();
    expect(screen.getByText("This provider shared a shortened excerpt")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open source posting" })).toHaveAttribute("href", "https://example.com/job?utm_medium=api");
    expect(screen.getByText("Job text used for scoring")).toBeVisible();
    fireEvent.click(screen.getByText("Job text used for scoring"));
    expect(screen.getByText(/job description text only/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Generate full readiness report" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Add to tracker" }));
    fireEvent.click(screen.getByRole("button", { name: "Open tracker" }));
    expect(onSaveJob).toHaveBeenCalledWith(expect.objectContaining({ id: "job-1" }));
    expect(onOpenTracker).toHaveBeenCalledOnce();
  });

  it("shows active filters and clears them without changing the role or location", () => {
    const onJobSearchChange = vi.fn();
    render(
      <JobMatchScreen
        jobDescription=""
        onChange={() => {}}
        onLoadSample={() => {}}
        jobSearch={{
          title: "Data Analyst",
          location: "Montreal",
          country: "ca",
          source: "remotive",
          workplace: "hybrid",
          skills: "Python SQL",
          experience_level: "entry",
          employment_type: "full_time",
          salary_min: "60000",
          salary_max: "",
          page: 2,
        }}
        onJobSearchChange={onJobSearchChange}
        jobResults={[]}
        onJobSearch={() => {}}
        onSelectJob={() => {}}
        isSearchingJobs={false}
        jobSearchError=""
        jobSearchNotice=""
        onSaveJob={() => {}}
        onCreateSearchAlert={() => {}}
        onPageChange={() => {}}
        pagination={{ page: 2, count: 0, total_pages: 0, has_previous: false, has_next: false }}
        selectedJob={null}
        onAnalyze={() => {}}
        isLoading={false}
        error=""
        useAiCoaching={false}
        onAiCoachingChange={() => {}}
      />,
    );

    expect(screen.getByText("Active filters")).toBeVisible();
    expect(screen.getByText("Website: Remotive")).toBeVisible();
    expect(screen.getAllByText("Hybrid")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onJobSearchChange).toHaveBeenCalledWith(expect.objectContaining({
      title: "Data Analyst",
      location: "Montreal",
      source: "all",
      workplace: "any",
      skills: "",
      experience_level: "any",
      employment_type: "any",
      salary_min: "",
      page: 1,
    }));
  });

  it("offers a resume upload action when a job is selected without a resume", () => {
    const onUploadResume = vi.fn();
    render(
      <JobMatchScreen
        jobDescription="Build dashboards with Python and Tableau."
        onChange={() => {}}
        onLoadSample={() => {}}
        jobSearch={{
          title: "Data Analyst",
          location: "",
          country: "ca",
          source: "all",
          workplace: "any",
          skills: "",
          experience_level: "any",
          employment_type: "any",
          salary_min: "",
          salary_max: "",
          page: 1,
        }}
        onJobSearchChange={() => {}}
        jobResults={[]}
        onJobSearch={() => {}}
        onSelectJob={() => {}}
        isSearchingJobs={false}
        jobSearchError=""
        jobSearchNotice=""
        onSaveJob={() => {}}
        onCreateSearchAlert={() => {}}
        onPageChange={() => {}}
        pagination={{ page: 1, count: 0, total_pages: 0, has_previous: false, has_next: false }}
        selectedJob={{ id: "job-1", title: "Data Analyst", company: "Example Co" }}
        matchPreview={null}
        isPreviewingMatch={false}
        matchPreviewError="Upload or select a resume to calculate your match score."
        hasResume={false}
        onUploadResume={onUploadResume}
        onAnalyze={() => {}}
        isLoading={false}
        error=""
        useAiCoaching={false}
        onAiCoachingChange={() => {}}
      />,
    );

    expect(screen.getByText("Compare this job with your resume")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Upload resume" }));
    expect(onUploadResume).toHaveBeenCalledOnce();
  });
});
