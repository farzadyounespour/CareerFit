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
        }]}
        roleInsights={{
          postings_analyzed: 3,
          partial_postings: 1,
          common_skills: [{ name: "python", count: 2, percentage: 67 }],
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

    fireEvent.change(screen.getByPlaceholderText("https://company.example/jobs/data-analyst"), { target: { value: "https://example.com/jobs/analyst" } });
    fireEvent.click(screen.getByRole("button", { name: "Import URL" }));
    return waitFor(() => expect(onImportJobUrl).toHaveBeenCalledWith("https://example.com/jobs/analyst"));
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
        selectedJob={{ id: "job-1", title: "Data Analyst", company: "Example Co", description_is_partial: true }}
        matchPreview={{
          summary: { match_score: 76, readiness_score: 68 },
          skills: { matched: ["python", "sql"], missing: ["tableau"], missing_details: [{ name: "tableau", priority: "low" }] },
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
    expect(screen.getByText("76%")).toBeVisible();
    expect(screen.getByText("68%")).toBeVisible();
    expect(screen.getByText("python")).toBeVisible();
    expect(screen.getByText("tableau · optional")).toBeVisible();
    expect(screen.getByText("This provider shared a shortened excerpt")).toBeVisible();
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
    expect(screen.getAllByText("Hybrid")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onJobSearchChange).toHaveBeenCalledWith(expect.objectContaining({
      title: "Data Analyst",
      location: "Montreal",
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
