import {
  ArrowRight,
  BellPlus,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  FileSearch,
  Link2,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";

export default function JobMatchScreen({
  jobDescription,
  onChange,
  onLoadSample,
  jobSearch,
  onJobSearchChange,
  jobResults,
  onJobSearch,
  onSelectJob,
  onImportJobUrl,
  isSearchingJobs,
  jobSearchError,
  jobSearchNotice,
  onSaveJob,
  onCreateSearchAlert,
  onPageChange,
  pagination,
  selectedJob,
  matchPreview,
  isPreviewingMatch,
  matchPreviewError,
  hasResume,
  onUploadResume,
  onAnalyze,
  isLoading,
  error,
  useAiCoaching,
  onAiCoachingChange,
}) {
  const [jobUrl, setJobUrl] = useState("");
  const [isImportingUrl, setIsImportingUrl] = useState(false);
  const [jobUrlError, setJobUrlError] = useState("");
  const hasJobDescription = jobDescription.trim().length > 0;
  const totalPages = pagination.total_pages || 1;
  const activeFilters = getActiveFilters(jobSearch);

  function clearFilters() {
    onJobSearchChange({
      ...jobSearch,
      workplace: "any",
      skills: "",
      experience_level: "any",
      employment_type: "any",
      salary_min: "",
      salary_max: "",
      page: 1,
    });
  }

  async function handleImportUrl(event) {
    event.preventDefault();
    setJobUrlError("");
    setIsImportingUrl(true);
    try {
      await onImportJobUrl(jobUrl);
      setJobUrl("");
    } catch (importError) {
      setJobUrlError(importError.message);
    } finally {
      setIsImportingUrl(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Job discovery</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Choose the role you want to evaluate</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Search job postings, select a role, and review the description before generating your readiness report.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
        >
          <ClipboardPaste size={16} />
          Load sample job
        </button>
      </div>

      <section className="mt-6 rounded-md border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal">
            <Search size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-ink">Find job postings</h3>
            <p className="text-sm text-slate-500">Search by role and location, then choose a posting to analyze.</p>
          </div>
        </div>

        <form onSubmit={handleImportUrl} className="mt-5 flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 md:flex-row md:items-end">
          <label className="min-w-0 flex-1">
            <span className="text-sm font-medium text-slate-700">Already found a posting?</span>
            <span className="mt-1 block text-xs text-slate-500">Paste a public job URL to fill the comparison panel automatically.</span>
            <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 focus-within:border-teal">
              <Link2 size={16} className="shrink-0 text-slate-400" />
              <input type="url" required value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" placeholder="https://company.example/jobs/data-analyst" />
            </div>
          </label>
          <button type="submit" disabled={isImportingUrl || !jobUrl.trim()} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:text-slate-300">
            <Link2 size={16} />
            {isImportingUrl ? "Importing..." : "Import URL"}
          </button>
        </form>
        {jobUrlError && <Notice tone="amber">{jobUrlError}</Notice>}

        <form onSubmit={onJobSearch} className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_150px_auto]">
          <SearchField label="Job title" value={jobSearch.title} onChange={(value) => onJobSearchChange({ ...jobSearch, title: value })} placeholder="Junior Data Analyst" />
          <SearchField label="Location" value={jobSearch.location} onChange={(value) => onJobSearchChange({ ...jobSearch, location: value })} placeholder="Toronto" />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Country</span>
            <select value={jobSearch.country} onChange={(event) => onJobSearchChange({ ...jobSearch, country: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none">
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="gb">United Kingdom</option>
            </select>
          </label>
          <button type="submit" disabled={isSearchingJobs} className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-5 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-slate-400">
            <Search size={16} />
            {isSearchingJobs ? "Searching..." : "Search jobs"}
          </button>
        </form>

        <details className="mt-5 border-t border-slate-100 pt-4">
          <summary className="cursor-pointer list-none">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <SlidersHorizontal size={16} className="text-teal" />
              Filters and alerts
            </div>
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <SelectField label="Workplace" value={jobSearch.workplace} onChange={(value) => onJobSearchChange({ ...jobSearch, workplace: value, page: 1 })} options={[
              ["any", "Any workplace"],
              ["remote", "Remote"],
              ["hybrid", "Hybrid"],
              ["on_site", "On-site"],
            ]} />
            <SearchField label="Skills" value={jobSearch.skills} onChange={(value) => onJobSearchChange({ ...jobSearch, skills: value, page: 1 })} placeholder="Python SQL" />
            <SelectField label="Experience" value={jobSearch.experience_level} onChange={(value) => onJobSearchChange({ ...jobSearch, experience_level: value, page: 1 })} options={[
              ["any", "Any level"],
              ["internship", "Internship"],
              ["entry", "Entry level"],
              ["mid", "Mid level"],
              ["senior", "Senior"],
            ]} />
            <SelectField label="Employment" value={jobSearch.employment_type} onChange={(value) => onJobSearchChange({ ...jobSearch, employment_type: value, page: 1 })} options={[
              ["any", "Any type"],
              ["full_time", "Full-time"],
              ["part_time", "Part-time"],
              ["contract", "Contract"],
              ["permanent", "Permanent"],
            ]} />
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Salary min" value={jobSearch.salary_min} onChange={(value) => onJobSearchChange({ ...jobSearch, salary_min: value, page: 1 })} placeholder="50000" />
              <NumberField label="Salary max" value={jobSearch.salary_max} onChange={(value) => onJobSearchChange({ ...jobSearch, salary_max: value, page: 1 })} placeholder="90000" />
            </div>
          </div>
          <button type="button" onClick={onCreateSearchAlert} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <BellPlus size={16} />
            Save search alert
          </button>
        </details>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Active filters</span>
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-teal">{filter}</span>
            ))}
            <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink">
              <X size={13} />
              Clear filters
            </button>
          </div>
        )}

        {jobSearchError && <Notice tone="amber">{jobSearchError}</Notice>}
        {jobSearchNotice && <Notice tone="sky">{jobSearchNotice}</Notice>}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_380px]">
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Search results</h3>
            {jobResults.length > 0 && <span className="text-sm font-semibold text-slate-500">{pagination.count || jobResults.length} results · page {jobSearch.page}</span>}
          </div>
          <div className="mt-3 space-y-3">
            {isSearchingJobs ? (
              <LoadingResults />
            ) : jobResults.length ? (
              jobResults.map((job) => (
                <JobCard key={job.id || `${job.title}-${job.company}`} job={job} selected={selectedJob?.id === job.id} onSelect={() => onSelectJob(job)} onSave={() => onSaveJob(job)} />
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
                <BriefcaseBusiness size={25} className="mx-auto text-slate-400" />
                <p className="mt-3 font-semibold text-slate-700">Search for a role to see job postings</p>
                <p className="mt-1 text-sm text-slate-500">You can also load a sample job or paste a description manually.</p>
              </div>
            )}
          </div>

          {jobResults.length > 0 && !isSearchingJobs && (
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" disabled={!pagination.has_previous} onClick={() => onPageChange(jobSearch.page - 1)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300">Previous</button>
              <span className="text-sm font-semibold text-slate-500">Page {jobSearch.page} of {totalPages}</span>
              <button type="button" disabled={!pagination.has_next} onClick={() => onPageChange(jobSearch.page + 1)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300">Next</button>
            </div>
          )}
        </section>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-panel xl:sticky xl:top-24">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700">
              <FileSearch size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-ink">Resume comparison</h3>
              <p className="text-sm text-slate-500">Select a job to check your fit.</p>
            </div>
          </div>

          {selectedJob && (
            <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{selectedJob.title}</p>
                  <p className="mt-1 text-xs leading-5 text-emerald-700">{selectedJob.company || "Selected posting"}</p>
                </div>
              </div>
            </div>
          )}

          {isPreviewingMatch && (
            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-semibold text-slate-700">Comparing with your resume...</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="h-16 animate-pulse rounded-md bg-slate-200" />
                <div className="h-16 animate-pulse rounded-md bg-slate-200" />
              </div>
            </div>
          )}

          {matchPreviewError && !hasResume && selectedJob && (
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-semibold text-amber-950">Compare this job with your resume</p>
              <p className="mt-1 text-xs leading-5 text-amber-900">
                Upload or paste your resume to see your match score, readiness score, and missing skills for this job.
              </p>
              <button type="button" onClick={onUploadResume} className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-900 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-800">
                <Upload size={15} />
                Upload resume
              </button>
            </div>
          )}

          {matchPreviewError && (hasResume || !selectedJob) && (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {matchPreviewError}
            </p>
          )}

          {matchPreview && !isPreviewingMatch && (
            <MatchPreview preview={matchPreview} />
          )}

          <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3" open={!selectedJob}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Job description</summary>
            <textarea value={jobDescription} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-[240px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none" placeholder="Select a job posting or paste its description here..." />
          </details>

          {error && <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <details className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Full report options</summary>
            <label className="mt-3 flex items-start gap-3 border-t border-slate-200 pt-3">
              <input type="checkbox" checked={useAiCoaching} onChange={(event) => onAiCoachingChange(event.target.checked)} className="mt-1 h-4 w-4 accent-teal" />
              <span>
                <span className="block text-sm font-semibold text-slate-700">Add optional AI coaching</span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">Uses your configured AI coach for tailored suggestions.</span>
              </span>
            </label>
          </details>

          <button type="button" onClick={onAnalyze} disabled={isLoading || !hasJobDescription} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-300">
            <Sparkles size={16} />
            {isLoading ? "Analyzing..." : "Generate full readiness report"}
          </button>
        </aside>
      </div>
    </section>
  );
}

function MatchPreview({ preview }) {
  const matchedSkills = preview.skills.matched.slice(0, 5);
  const missingSkills = preview.skills.missing.slice(0, 5);
  const missingPriorities = new Map((preview.skills.missing_details || []).map((item) => [item.name, item.priority]));

  return (
    <section className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-teal">Quick resume comparison</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <ScoreSummary label="Match score" value={preview.summary.match_score} />
        <ScoreSummary label="Readiness" value={preview.summary.readiness_score} />
      </div>
      <SkillSummary label="Matched skills" skills={matchedSkills} emptyText="No clear matches yet" tone="emerald" />
      <SkillSummary label="Missing skills" skills={missingSkills} priorities={missingPriorities} emptyText="No missing skills found" tone="amber" />
    </section>
  );
}

function ScoreSummary({ label, value }) {
  return (
    <div className="rounded-md border border-emerald-100 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}%</p>
    </div>
  );
}

function SkillSummary({ label, skills, priorities = new Map(), emptyText, tone }) {
  const className = tone === "emerald" ? "bg-white text-teal" : "bg-amber-100 text-amber-900";
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {skills.length
          ? skills.map((skill) => <span key={skill} className={`rounded px-2 py-1 text-xs font-semibold ${className}`}>{skill}{priorities.get(skill) === "low" ? " · optional" : ""}</span>)
          : <span className="text-xs text-slate-500">{emptyText}</span>}
      </div>
    </div>
  );
}

function SearchField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none" placeholder={placeholder} />
    </label>
  );
}

function NumberField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-2 py-2 text-sm focus:border-teal focus:outline-none" placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none">
        {options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}
      </select>
    </label>
  );
}

