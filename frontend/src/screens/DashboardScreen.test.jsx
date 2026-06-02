import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import DashboardScreen from "./DashboardScreen.jsx";


describe("DashboardScreen", () => {
  it("surfaces the earliest upcoming action and marks overdue work clearly", () => {
    render(
      <DashboardScreen
        history={[]}
        savedJobs={[
          {
            id: 1,
            title: "Data Analyst",
            company: "Example Co",
            status: "interview",
            follow_up_date: "2000-01-02",
            interview_date: "2099-01-02",
          },
        ]}
        searchAlerts={[]}
        onNavigate={() => {}}
        onToggleAlert={() => {}}
        onUpdateAlert={() => {}}
        onDeleteAlert={() => {}}
      />,
    );

    expect(screen.getByText("Overdue follow up")).toBeVisible();
    expect(screen.getByText("Jan 2")).toBeVisible();
    expect(screen.queryByText("Interview Jan 2")).not.toBeInTheDocument();
  });
});
