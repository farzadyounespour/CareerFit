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
