export function applyProfileToJobSearch(currentSearch, profile) {
  const location = profile.location?.trim() || "";
  return {
    ...currentSearch,
    title: profile.target_role?.trim() || currentSearch.title,
    location,
    country: inferSearchCountry(location, currentSearch.country),
    page: 1,
  };
}

export function applyResumeToJobSearch(currentSearch, resumeText, profile = {}) {
  const resumeDefaults = extractResumeJobSearchDefaults(resumeText);
  const profileLocation = profile.location?.trim() || "";
  const location = resumeDefaults.location || profileLocation || currentSearch.location;
  return {
    ...currentSearch,
    title: resumeDefaults.title || profile.target_role?.trim() || currentSearch.title,
    location,
    country: resumeDefaults.country || inferSearchCountry(location, currentSearch.country),
    page: 1,
  };
}

export function extractResumeJobSearchDefaults(resumeText) {
  const title = extractResumeTitle(resumeText);
  const location = extractResumeLocation(resumeText);
  return {
    title,
    location,
    country: location ? inferSearchCountry(location) : "",
  };
}

export function inferSearchCountry(location, fallback = "us") {
  const normalized = location.toLowerCase();
  if (/\b(canada|montreal|toronto|vancouver|ottawa|calgary|edmonton|quebec)\b|,\s*(qc|on|bc|ab)\b/.test(normalized)) {
    return "ca";
  }
  if (/\b(united kingdom|uk|england|scotland|wales|london|manchester|birmingham)\b/.test(normalized)) {
    return "gb";
  }
  if (/\b(united states|usa|u\.s\.a|new york|los angeles|chicago|boston|seattle)\b/.test(normalized)) {
    return "us";
  }
  return fallback || "us";
}

const ROLE_NAMES = [
  "artificial intelligence engineer",
  "business intelligence analyst",
  "full stack developer",
  "machine learning engineer",
  "mechanical engineer",
  "product manager",
  "project manager",
  "software engineer",
  "software developer",
  "business analyst",
  "data engineer",
  "data scientist",
  "database administrator",
  "financial analyst",
  "frontend developer",
  "front end developer",
  "human resources specialist",
  "marketing specialist",
  "network administrator",
  "quality assurance engineer",
  "systems administrator",
  "ux designer",
  "web developer",
  "data analyst",
  "graphic designer",
  "sales representative",
];

const SENIORITY = "(?:junior|senior|lead|principal|staff|entry[- ]level|intermediate|associate)";

function extractResumeTitle(resumeText) {
  const explicitTitle = resumeText.match(/^(?:target role|job title|professional title|desired role)\s*[:|-]\s*(.{2,80})$/im)?.[1];
  if (explicitTitle) {
    return cleanTitle(explicitTitle);
  }

  const firstResumeSection = resumeText.split(/\b(?:experience|education|skills|projects)\b/i)[0];
  for (const role of ROLE_NAMES) {
    const rolePattern = new RegExp(`\\b((?:${SENIORITY}\\s+)?${escapeRegExp(role)})\\b`, "i");
    const match = firstResumeSection.match(rolePattern);
    if (match) {
      return cleanTitle(match[1]);
    }
  }
  return "";
}

function extractResumeLocation(resumeText) {
  const explicitLocation = resumeText.match(/^(?:location|address|city)\s*[:|-]\s*(.{2,100})$/im)?.[1];
  if (explicitLocation) {
    return cleanLocation(explicitLocation);
  }

  const header = resumeText.split(/\b(?:summary|profile|objective|skills|experience|education)\b/i)[0];
  const segments = header.split(/[\n|•]+/).map((segment) => segment.trim()).filter(Boolean);
  const locationSegment = segments.find(isLikelyLocation);
  return locationSegment ? cleanLocation(locationSegment) : "";
}

function isLikelyLocation(segment) {
  if (/@|https?:|\d{5,}|\+?\d[\d(). -]{7,}\d/.test(segment)) {
    return false;
  }
  return /\b(canada|united states|usa|united kingdom|uk|montreal|toronto|vancouver|ottawa|calgary|edmonton|quebec|new york|los angeles|chicago|boston|seattle|london|manchester|birmingham)\b|,\s*(qc|on|bc|ab|ny|ca|il|ma|wa)\b/i.test(segment);
}

function cleanTitle(title) {
  return title
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cleanLocation(location) {
  return location.replace(/\s+/g, " ").replace(/[;,]+$/, "").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
