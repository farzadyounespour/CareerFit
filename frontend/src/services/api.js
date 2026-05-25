const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function analyzeMatch(payload) {
  const response = await fetch(`${API_BASE_URL}/matches/analyze/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
    body: formData,
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.detail || "Unable to parse resume file.");
  }

  return response.json();
}

export async function searchJobs({ title, location, country }) {
  const params = new URLSearchParams({
    title,
    country,
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
