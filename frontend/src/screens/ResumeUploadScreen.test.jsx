import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ResumeUploadScreen from "./ResumeUploadScreen.jsx";


const readyResume = `Student User
student@example.com | +1 514 555 1212 | Montreal
Summary
Data analyst with dashboard experience.
Skills
Python SQL Tableau
Experience
- 2025: Built a Tableau dashboard for reporting and reduced manual work by 20%.
- Cleaned data with Python and SQL.
Education
Example University
Coursework in statistics and analytics with additional reporting project details for stakeholders.`;


function renderScreen(overrides = {}) {
  return render(
    <ResumeUploadScreen
      resumeText=""
      onChange={() => {}}
      onLoadSample={() => {}}
      onUpload={() => {}}
      isUploading={false}
      uploadStatus=""
      uploadError=""
      onDismissError={() => {}}
      onNext={() => {}}
      onDelete={() => {}}
      {...overrides}
    />,
  );
}


describe("ResumeUploadScreen", () => {
  it("shows live ATS failures for an incomplete resume and checks for a prepared resume", () => {
    const { rerender } = renderScreen({ resumeText: "Short resume" });
    expect(screen.getByText("1 of 9 checks ready")).toBeVisible();

    rerender(
      <ResumeUploadScreen
        resumeText={readyResume}
        onChange={() => {}}
        onLoadSample={() => {}}
        onUpload={() => {}}
        isUploading={false}
        uploadStatus=""
        uploadError=""
        onDismissError={() => {}}
        onNext={() => {}}
        onDelete={() => {}}
      />,
    );
    expect(screen.getByText("9 of 9 checks ready")).toBeVisible();
  });

  it("lets the user dismiss a wrong-file error and clear loaded text", () => {
    const onDismissError = vi.fn();
    const onDelete = vi.fn();
    renderScreen({ resumeText: "Resume text", uploadError: "Unsupported resume file type.", onDismissError, onDelete });

    fireEvent.click(screen.getByTitle("Dismiss upload error"));
    fireEvent.click(screen.getByRole("button", { name: "Clear resume" }));

    expect(onDismissError).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("lets the user remove a saved resume version", () => {
    const onDeleteVersion = vi.fn();
    renderScreen({
      resumeVersions: [{ id: 7, title: "Analyst tailored", text: "Resume text" }],
      onDeleteVersion,
    });

    fireEvent.click(screen.getByTitle("Remove Analyst tailored"));

    expect(onDeleteVersion).toHaveBeenCalledWith(7);
  });
});
