import {
  AlertCircle,
  ArrowRight,
  BellPlus,
  BookmarkPlus,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  FileSearch,
  Gauge,
  Link2,
  Layers3,
  ListChecks,
  MapPin,
  PanelsTopLeft,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Target,
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
  roleInsights,
  onJobSearch,
  onSelectJob,
  onImportJobUrl,
  isSearchingJobs,
  jobSearchError,
  jobSearchNotice,
  onSaveJob,
  onOpenTracker = () => {},
  onCreateSearchAlert,
  onRelatedTitleSelect = () => {},
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
  const [comparisonJobs, setComparisonJobs] = useState([]);
  const hasJobDescription = jobDescription.trim().length > 0;
  const totalPages = pagination.total_pages || 1;
  const activeFilters = getActiveFilters(jobSearch);

  function clearFilters() {
    onJobSearchChange({
      ...jobSearch,
      source: "all",
      workplace: "any",
      skills: "",
      excluded_keywords: "",
      experience_level: "any",
      employment_type: "any",
      salary_min: "",
      salary_max: "",
      page: 1,
    });
  }

  function toggleComparison(job) {
    setComparisonJobs((currentJobs) => {
      const isSelected = currentJobs.some((item) => item.id === job.id);
      if (isSelected) {
        return currentJobs.filter((item) => item.id !== job.id);
      }
      return currentJobs.length < 3 ? [...currentJobs, job] : currentJobs;
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
      <WorkflowSteps />

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
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            <SelectField label="Website" value={jobSearch.source || "all"} onChange={(value) => onJobSearchChange({ ...jobSearch, source: value, page: 1 })} options={[
              ["all", "All websites"],
              ["remotive", "Remotive"],
              ["arbeitnow", "Arbeitnow"],
              ["adzuna", "Adzuna"],
              ["jooble", "Jooble"],
              ["sample", "Sample demo"],
            ]} />
            <SelectField label="Workplace" value={jobSearch.workplace} onChange={(value) => onJobSearchChange({ ...jobSearch, workplace: value, page: 1 })} options={[
              ["any", "Any workplace"],
              ["remote", "Remote"],
              ["hybrid", "Hybrid"],
              ["on_site", "On-site"],
            ]} />
            <SearchField label="Skills" value={jobSearch.skills} onChange={(value) => onJobSearchChange({ ...jobSearch, skills: value, page: 1 })} placeholder="Python SQL" />
            <SearchField label="Exclude keywords" value={jobSearch.excluded_keywords} onChange={(value) => onJobSearchChange({ ...jobSearch, excluded_keywords: value, page: 1 })} placeholder="senior, unpaid" />
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
        {roleInsights?.postings_analyzed > 0 && <RoleInsights insights={roleInsights} onSelectTitle={onRelatedTitleSelect} />}
      </section>

      {comparisonJobs.length > 0 && (
        <JobComparison jobs={comparisonJobs} onRemove={toggleComparison} onClear={() => setComparisonJobs([])} />
      )}

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
                <JobCard
                  key={job.id || `${job.title}-${job.company}`}
                  job={job}
                  selected={selectedJob?.id === job.id}
                  comparisonSelected={comparisonJobs.some((item) => item.id === job.id)}
                  comparisonLimitReached={comparisonJobs.length >= 3}
                  onSelect={() => onSelectJob(job)}
                  onSave={() => onSaveJob(job)}
                  onToggleComparison={() => toggleComparison(job)}
                />
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

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-panel xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto xl:overscroll-contain">
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
                  {selectedJob.url && (
                    <a href={selectedJob.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex max-w-full items-center gap-1 text-xs font-semibold text-teal hover:underline">
                      <ExternalLink size={13} />
                      Open source posting
                    </a>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-emerald-200 pt-3">
                <button type="button" onClick={() => onSaveJob(selectedJob)} className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-xs font-semibold text-white hover:bg-teal/90">
                  <BookmarkPlus size={15} />
                  Add to tracker
                </button>
                <button type="button" onClick={onOpenTracker} className="inline-flex items-center gap-2 rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs font-semibold text-teal hover:bg-emerald-100">
                  <ListChecks size={15} />
                  Open tracker
                </button>
              </div>
            </div>
          )}

          {selectedJob?.description_is_partial && (
            <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
              <p className="font-bold">This provider shared a shortened excerpt</p>
              <p className="mt-1">The quick score is preliminary. Open the posting and paste the full description below before generating your final report.</p>
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
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">Job text used for scoring</summary>
            <p className="mt-2 text-xs leading-5 text-slate-500">CareerFit scores the job description text only. Title, company, location, and source links are kept separately so metadata does not affect the match.</p>
            <textarea value={jobDescription} onChange={(event) => onChange(event.target.value)} className="mt-3 min-h-[180px] w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none" placeholder="Select a job posting or paste its description here..." />
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

function WorkflowSteps() {
  const steps = [
    { icon: Search, label: "Find posting", detail: "Search or import a URL" },
    { icon: FileSearch, label: "Preview fit", detail: "Check score and gaps" },
    { icon: Target, label: "Decide next", detail: "Apply, tailor, or skip" },
  ];

  return (
    <div className="mt-5 grid gap-2 md:grid-cols-3">
      {steps.map(({ icon: Icon, label, detail }, index) => (
        <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-emerald-50 text-teal">
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Step {index + 1}</p>
            <p className="truncate text-sm font-semibold text-ink">{label}</p>
            <p className="truncate text-xs text-slate-500">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MatchPreview({ preview }) {
  const matchedSkills = preview.skills.matched.slice(0, 5);
  const missingSkills = preview.skills.missing.slice(0, 5);
  const missingPriorities = new Map((preview.skills.missing_details || []).map((item) => [item.name, item.priority]));
  const semanticMatches = (preview.semantic_matches || []).slice(0, 2);
  const guidance = getMatchGuidance(preview.summary.match_score);
  const confidence = preview.summary.confidence;
  const breakdown = preview.summary.score_breakdown || {};
  const requirementScore = breakdown.requirement_evidence?.score ?? preview.summary.match_score;
  const skillScore = breakdown.skill_coverage?.score ?? preview.summary.match_score;
  const atsScore = breakdown.ats_preparation?.score ?? preview.summary.readiness_score;
  const requirementsSummary = preview.requirements_summary || {};
  const counts = requirementsSummary.counts || {};
  const topGaps = requirementsSummary.top_gaps || [];
  const topEvidence = requirementsSummary.top_evidence || [];
  const priorityFixes = (preview.priority_fixes || []).slice(0, 3);

  return (
    <section className="mt-4 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal">Quick resume comparison</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">A decision preview using requirement evidence, skills, ATS readiness, and semantic matches.</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-bold ${decisionBadgeClass(preview.summary.match_score)}`}>
            <Gauge size={13} />
            {guidance.shortLabel}
          </span>
        </div>
        {confidence && (
          <div className={`mt-2 rounded border px-2 py-1.5 text-xs leading-5 ${confidenceClassName(confidence.level)}`}>
            <span className="font-bold">{confidence.label}:</span> {confidence.detail}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <ScoreSummary label="Job match" value={preview.summary.match_score} detail="Content fit" />
          <ScoreSummary label="Readiness" value={preview.summary.readiness_score} detail="Match + ATS" />
        </div>
        <DecisionSignals
          confidence={confidence}
          missingSkills={missingSkills.length}
          requirementGaps={(counts.missing || 0) + (counts.weak || 0)}
          partialRequirements={counts.partial || 0}
        />
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Score breakdown</p>
          <div className="mt-3 space-y-3">
            <ScoreMeter label="Requirement evidence" value={requirementScore} />
            <ScoreMeter label="Skill coverage" value={skillScore} />
            <ScoreMeter label="ATS preparation" value={atsScore} />
          </div>
        </div>
        <PriorityFixPreview fixes={priorityFixes} gaps={topGaps} />
        <RequirementSnapshot counts={counts} topGaps={topGaps} topEvidence={topEvidence} />
        <SkillSummary label="Matched skills" skills={matchedSkills} emptyText="No clear skill matches yet" tone="emerald" />
        {semanticMatches.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-semibold text-slate-600">Semantic evidence</p>
            {semanticMatches.map((match) => (
              <article key={`${match.requirement}-${match.evidence}`} className="rounded-md border border-emerald-100 bg-emerald-50/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded bg-white px-2 py-1 text-xs font-bold text-teal">{match.label}</span>
                  <span className="text-xs font-bold text-slate-500">{match.score}%</span>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{match.requirement}</p>
                {match.evidence && <p className="mt-1 text-xs leading-5 text-slate-600">{match.evidence}</p>}
                {match.explanation && <p className="mt-1 text-xs leading-5 text-slate-500">{match.explanation}</p>}
              </article>
            ))}
          </div>
        )}
        <SkillSummary label="Missing or weak skills" skills={missingSkills} priorities={missingPriorities} emptyText="No priority skill gaps detected in the extracted job text" tone="amber" />
        <div className={`mt-3 rounded-md border px-3 py-2 ${guidance.className}`}>
          <p className="text-xs font-bold">{guidance.title}</p>
          <p className="mt-1 text-xs leading-5">{guidance.detail}</p>
        </div>
      </div>
    </section>
  );
}

function RoleInsights({ insights, onSelectTitle }) {
  return (
    <section className="mt-4 border-t border-slate-100 pt-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Layers3 size={16} className="text-teal" />
          <p className="text-sm font-semibold text-slate-700">Role insights from {insights.postings_analyzed} retrieved postings</p>
        </div>
        {insights.partial_postings > 0 && <span className="text-xs font-semibold text-amber-700">{insights.partial_postings} provider excerpt{insights.partial_postings === 1 ? "" : "s"}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {insights.common_skills.length
          ? insights.common_skills.map((skill) => (
            <span key={skill.name} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {skill.name} · {skill.count}/{insights.postings_analyzed}
            </span>
          ))
          : <span className="text-xs text-slate-500">No repeated skills were found in these postings.</span>}
      </div>
      {insights.related_titles?.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Related roles</span>
          {insights.related_titles.map((title) => (
            <button key={title} type="button" onClick={() => onSelectTitle(title)} className="rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-teal hover:border-teal hover:bg-emerald-50">
              {title}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DecisionSignals({ confidence, missingSkills, requirementGaps, partialRequirements }) {
  const signals = [
    {
      icon: confidence?.level === "high" ? ShieldCheck : AlertCircle,
      label: "Confidence",
      value: confidence?.label || "No preview",
      tone: confidence?.level === "high" ? "good" : confidence?.level === "medium" ? "info" : "warn",
    },
    {
      icon: Target,
      label: "Requirement gaps",
      value: `${requirementGaps} open${partialRequirements ? `, ${partialRequirements} partial` : ""}`,
      tone: requirementGaps ? "warn" : "good",
    },
    {
      icon: ListChecks,
      label: "Skill gaps",
      value: missingSkills ? `${missingSkills} to review` : "No priority gaps",
      tone: missingSkills ? "info" : "good",
    },
  ];

  return (
    <div className="mt-3 grid gap-2">
      {signals.map(({ icon: Icon, label, value, tone }) => (
        <div key={label} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded ${signalToneClass(tone)}`}>
            <Icon size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="truncate text-xs font-semibold text-slate-700">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityFixPreview({ fixes, gaps }) {
  const items = fixes.length
    ? fixes.map((fix) => ({
      title: fix.title,
      detail: fix.evidenceNeeded || fix.detail || fix.jobSignal,
      priority: fix.priority,
    }))
    : gaps.slice(0, 2).map((gap) => ({
      title: `Address ${gap.category} requirement`,
      detail: gap.text,
      priority: gap.priority,
    }));

  if (!items.length) return null;

  return (
    <div className="mt-3 rounded-md border border-amber-100 bg-amber-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Review before applying</p>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <article key={`${item.title}-${item.detail}`} className="rounded border border-amber-100 bg-white px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold text-ink">{item.title}</p>
              {item.priority && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">{item.priority}</span>}
            </div>
            {item.detail && <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

function RequirementSnapshot({ counts, topGaps, topEvidence }) {
  const hasSnapshot = Object.values(counts).some(Boolean) || topGaps.length || topEvidence.length;
  if (!hasSnapshot) return null;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="mr-1 text-xs font-bold uppercase tracking-wide text-slate-500">Requirements</p>
        <RequirementCount label="Matched" value={counts.matched || 0} tone="good" />
        <RequirementCount label="Partial" value={counts.partial || 0} tone="info" />
        <RequirementCount label="Weak" value={counts.weak || 0} tone="warn" />
        <RequirementCount label="Missing" value={counts.missing || 0} tone="bad" />
      </div>
      {topGaps.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600">Top gaps</p>
          <div className="mt-2 space-y-2">
            {topGaps.slice(0, 2).map((gap) => (
              <RequirementLine key={`${gap.category}-${gap.text}`} item={gap} />
            ))}
          </div>
        </div>
      )}
      {topEvidence.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-slate-600">Best evidence</p>
          <div className="mt-2 space-y-2">
            {topEvidence.slice(0, 2).map((item) => (
              <RequirementLine key={`${item.category}-${item.text}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementCount({ label, value, tone }) {
  return (
    <span className={`rounded px-1.5 py-1 text-[11px] font-bold ${signalToneClass(tone)}`}>
      {label} {value}
    </span>
  );
}

function RequirementLine({ item }) {
  return (
    <article className="rounded border border-slate-100 bg-slate-50 px-2.5 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{formatLabel(item.category || "requirement")}</span>
        <span className="text-xs font-bold text-slate-500">{item.score}%</span>
      </div>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-700">{item.text}</p>
      {item.evidence && <p className="mt-1 text-xs leading-5 text-slate-500">{item.evidence}</p>}
      {item.match_basis && <p className="mt-1 text-[11px] font-semibold text-teal">{item.match_basis}</p>}
    </article>
  );
}

export function getMatchGuidance(score) {
  if (score < 35) {
    return {
      shortLabel: "Low fit",
      title: "Low alignment with this resume",
      detail: "This resume does not yet show several requirements from the posting. Compare a closer role or add only skills and examples you genuinely have.",
      className: "border-amber-200 bg-amber-50 text-amber-900",
    };
  }
  if (score < 70) {
    return {
      shortLabel: "Tailor first",
      title: "Some relevant evidence found",
      detail: "Review the missing skills and make your most relevant projects or accomplishments easier to find before applying.",
      className: "border-sky-200 bg-sky-50 text-sky-900",
    };
  }
  return {
    shortLabel: "Strong fit",
    title: "Strong alignment found",
    detail: "The resume shows many of this posting's requirements. Generate the full report to refine the remaining gaps.",
    className: "border-emerald-200 bg-white text-emerald-900",
  };
}

function signalToneClass(tone) {
  if (tone === "good") return "bg-emerald-50 text-teal";
  if (tone === "bad") return "bg-rose-50 text-rose-700";
  if (tone === "warn") return "bg-amber-100 text-amber-900";
  return "bg-sky-50 text-sky-700";
}

function decisionBadgeClass(score) {
  if (score >= 70) return "bg-emerald-50 text-teal";
  if (score >= 35) return "bg-sky-50 text-sky-700";
  return "bg-amber-100 text-amber-900";
}

function confidenceClassName(level) {
  if (level === "high") return "border-emerald-200 bg-white text-emerald-900";
  if (level === "medium") return "border-sky-200 bg-sky-50 text-sky-900";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

function ScoreSummary({ label, value, detail }) {
  return (
    <div className="rounded-md border border-emerald-100 bg-white p-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}%</p>
      <p className="mt-1 text-xs text-slate-500">{detail} · {value >= 75 ? "At target" : "Below 75% target"}</p>
    </div>
  );
}

function ScoreMeter({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-teal">{value}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal" style={{ width: `${Math.max(0, Math.min(value, 100))}%` }} />
      </div>
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

function JobCard({ job, selected, comparisonSelected, comparisonLimitReached, onSelect, onSave, onToggleComparison }) {
  return (
    <article className={`rounded-md border bg-white p-4 shadow-panel ${selected ? "border-teal" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-ink">{job.title}</h4>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{job.source}</span>
            {job.description_is_partial && <span className="rounded bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">Excerpt</span>}
            {job.posted_at && <FreshnessBadge postedAt={job.posted_at} />}
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
          <button
            type="button"
            title={comparisonSelected ? "Remove from comparison" : comparisonLimitReached ? "Compare up to three jobs" : "Add to comparison"}
            aria-label={comparisonSelected ? `Remove ${job.title} from comparison` : `Add ${job.title} to comparison`}
            disabled={!comparisonSelected && comparisonLimitReached}
            onClick={onToggleComparison}
            className={`rounded-md border p-2 disabled:cursor-not-allowed disabled:text-slate-300 ${comparisonSelected ? "border-teal bg-emerald-50 text-teal" : "border-slate-300 text-slate-600 hover:border-teal hover:text-teal"}`}
          >
            <PanelsTopLeft size={16} />
          </button>
          <button type="button" title="Add to tracker" onClick={onSave} className="rounded-md border border-slate-300 p-2 text-slate-600 hover:border-teal hover:text-teal"><BookmarkPlus size={16} /></button>
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

function JobComparison({ jobs, onRemove, onClear }) {
  return (
    <section className="mt-5 overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h3 className="font-semibold text-ink">Compare jobs side by side</h3>
          <p className="mt-1 text-xs text-slate-500">Choose up to three roles before deciding where to spend your preparation time.</p>
        </div>
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink">
          <X size={14} />
          Clear comparison
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Salary</th>
              <th className="px-4 py-3">Workplace</th>
              <th className="px-4 py-3">Freshness</th>
              <th className="px-4 py-3"><span className="sr-only">Remove</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => (
              <tr key={job.id || `${job.title}-${job.company}`}>
                <td className="px-4 py-3 font-semibold text-ink">{job.title}</td>
                <td className="px-4 py-3 text-slate-600">{job.company || "Not listed"}</td>
                <td className="px-4 py-3 text-slate-600">{job.location || "Not listed"}</td>
                <td className="px-4 py-3 text-slate-600">{job.salary_text || formatSalary(job.salary_min, job.salary_max) || "Not listed"}</td>
                <td className="px-4 py-3 text-slate-600">{job.workplace ? formatLabel(job.workplace) : "Not listed"}</td>
                <td className="px-4 py-3 text-slate-600">{formatFreshness(job.posted_at)}</td>
                <td className="px-4 py-3">
                  <button type="button" title={`Remove ${job.title}`} onClick={() => onRemove(job)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <X size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FreshnessBadge({ postedAt }) {
  const freshness = formatFreshness(postedAt);
  return (
    <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700">
      <CalendarDays size={13} />
      {freshness}
    </span>
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
    jobSearch.source && jobSearch.source !== "all" ? `Website: ${formatSourceLabel(jobSearch.source)}` : "",
    jobSearch.workplace !== "any" ? formatLabel(jobSearch.workplace) : "",
    jobSearch.skills ? `Skills: ${jobSearch.skills}` : "",
    jobSearch.excluded_keywords ? `Exclude: ${jobSearch.excluded_keywords}` : "",
    jobSearch.experience_level !== "any" ? formatLabel(jobSearch.experience_level) : "",
    jobSearch.employment_type !== "any" ? formatLabel(jobSearch.employment_type) : "",
    jobSearch.salary_min ? `Min salary: ${jobSearch.salary_min}` : "",
    jobSearch.salary_max ? `Max salary: ${jobSearch.salary_max}` : "",
  ].filter(Boolean);
}

function formatSourceLabel(value) {
  return {
    adzuna: "Adzuna",
    remotive: "Remotive",
    arbeitnow: "Arbeitnow",
    jooble: "Jooble",
    sample: "Sample demo",
  }[value] || formatLabel(value);
}

function formatSalary(minimum, maximum) {
  if (!minimum && !maximum) return "";
  const formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (minimum && maximum) return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
  if (minimum) return `From ${formatter.format(minimum)}`;
  return `Up to ${formatter.format(maximum)}`;
}

function formatFreshness(postedAt) {
  if (!postedAt) return "Date not listed";
  const postedDate = new Date(postedAt);
  if (Number.isNaN(postedDate.getTime())) return "Date not listed";
  const days = Math.max(0, Math.floor((Date.now() - postedDate.getTime()) / 86400000));
  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days <= 7) return `Posted ${days} days ago`;
  return `Posted ${postedDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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
