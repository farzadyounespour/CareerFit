import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  FileClock,
  Gauge,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";

const stages = [
  ["saved", "Saved"],
  ["preparing", "Preparing"],
  ["applied", "Applied"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["archived", "Archived"],
];

export default function HistoryScreen({ history, savedJobs, resumeVersions, onOpenReport, onUseJob, onDeleteJob, onDeleteReport, onUpdateJob }) {
  const [editingJobId, setEditingJobId] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const attentionJobs = savedJobs.filter(needsAttention);
  const visibleJobs = savedJobs
    .filter((job) => matchesQuery(job, query))
    .filter((job) => !attentionOnly || needsAttention(job));

  function openEditor(job) {
    setEditingJobId(job.id);
    setSaveError("");
    setDraft({
      notes: job.notes || "",
      recruiter_name: job.recruiter_name || "",
      recruiter_email: job.recruiter_email || "",
      salary_text: job.salary_text || "",
      follow_up_date: job.follow_up_date || "",
      interview_date: job.interview_date || "",
      applied_at: job.applied_at || "",
      excitement: job.excitement || 3,
      resume_version_id: job.resume_version_id || "",
    });
  }

  async function saveEditor(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    try {
      await onUpdateJob(editingJobId, {
        ...draft,
        applied_at: draft.applied_at || null,
        follow_up_date: draft.follow_up_date || null,
        interview_date: draft.interview_date || null,
        resume_version_id: draft.resume_version_id || null,
      });
      setEditingJobId(null);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-[1600px]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal">Application tracker</p>
        <h2 className="mt-2 text-3xl font-semibold text-ink">Move every opportunity forward</h2>
        <p className="mt-2 max-w-3xl text-slate-600">Track your stage, next follow-up, recruiter details, notes, and the tailored resume used for each application.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <TrackerMetric label="Tracked jobs" value={savedJobs.length} />
        <TrackerMetric label="Needs attention" value={attentionJobs.length} tone={attentionJobs.length ? "amber" : "teal"} />
        <TrackerMetric label="Interviews" value={savedJobs.filter((job) => job.status === "interview").length} />
      </div>

      <section className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-panel">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-teal">
          <Search size={16} className="shrink-0 text-slate-400" />
          <span className="sr-only">Search tracked jobs</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent py-2 text-sm outline-none" placeholder="Search title, company, recruiter, or notes" />
        </label>
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-teal hover:text-teal">
          <input type="checkbox" checked={attentionOnly} onChange={(event) => setAttentionOnly(event.target.checked)} className="h-4 w-4 accent-teal" />
          <AlertTriangle size={15} />
          Needs attention
        </label>
        {(query || attentionOnly) && <button type="button" onClick={() => { setQuery(""); setAttentionOnly(false); }} className="inline-flex items-center gap-1 rounded px-2 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink"><X size={15} />Clear</button>}
      </section>

      <section className="mt-6 overflow-x-auto pb-3">
        <div className="grid min-w-[1320px] grid-cols-7 gap-3">
          {stages.map(([stage, label]) => {
            const jobs = visibleJobs.filter((job) => job.status === stage).sort(compareNextAction);
            return (
              <div key={stage} className="rounded-md border border-slate-200 bg-slate-100/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">{label}</h3>
                  <span className="rounded bg-white px-2 py-1 text-xs font-bold text-slate-500">{jobs.length}</span>
                </div>
                <div className="mt-3 space-y-3">
                  {jobs.map((job) => (
                    <article key={job.id} className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-sm font-semibold leading-5 text-ink">{job.title}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{job.company || "Company not listed"}</p>
                      <JobNextAction job={job} />
                      {(job.recruiter_name || job.resume_version_title) && <p className="mt-2 truncate text-xs text-slate-500">{job.recruiter_name ? `Recruiter: ${job.recruiter_name}` : `Resume: ${job.resume_version_title}`}</p>}
                      <select value={job.status} onChange={(event) => onUpdateJob(job.id, { status: event.target.value })} className="mt-3 w-full rounded border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-600 focus:border-teal focus:outline-none">
                        {stages.map(([value, stageLabel]) => <option key={value} value={value}>{stageLabel}</option>)}
                      </select>
                      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                        <button type="button" title="Edit application" onClick={() => openEditor(job)} className="rounded p-2 text-slate-500 hover:bg-emerald-50 hover:text-teal"><Pencil size={15} /></button>
                        <button type="button" title="Use for analysis" onClick={() => onUseJob(job)} className="rounded p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"><ArrowRight size={15} /></button>
                        <button type="button" title="Delete application" onClick={() => onDeleteJob(job.id)} className="ml-auto rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                      </div>
                    </article>
                  ))}
                  {!jobs.length && <p className="rounded-md border border-dashed border-slate-300 bg-white/70 px-3 py-5 text-center text-xs leading-5 text-slate-400">{query || attentionOnly ? "No matching applications" : "No applications"}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {editingJobId && (
        <form onSubmit={saveEditor} className="mt-3 rounded-md border border-teal/30 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">Application details</h3>
              <p className="mt-1 text-sm text-slate-500">Keep the practical details close to the opportunity.</p>
            </div>
            <button type="button" title="Close editor" onClick={() => setEditingJobId(null)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Recruiter name" value={draft.recruiter_name} onChange={(value) => setDraft({ ...draft, recruiter_name: value })} />
            <TextField label="Recruiter email" type="email" value={draft.recruiter_email} onChange={(value) => setDraft({ ...draft, recruiter_email: value })} />
            <TextField label="Salary notes" value={draft.salary_text} onChange={(value) => setDraft({ ...draft, salary_text: value })} placeholder="$70k-$85k" />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Resume used</span>
              <select value={draft.resume_version_id} onChange={(event) => setDraft({ ...draft, resume_version_id: event.target.value })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none">
                <option value="">Not selected</option>
                {resumeVersions.map((resume) => <option key={resume.id} value={resume.id}>{resume.title}</option>)}
              </select>
            </label>
            <TextField label="Applied date" type="date" value={draft.applied_at} onChange={(value) => setDraft({ ...draft, applied_at: value })} />
            <TextField label="Follow-up date" type="date" value={draft.follow_up_date} onChange={(value) => setDraft({ ...draft, follow_up_date: value })} />
            <TextField label="Interview date" type="date" value={draft.interview_date} onChange={(value) => setDraft({ ...draft, interview_date: value })} />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Interest level</span>
              <select value={draft.excitement} onChange={(event) => setDraft({ ...draft, excitement: Number(event.target.value) })} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none">
                {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value} / 5</option>)}
              </select>
            </label>
          </div>
          <label className="mt-3 block">
            <span className="text-sm font-medium text-slate-700">Notes</span>
            <textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-teal focus:outline-none" placeholder="Follow-up context, interview preparation, contacts, and decisions..." />
          </label>
          {saveError && <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSaving} className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-400">
              {isSaving ? "Saving..." : "Save application details"}
            </button>
          </div>
        </form>
      )}

      <section className="mt-8 rounded-md border border-slate-200 bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700"><FileClock size={18} /></span>
          <div>
            <h3 className="font-semibold text-ink">Readiness report history</h3>
            <p className="text-sm text-slate-500">Reopen previous scans and compare how your preparation improves.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {history.length ? history.map((item, index) => (
            <article key={item.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4">
              <div>
                <p className="font-semibold text-ink">{item.target_role || "Target role"}</p>
                <p className="mt-2 flex items-center gap-2 text-sm text-slate-500"><CalendarDays size={15} />{formatDate(item.created_at)}</p>
              </div>
              <div className="flex items-center gap-3">
                <p className="flex items-center gap-1 text-xl font-bold text-teal"><Gauge size={17} />{item.summary.readiness_score}%</p>
                {scoreChange(history, index) !== null && <p className="text-xs font-semibold text-emerald-600">{formatScoreChange(scoreChange(history, index))}</p>}
                <button type="button" title="Open report" onClick={() => onOpenReport(item)} className="rounded p-2 text-slate-500 hover:bg-emerald-50 hover:text-teal"><ArrowRight size={17} /></button>
                <button type="button" title="Delete report" onClick={() => onDeleteReport(item.id)} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
              </div>
            </article>
          )) : <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:col-span-2"><BriefcaseBusiness size={22} className="mx-auto text-slate-400" /><p className="mt-3 text-sm text-slate-500">Your generated reports will appear here.</p></div>}
        </div>
      </section>
    </section>
  );
}

function TrackerMetric({ label, value, tone = "teal" }) {
  const className = tone === "amber" ? "text-amber" : "text-teal";
  return (
    <article className="rounded-md border border-slate-200 bg-white px-4 py-3 shadow-panel">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${className}`}>{value}</p>
    </article>
  );
}

function JobNextAction({ job }) {
  const action = nextAction(job);
  if (!action) return null;
  if (action.missing) {
    return <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-amber"><AlertTriangle size={13} />Add a follow-up date</p>;
  }
  return (
    <p className={`mt-3 flex items-center gap-1 text-xs font-semibold ${action.overdue ? "text-rose-600" : "text-teal"}`}>
      {action.overdue ? <AlertTriangle size={13} /> : <CalendarDays size={13} />}
      {action.overdue ? "Overdue: " : ""}{action.label} {formatDate(action.date)}
    </p>
  );
}

function matchesQuery(job, query) {
  if (!query.trim()) return true;
  const searchableText = [job.title, job.company, job.location, job.recruiter_name, job.notes].join(" ").toLowerCase();
  return searchableText.includes(query.trim().toLowerCase());
}

function needsAttention(job) {
  const action = nextAction(job);
  return Boolean(action && (action.missing || action.date <= dateDaysFromNow(7)));
}

function compareNextAction(first, second) {
  return sortableNextActionDate(first).localeCompare(sortableNextActionDate(second));
}

function nextAction(job) {
  if (job.interview_date) return { label: "Interview", date: job.interview_date, overdue: job.interview_date < today() };
  if (job.follow_up_date) return { label: "Follow up", date: job.follow_up_date, overdue: job.follow_up_date < today() };
  if (["applied", "interview"].includes(job.status)) return { label: "Follow up", date: "", missing: true };
  return null;
}

function sortableNextActionDate(job) {
  const action = nextAction(job);
  if (action?.missing) return "0000-00-00";
  return action?.date || "9999-12-31";
}

function today() {
  const date = new Date();
  return formatLocalDate(date);
}

function dateDaysFromNow(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function TextField({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none" placeholder={placeholder} />
    </label>
  );
}

function formatDate(value) {
  return new Date(value.includes("T") ? value : `${value}T12:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function scoreChange(history, index) {
  const previous = history[index + 1];
  if (!previous) return null;
  return (history[index].summary.readiness_score || 0) - (previous.summary.readiness_score || 0);
}

function formatScoreChange(change) {
  if (change === 0) return "No change";
  return `${change > 0 ? "+" : ""}${change} since previous scan`;
}
