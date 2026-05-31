import { describe, expect, it } from "vitest";

import {
  applyProfileToJobSearch,
  applyResumeToJobSearch,
  extractResumeJobSearchDefaults,
  inferSearchCountry,
} from "./jobSearchDefaults.js";


describe("applyProfileToJobSearch", () => {
  it("fills role, location, and country from a Canadian profile", () => {
    const result = applyProfileToJobSearch(
      { title: "Old role", location: "", country: "us", page: 3 },
      { target_role: "Mechanical Engineer", location: "Montreal, QC" },
    );

    expect(result).toEqual({
      title: "Mechanical Engineer",
      location: "Montreal, QC",
      country: "ca",
      page: 1,
    });
  });

  it("keeps the existing title but clears a stale location when profile fields are empty", () => {
    const result = applyProfileToJobSearch(
      { title: "Data Analyst", location: "Boston", country: "us", page: 2 },
      { target_role: "", location: "" },
    );

    expect(result).toEqual({
      title: "Data Analyst",
      location: "",
      country: "us",
      page: 1,
    });
  });
});


describe("inferSearchCountry", () => {
  it("infers supported countries and preserves the fallback for unknown places", () => {
    expect(inferSearchCountry("London, UK", "us")).toBe("gb");
    expect(inferSearchCountry("Toronto, ON", "us")).toBe("ca");
    expect(inferSearchCountry("Paris, France", "ca")).toBe("ca");
  });
});


describe("extractResumeJobSearchDefaults", () => {
  it("extracts a role, location, and country from the resume header and summary", () => {
    const result = extractResumeJobSearchDefaults(`Alex Morgan
alex.morgan@example.com | +1 514 555 1212 | Montreal, Canada

Summary
Junior data analyst with dashboard reporting experience.`);

    expect(result).toEqual({
      title: "Junior Data Analyst",
      location: "Montreal, Canada",
      country: "ca",
    });
  });

  it("supports an explicitly labeled professional title", () => {
    const result = extractResumeJobSearchDefaults(`Taylor Student
Location: Toronto, ON
Professional title: Mechanical Engineer

Experience
Designed mechanical systems.`);

    expect(result).toEqual({
      title: "Mechanical Engineer",
      location: "Toronto, ON",
      country: "ca",
    });
  });

  it("normalizes mechanical engineering student text to the searchable role", () => {
    const result = extractResumeJobSearchDefaults(`Mostafa Fotoohi
mostafa@example.com | Montreal, QC
Mechanical Engineering Student

Experience
Designed mechanical components.`);

    expect(result.title).toBe("Mechanical Engineer");
  });

  it("uses the uploaded filename when the parsed body does not contain a role", () => {
    const result = extractResumeJobSearchDefaults(
      "Mostafa Fotoohi\nmostafa@example.com | Montreal, QC",
      "Mostafa_Fotoohi-mechanical-engineer-resume.pdf",
    );

    expect(result.title).toBe("Mechanical Engineer");
  });
});


describe("applyResumeToJobSearch", () => {
  it("fills the jobs form from resume text and keeps the other selected filters", () => {
    const result = applyResumeToJobSearch(
      { title: "Old role", location: "", country: "us", workplace: "hybrid", page: 4 },
      `Alex Morgan
alex.morgan@example.com | +1 514 555 1212 | Montreal, Canada
Summary
Junior data analyst with reporting experience.`,
      {},
    );

    expect(result).toEqual({
      title: "Junior Data Analyst",
      location: "Montreal, Canada",
      country: "ca",
      workplace: "hybrid",
      page: 1,
    });
  });

  it("replaces a stale software profile role with the role inferred from the resume", () => {
    const result = applyResumeToJobSearch(
      { title: "Junior Software Engineer", location: "", country: "us", page: 1 },
      `Mostafa Fotoohi
mostafa@example.com | Montreal, QC
Mechanical Engineering Student`,
      { target_role: "Junior Software Engineer" },
    );

    expect(result.title).toBe("Mechanical Engineer");
  });
});
