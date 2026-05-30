const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function authHeaders() {
  const token = getStoredToken();
  return token ? { Authorization: `Token ${token}` } : {};
}

export function getStoredToken() {
  return localStorage.getItem("careerfit_token") || sessionStorage.getItem("careerfit_token");
}

export function storeToken(token, remember = false) {
  clearStoredToken();
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("careerfit_token", token);
}

export function clearStoredToken() {
  localStorage.removeItem("careerfit_token");
  sessionStorage.removeItem("careerfit_token");
}

export async function analyzeMatch(payload) {
  const response = await fetch(`${API_BASE_URL}/matches/analyze/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to analyze resume match.");
  }

  return response.json();
}

export async function previewMatch(payload) {
  const response = await fetch(`${API_BASE_URL}/matches/preview/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to preview resume match.");
  }

  return response.json();
}

export async function requestAiCoaching(payload) {
  const response = await fetch(`${API_BASE_URL}/matches/coach/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to generate specific improvements.");
  }

  return response.json();
}

export async function uploadResume(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resumes/upload/`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to parse resume file.");
  }

  return response.json();
}

export async function searchJobs({
  title,
  location,
  country,
  page = 1,
  workplace = "any",
  skills = "",
  experience_level = "any",
  employment_type = "any",
  salary_min = "",
  salary_max = "",
}) {
  const params = new URLSearchParams({
    title,
    country,
    page: String(page),
    workplace,
    skills,
    experience_level,
    employment_type,
  });

  if (location) {
    params.set("location", location);
  }
  if (salary_min) {
    params.set("salary_min", salary_min);
  }
  if (salary_max) {
    params.set("salary_max", salary_max);
  }

  const response = await fetch(`${API_BASE_URL}/jobs/search/?${params.toString()}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to search jobs.");
  }

  return response.json();
}

export async function registerAccount(payload) {
  return postJson("/accounts/register/", payload);
}

export async function loginAccount(payload) {
  return postJson("/accounts/login/", payload);
}

export async function logoutAccount() {
  return postJson("/accounts/logout/", {});
}

export async function fetchCurrentUser() {
  return getJson("/accounts/me/");
}

export async function requestPasswordReset(payload) {
  return postJson("/accounts/password-reset/", payload);
}

export async function confirmPasswordReset(payload) {
  return postJson("/accounts/password-reset-confirm/", payload);
}

export async function requestEmailVerification() {
  return postJson("/accounts/email-verification/", {});
}

export async function confirmEmailVerification(payload) {
  return postJson("/accounts/verify-email/", payload);
}

export async function updateCurrentUser(payload) {
  const response = await fetch(`${API_BASE_URL}/accounts/me/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

export async function saveJob(job) {
  return postJson("/jobs/saved/", {
    external_id: job.id,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description,
    url: job.url,
    source: job.source,
  });
}

export async function fetchSavedJobs() {
  return getJson("/jobs/saved/");
}

export async function deleteSavedJob(jobId) {
  return deleteJson(`/jobs/saved/${jobId}/`);
}

export async function updateTrackedJob(jobId, payload) {
  return patchJson(`/jobs/saved/${jobId}/`, payload);
}

export async function fetchSearchAlerts() {
  return getJson("/jobs/alerts/");
}

export async function createSearchAlert(payload) {
  return postJson("/jobs/alerts/", payload);
}

export async function updateSearchAlert(alertId, payload) {
  return patchJson(`/jobs/alerts/${alertId}/`, payload);
}

export async function deleteSearchAlert(alertId) {
  return deleteJson(`/jobs/alerts/${alertId}/`);
}

export async function fetchResumeVersions() {
  return getJson("/resumes/");
}

export async function createResumeVersion(payload) {
  return postJson("/resumes/", payload);
}

export async function fetchReportHistory() {
  return getJson("/matches/history/");
}

export async function deleteReport(reportId) {
  return deleteJson(`/matches/history/${reportId}/`);
}

export async function deleteResume(resumeId) {
  return deleteJson(`/resumes/${resumeId}/`);
}

export async function deleteAccount() {
  return deleteJson("/accounts/me/");
}

async function getJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: authHeaders(),
  });
  return handleResponse(response);
}

async function postJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

async function patchJson(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return handleResponse(response);
}

async function deleteJson(path) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    const message =
      details.detail ||
      Object.values(details).flat().join(" ") ||
      "Unable to complete request.";
    throw new Error(message);
  }
  if (response.status === 204) {
    return {};
  }
  return response.json();
}
