import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HomeScreen from "./HomeScreen.jsx";


describe("HomeScreen", () => {
  it("presents the desktop application workflow and readiness preview", () => {
    render(<HomeScreen onNavigate={() => {}} onAuthOpen={() => {}} />);

    expect(screen.getByRole("heading", { name: "Prepare a stronger application for every role." })).toBeVisible();
    expect(screen.getByText("Live job discovery")).toBeVisible();
    expect(screen.getByText("Explainable readiness")).toBeVisible();
    expect(screen.getByText("Data Analyst · Northstar Analytics")).toBeVisible();
    expect(screen.getByText("Add a measurable example of stakeholder reporting.")).toBeVisible();
  });

  it("opens the main workflow actions", () => {
    const onNavigate = vi.fn();
    const onAuthOpen = vi.fn();
    render(<HomeScreen onNavigate={onNavigate} onAuthOpen={onAuthOpen} />);

    fireEvent.click(screen.getByRole("button", { name: "Check your resume fit" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Search jobs" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Create a free workspace" }));

    expect(onNavigate).toHaveBeenNthCalledWith(1, "resume");
    expect(onNavigate).toHaveBeenNthCalledWith(2, "job");
    expect(onAuthOpen).toHaveBeenCalledWith("create");
  });
});