function JobCard({ job, selected, onSelect, onSave }) {
  return (
    <article className={`rounded-md border bg-white p-4 shadow-panel ${selected ? "border-teal" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-ink">{job.title}</h4>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{job.source}</span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Building2 size={15} />{job.company || "Company not listed"}</p>
          <p className="mt-1 flex items-center gap-2 text-sm text-slate-600"><MapPin size={15} />{job.location || "Location not listed"}</p>
          {(job.salary_min || job.salary_max) && <p className="mt-1 text-sm font-semibold text-emerald-700">{formatSalary(job.salary_min, job.salary_max)}</p>}
          {job.salary_text && !job.salary_min && !job.salary_max && <p className="mt-1 text-sm font-semibold text-emerald-700">{job.salary_text}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.workplace && <JobTag>{formatLabel(job.workplace)}</JobTag>}
            {job.employment_type && <JobTag>{formatLabel(job.employment_type)}</JobTag>}
            {job.experience_level && <JobTag>{formatLabel(job.experience_level)}</JobTag>}
          </div>
        </div>
        <div className="flex gap-2">
          {job.url && <a href={job.url} target="_blank" rel="noreferrer" title="Open posting" className="rounded-md border border-slate-300 p-2 text-slate-600 hover:border-teal hover:text-teal"><ExternalLink size={16} /></a>}
          <button type="button" title="Save job" onClick={onSave} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:border-teal hover:text-teal"><Bookmark size={16} /></button>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{job.description}</p>
      <button type="button" onClick={onSelect} className={`mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${selected ? "bg-emerald-50 text-teal" : "bg-teal text-white hover:bg-teal/90"}`}>
        {selected ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        {selected ? "Selected for comparison" : "Compare with resume"}
      </button>
    </article>
  );
}

function JobTag({ children }) {
  return <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{children}</span>;
}

function formatLabel(value) {
  return value.replaceAll("_", "-").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getActiveFilters(jobSearch) {
  return [
    jobSearch.workplace !== "any" ? formatLabel(jobSearch.workplace) : "",
    jobSearch.skills ? `Skills: ${jobSearch.skills}` : "",
    jobSearch.experience_level !== "any" ? formatLabel(jobSearch.experience_level) : "",
    jobSearch.employment_type !== "any" ? formatLabel(jobSearch.employment_type) : "",
    jobSearch.salary_min ? `Min salary: ${jobSearch.salary_min}` : "",
    jobSearch.salary_max ? `Max salary: ${jobSearch.salary_max}` : "",
  ].filter(Boolean);
}

function formatSalary(minimum, maximum) {
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (minimum && maximum) return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
  if (minimum) return `From ${formatter.format(minimum)}`;
  return `Up to ${formatter.format(maximum)}`;
}

function LoadingResults() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-md border border-slate-200 bg-white p-4"><div className="h-4 w-48 rounded bg-slate-200" /><div className="mt-4 h-3 w-64 rounded bg-slate-100" /><div className="mt-6 h-3 w-full rounded bg-slate-100" /></div>)}
    </div>
  );
}

function Notice({ tone, children }) {
  const className = tone === "sky" ? "border-sky-200 bg-sky-50 text-sky-800" : "border-amber-200 bg-amber-50 text-amber-800";
  return <p className={`mt-4 rounded-md border px-3 py-2 text-sm ${className}`}>{children}</p>;
}
