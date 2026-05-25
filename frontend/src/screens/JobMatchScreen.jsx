import { BriefcaseBusiness, ClipboardPaste, ExternalLink, Search, Sparkles } from "lucide-react";

export default function JobMatchScreen({
  jobDescription,
  onChange,
  onLoadSample,
  jobSearch,
  onJobSearchChange,
  jobResults,
  onJobSearch,
  onSelectJob,
  isSearchingJobs,
  jobSearchError,
  jobSearchNotice,
  onAnalyze,
  isLoading,
  error,
}) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Job matching</h2>
          <p className="mt-1 text-slate-600">Search Adzuna or paste the target job description.</p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ClipboardPaste size={16} />
          Load sample
        </button>
      </div>

      <section className="mb-5 rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness size={18} className="text-teal" />
          <h3 className="font-semibold text-ink">Find a job posting</h3>
        </div>

        <form onSubmit={onJobSearch} className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_120px_auto]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Job title</span>
            <input
              value={jobSearch.title}
              onChange={(event) => onJobSearchChange({ ...jobSearch, title: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
              placeholder="Junior Data Analyst"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Location</span>
            <input
              value={jobSearch.location}
              onChange={(event) => onJobSearchChange({ ...jobSearch, location: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
              placeholder="New York"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Country</span>
            <select
              value={jobSearch.country}
              onChange={(event) => onJobSearchChange({ ...jobSearch, country: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none"
            >
              <option value="us">US</option>
              <option value="ca">Canada</option>
              <option value="gb">UK</option>
            </select>
          </label>

          <button
            type="submit"
            disabled={isSearchingJobs}
            className="mt-7 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Search size={16} />
            {isSearchingJobs ? "Searching..." : "Search"}
          </button>
        </form>

        {jobSearchError && (
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {jobSearchError}
          </div>
        )}

        {jobSearchNotice && (
          <div className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            {jobSearchNotice}
          </div>
        )}

        {jobResults.length > 0 && (
          <div className="mt-4 grid gap-3">
            {jobResults.map((job) => (
              <article key={job.id || `${job.title}-${job.company}`} className="rounded-md border border-slate-200 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-ink">{job.title}</h4>
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {job.source}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {[job.company, job.location].filter(Boolean).join(" · ") || "Adzuna listing"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ExternalLink size={14} />
                        Open
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectJob(job)}
                      className="rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90"
                    >
                      Use job
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Job description</span>
          <textarea
            value={jobDescription}
            onChange={(event) => onChange(event.target.value)}
            className="mt-3 min-h-[360px] w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none"
            placeholder="Paste the job posting here..."
          />
        </label>

        {error && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Sparkles size={16} />
            {isLoading ? "Analyzing..." : "Generate report"}
          </button>
        </div>
      </div>
    </section>
  );
}
