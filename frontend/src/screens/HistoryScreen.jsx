import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CalendarDays,
  FileClock,
  Gauge,
  Trash2,
} from "lucide-react";

export default function HistoryScreen({ history, savedJobs, onOpenReport, onUseJob, onDeleteJob, onDeleteReport }) {
  return (
    <section className="mx-auto max-w-7xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Saved workspace</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">Pick up where you left off</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Reopen readiness reports and reuse saved postings for your next resume comparison.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard label="Saved reports" value={history.length} icon={FileClock} />
        <MetricCard label="Saved jobs" value={savedJobs.length} icon={Bookmark} />
        <MetricCard label="Best readiness" value={`${bestReadiness(history)}%`} icon={Gauge} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal">
              <FileClock size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-ink">Report history</h3>
              <p className="text-sm text-slate-500">Previous resume scans and readiness scores.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {history.length ? history.map((item) => (
              <article key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-ink">{item.target_role || "Target role"}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <CalendarDays size={15} />
                    {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-teal">{item.summary.readiness_score}%</p>
                    <p className="text-xs font-semibold text-slate-500">Readiness</p>
                  </div>
                  <button type="button" title="Open report" onClick={() => onOpenReport(item)} className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-teal"><ArrowRight size={17} /></button>
                  <button type="button" title="Delete report" onClick={() => onDeleteReport(item.id)} className="rounded-md p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                </div>
              </article>
            )) : <EmptyState icon={FileClock} text="Your generated reports will appear here." />}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700">
              <BriefcaseBusiness size={18} />
            </span>
            <div>
              <h3 className="font-semibold text-ink">Saved jobs</h3>
              <p className="text-sm text-slate-500">Postings you want to revisit or analyze.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {savedJobs.length ? savedJobs.map((job) => (
              <article key={job.id} className="rounded-md border border-slate-200 p-4">
                <p className="font-semibold text-ink">{job.title}</p>
                <p className="mt-1 text-sm text-slate-600">{job.company || "Saved posting"}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => onUseJob(job)} className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90">
                    Use for analysis
                    <ArrowRight size={15} />
                  </button>
                  <button type="button" title="Remove saved job" onClick={() => onDeleteJob(job.id)} className="rounded-md border border-rose-200 p-2 text-rose-600 hover:bg-rose-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            )) : <EmptyState icon={Bookmark} text="Save job postings to reuse them later." />}
          </div>
        </section>
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <Icon size={18} className="text-teal" />
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
    </article>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <Icon size={22} className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function bestReadiness(history) {
  return history.reduce((best, item) => Math.max(best, item.summary.readiness_score || 0), 0);
}

function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
