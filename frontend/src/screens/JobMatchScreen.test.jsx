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
});
