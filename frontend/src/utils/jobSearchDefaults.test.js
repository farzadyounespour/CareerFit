import { describe, expect, it } from "vitest";

import { applyProfileToJobSearch, inferSearchCountry } from "./jobSearchDefaults.js";


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
