import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

const manyJobs = Array.from({ length: 7 }, (_, index) => ({
  id: index + 10,
  title: `Tracked Role ${index + 1}`,
  company: `Company ${index + 1}`,
  location: "Montreal",
  status: index < 4 ? "saved" : "applied",
  notes: "",
}));


describe("HistoryScreen", () => {
  it("shows the company name in report history cards", () => {
    const onOpenReport = vi.fn();
    render(
      <HistoryScreen
        history={[
          {
            id: 10,
            target_role: "Junior Software Engineer",
            company: "Trane Technologies",
            created_at: "2026-07-06T12:00:00Z",
            summary: { readiness_score: 46 },
          },
        ]}
        savedJobs={[]}
        resumeVersions={[]}
        onOpenReport={onOpenReport}
        onUseJob={() => {}}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={() => {}}
      />,
    );

    expect(screen.getByText("Junior Software Engineer")).toBeVisible();
    expect(screen.getByText("Trane Technologies")).toBeVisible();
    fireEvent.click(screen.getByTitle("Open report"));
    expect(onOpenReport).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it("surfaces overdue follow-ups and filters the board to attention items", () => {
    const onNavigate = vi.fn();
    const onUseJob = vi.fn();
    render(
      <HistoryScreen
        history={[]}
        savedJobs={savedJobs}
        resumeVersions={[]}
        onOpenReport={() => {}}
        onUseJob={onUseJob}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={() => {}}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText("Pipeline health")).toBeVisible();
    expect(screen.getByText("Next actions")).toBeVisible();
    expect(screen.getByText("Overdue: Follow up Jan 2, 2000")).toBeVisible();
    expect(screen.getAllByText("Needs attention")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Find jobs" }));
    expect(onNavigate).toHaveBeenCalledWith("job");
    fireEvent.click(screen.getByRole("button", { name: "Update resume" }));
    expect(onNavigate).toHaveBeenCalledWith("resume");
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    expect(onUseJob).toHaveBeenCalledWith(expect.objectContaining({ title: "Data Analyst" }));

    fireEvent.click(screen.getByLabelText("Needs attention"));
    expect(screen.queryByText("Mechanical Engineer")).not.toBeInTheDocument();
    expect(screen.getAllByText("Data Analyst")[0]).toBeVisible();
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
    expect(screen.getAllByText("Data Analyst")[0]).toBeVisible();
    expect(screen.queryByText("Mechanical Engineer")).not.toBeInTheDocument();
  });

  it("switches to a compact list when many applications are visible", () => {
    render(
      <HistoryScreen
        history={[]}
        savedJobs={manyJobs}
        resumeVersions={[]}
        onOpenReport={() => {}}
        onUseJob={() => {}}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={() => {}}
      />,
    );

    expect(screen.getByText("Applications list")).toBeVisible();
    expect(screen.getByText("7 visible")).toBeVisible();
    expect(screen.getByText("Showing a compact list because there are more than 6 visible applications.")).toBeVisible();
    expect(screen.getByText("Tracked Role 1")).toBeVisible();
    expect(screen.getByLabelText("Status for Tracked Role 1")).toBeVisible();
  });

  it("compares roles and saves packet tasks", async () => {
    const onUpdateJob = vi.fn().mockResolvedValue({});
    render(
      <HistoryScreen
        history={[]}
        savedJobs={savedJobs}
        resumeVersions={[]}
        onOpenReport={() => {}}
        onUseJob={() => {}}
        onDeleteJob={() => {}}
        onDeleteReport={() => {}}
        onUpdateJob={onUpdateJob}
      />,
    );

    fireEvent.click(screen.getByLabelText("Compare Data Analyst"));
    fireEvent.click(screen.getByLabelText("Compare Mechanical Engineer"));
    expect(screen.getByText("Compare opportunities")).toBeVisible();

    const packetButton = screen.getAllByTitle("Open application packet")[0];
    fireEvent.click(packetButton);
    expect(packetButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.change(screen.getByPlaceholderText("Send follow-up email"), { target: { value: "Send portfolio follow-up" } });
    fireEvent.click(screen.getByRole("button", { name: "Save application packet" }));

    await waitFor(() => expect(onUpdateJob).toHaveBeenCalledWith(2, expect.objectContaining({
      tasks: [expect.objectContaining({ title: "Send portfolio follow-up", completed: false })],
    })));
  });
});
