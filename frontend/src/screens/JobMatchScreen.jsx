import { ClipboardPaste, Sparkles } from "lucide-react";

export default function JobMatchScreen({
  jobDescription,
  onChange,
  onLoadSample,
  onAnalyze,
  isLoading,
  error,
}) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Job matching</h2>
          <p className="mt-1 text-slate-600">Paste the target job description and generate an explainable report.</p>
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

