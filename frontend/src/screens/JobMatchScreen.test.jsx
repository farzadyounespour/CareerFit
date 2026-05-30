import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import JobMatchScreen from "./JobMatchScreen.jsx";


describe("JobMatchScreen", () => {
  it("shows the current and total number of result pages", () => {
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
        onJobSearch={() => {}}
        onSelectJob={() => {}}
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
  });

  it("shows a quick resume comparison for the selected job", () => {
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
        matchPreview={{
          summary: { match_score: 76, readiness_score: 68 },
          skills: { matched: ["python", "sql"], missing: ["tableau"] },
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
    expect(screen.getByText("tableau")).toBeVisible();
    expect(screen.getByRole("button", { name: "Generate full readiness report" })).toBeVisible();
  });
});
