import { afterEach, describe, expect, it, vi } from "vitest";

import { generateResumeDraft, loginAccount, previewMatch, requestAiCoaching, searchJobs, storeToken } from "./api.js";


afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.unstubAllGlobals();
});


describe("searchJobs", () => {
  it("sends login credentials and the selected filters", async () => {
    storeToken("careerfit-test-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await searchJobs({
      title: "Data Analyst",
      country: "ca",
      source: "remotive",
      workplace: "hybrid",
      skills: "Python SQL",
      excluded_keywords: "senior, unpaid",
      experience_level: "entry",
      employment_type: "full_time",
      salary_min: "60000",
      salary_max: "90000",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain("source=remotive");
    expect(url).toContain("workplace=hybrid");
    expect(url).toContain("skills=Python+SQL");
    expect(url).toContain("excluded_keywords=senior%2C+unpaid");
    expect(url).toContain("salary_min=60000");
    expect(options.headers).toEqual({ Authorization: "Token careerfit-test-token" });
  });
});


describe("previewMatch", () => {
  it("sends the resume and job description with login credentials", async () => {
    storeToken("careerfit-test-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ summary: {}, skills: {} }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await previewMatch({
      resume_text: "Python SQL",
      job_description: "Build dashboards with Python.",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/matches/preview/");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Token careerfit-test-token",
    });
    expect(JSON.parse(options.body)).toEqual({
      resume_text: "Python SQL",
      job_description: "Build dashboards with Python.",
    });
  });
});


describe("requestAiCoaching", () => {
  it("requests optional specific improvements with login credentials", async () => {
    storeToken("careerfit-test-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ai_coaching: { status: "completed" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await requestAiCoaching({
      resume_text: "Python SQL",
      job_description: "Build dashboards with Python.",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/matches/coach/");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Token careerfit-test-token",
    });
  });
});


describe("generateResumeDraft", () => {
  it("requests an optional AI resume draft with login credentials", async () => {
    storeToken("careerfit-test-token");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ resume_generation: { status: "completed" } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await generateResumeDraft({
      resume_text: "Python SQL",
      job_description: "Build dashboards with Python.",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/matches/resume-draft/");
    expect(options.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Token careerfit-test-token",
    });
  });
});


describe("loginAccount", () => {
  it("shows a clear message when the API proxy cannot reach Django", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: { get: () => "text/plain" },
      text: async () => "",
    }));

    await expect(loginAccount({
      email: "farzad@gmail.com",
      password: "careerfit-pass",
    })).rejects.toThrow("API server unavailable. Start the backend server and try again.");
  });
});
