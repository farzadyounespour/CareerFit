const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function authHeaders() {
  const token = localStorage.getItem("careerfit_token");
  return token ? { Authorization: `Token ${token}` } : {};
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

export async function searchJobs({ title, location, country, page = 1, remote = false }) {
  const params = new URLSearchParams({
    title,
    country,
    page: String(page),
    remote: String(remote),
  });

  if (location) {
    params.set("location", location);
  }

  const response = await fetch(`${API_BASE_URL}/jobs/search/?${params.toString()}`);

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

export async function fetchReportHistory() {
  return getJson("/matches/history/");
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
