import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HistoryScreen from "./HistoryScreen.jsx";


const savedJobs = [
  {
    id: 1,
    title: "Data Analyst",
    company: "Example Co",
    location: "Montreal",
    status: "applied",
    follow_up_date: "2000-01-02",
    recruiter_name: "Taylor Recruiter",
    notes: "Follow up after portfolio review.",
  },
  {
    id: 2,
    title: "Mechanical Engineer",
    company: "Build Co",
    location: "Toronto",
    status: "saved",
    notes: "",
  },
];


describe("HistoryScreen", () => {
  it("surfaces overdue follow-ups and filters the board to attention items", () => {
    render(
      <HistoryScreen
        history={[]}
        savedJobs={savedJobs}
        resumeVersions={[]}
        onOpenReport={() => {}}
        onUseJob={() => {}}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={() => {}}
      />,
    );

    expect(screen.getByText("Overdue: Follow up Jan 2, 2000")).toBeVisible();
    expect(screen.getAllByText("Needs attention")).toHaveLength(2);

    fireEvent.click(screen.getByLabelText("Needs attention"));
    expect(screen.queryByText("Mechanical Engineer")).not.toBeInTheDocument();
    expect(screen.getByText("Data Analyst")).toBeVisible();
  });

  it("searches by recruiter name", () => {
    render(
      <HistoryScreen
        history={[]}
        savedJobs={savedJobs}
        resumeVersions={[]}
        onOpenReport={() => {}}
        onUseJob={() => {}}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("Search tracked jobs"), { target: { value: "Taylor Recruiter" } });
    expect(screen.getByText("Data Analyst")).toBeVisible();
    expect(screen.queryByText("Mechanical Engineer")).not.toBeInTheDocument();
  });
});
