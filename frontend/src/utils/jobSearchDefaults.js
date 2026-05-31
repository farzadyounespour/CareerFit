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

export function applyResumeToJobSearch(currentSearch, resumeText, profile = {}, sourceName = "") {
  const resumeDefaults = extractResumeJobSearchDefaults(resumeText, sourceName);
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

export function extractResumeJobSearchDefaults(resumeText, sourceName = "") {
  const title = extractResumeTitle(resumeText) || extractResumeTitle(sourceName, true);
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

const ROLE_VARIANTS = [
  { title: "Artificial Intelligence Engineer", aliases: ["artificial intelligence engineer", "ai engineer"] },
  { title: "Business Intelligence Analyst", aliases: ["business intelligence analyst", "bi analyst"] },
  { title: "Full Stack Developer", aliases: ["full stack developer", "full-stack developer"] },
  { title: "Machine Learning Engineer", aliases: ["machine learning engineer", "ml engineer"] },
  { title: "Mechanical Engineer", aliases: ["mechanical design engineer", "mechanical engineer", "mechanical engineering", "mechanical designer"] },
  { title: "Electrical Engineer", aliases: ["electrical engineer", "electrical engineering"] },
  { title: "Civil Engineer", aliases: ["civil engineer", "civil engineering"] },
  { title: "Chemical Engineer", aliases: ["chemical engineer", "chemical engineering"] },
  { title: "Industrial Engineer", aliases: ["industrial engineer", "industrial engineering"] },
  { title: "Product Manager", aliases: ["product manager", "product management"] },
  { title: "Project Manager", aliases: ["project manager", "project management"] },
  { title: "Software Engineer", aliases: ["software engineer", "software engineering"] },
  { title: "Software Developer", aliases: ["software developer", "application developer"] },
  { title: "Business Analyst", aliases: ["business analyst", "business analysis"] },
  { title: "Data Engineer", aliases: ["data engineer", "data engineering"] },
  { title: "Data Scientist", aliases: ["data scientist", "data science"] },
  { title: "Database Administrator", aliases: ["database administrator", "database administration"] },
  { title: "Financial Analyst", aliases: ["financial analyst", "financial analysis"] },
  { title: "Frontend Developer", aliases: ["frontend developer", "front end developer", "front-end developer"] },
  { title: "Human Resources Specialist", aliases: ["human resources specialist", "hr specialist"] },
  { title: "Marketing Specialist", aliases: ["marketing specialist"] },
  { title: "Network Administrator", aliases: ["network administrator", "network administration"] },
  { title: "Quality Assurance Engineer", aliases: ["quality assurance engineer", "qa engineer"] },
  { title: "Systems Administrator", aliases: ["systems administrator", "system administrator"] },
  { title: "UX Designer", aliases: ["ux designer", "user experience designer"] },
  { title: "Web Developer", aliases: ["web developer", "web development"] },
  { title: "Data Analyst", aliases: ["data analyst", "data analytics", "data analysis"] },
  { title: "Graphic Designer", aliases: ["graphic designer", "graphic design"] },
  { title: "Sales Representative", aliases: ["sales representative"] },
];

const SENIORITY = "(?:junior|senior|lead|principal|staff|entry[- ]level|intermediate|associate)";

function extractResumeTitle(resumeText, isFilename = false) {
  const searchableText = isFilename ? resumeText.replace(/[-_.]+/g, " ") : resumeText;
  const explicitTitle = searchableText.match(/^(?:target role|job title|professional title|desired role)\s*[:|-]\s*(.{2,80})$/im)?.[1];
  if (explicitTitle) {
    return canonicalizeTitle(explicitTitle) || cleanTitle(explicitTitle);
  }

  const firstResumeSection = searchableText.split(/\b(?:experience|education|skills|projects)\b/i)[0];
  for (const role of ROLE_VARIANTS) {
    for (const alias of role.aliases) {
      const rolePattern = new RegExp(`\\b(${SENIORITY}\\s+)?${escapeRegExp(alias)}\\b`, "i");
      const match = firstResumeSection.match(rolePattern);
      if (match) {
        return cleanTitle(`${match[1] || ""}${role.title}`);
      }
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

function canonicalizeTitle(title) {
  for (const role of ROLE_VARIANTS) {
    for (const alias of role.aliases) {
      if (new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(title)) {
        const seniority = title.match(new RegExp(`\\b${SENIORITY}\\b`, "i"))?.[0] || "";
        return cleanTitle(`${seniority} ${role.title}`);
      }
    }
  }
  return "";
}

function cleanLocation(location) {
  return location.replace(/\s+/g, " ").replace(/[;,]+$/, "").trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
