import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Download,
  FileClock,
  Gauge,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stages = [
  ["saved", "Saved"],
  ["preparing", "Preparing"],
  ["applied", "Applied"],
  ["interview", "Interview"],
  ["offer", "Offer"],
  ["rejected", "Rejected"],
  ["archived", "Archived"],
];

export default function HistoryScreen({
  history,
  savedJobs,
  resumeVersions,
  onOpenReport,
  onUseJob,
  onDeleteJob,
  onDeleteReport,
  onUpdateJob,
  onGeneratePacketDrafts = async () => ({}),
  onExportJobs = async () => {},
  onImportJobs = async () => ({}),
}) {
  const [editingJobId, setEditingJobId] = useState(null);
  const [draft, setDraft] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingDrafts, setIsGeneratingDrafts] = useState(false);
  const [useAiDrafts, setUseAiDrafts] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [packetNotice, setPacketNotice] = useState("");
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const [comparisonIds, setComparisonIds] = useState([]);
  const [importNotice, setImportNotice] = useState("");
  const packetEditorRef = useRef(null);
  const attentionJobs = savedJobs.filter(needsAttention);
  const visibleJobs = savedJobs
    .filter((job) => matchesQuery(job, query))
    .filter((job) => !attentionOnly || needsAttention(job));
  const comparisonJobs = comparisonIds.map((id) => savedJobs.find((job) => job.id === id)).filter(Boolean);
  const analytics = trackerAnalytics(savedJobs, history);

  useEffect(() => {
    if (editingJobId) {
      packetEditorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }
  }, [editingJobId]);

  function openEditor(job) {
    setEditingJobId(job.id);
    setSaveError("");
    setPacketNotice("");
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
      cover_letter: job.cover_letter || "",
      follow_up_email: job.follow_up_email || "",
      personal_pitch: job.personal_pitch || "",
      interview_notes: job.interview_notes || "",
      tasks: job.tasks || [],
      star_stories: job.star_stories || [],
    });
  }

  async function saveEditor(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError("");
    try {
      await onUpdateJob(editingJobId, normalizedDraft(draft));
      setPacketNotice("Application packet saved.");
      setEditingJobId(null);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function generateDrafts() {
    setIsGeneratingDrafts(true);
    setSaveError("");
    try {
      const result = await onGeneratePacketDrafts(editingJobId, useAiDrafts);
      setDraft((current) => ({
        ...current,
        cover_letter: result.job?.cover_letter || current.cover_letter,
        follow_up_email: result.job?.follow_up_email || current.follow_up_email,
      }));
      setPacketNotice(result.detail || "Starter drafts created.");
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setIsGeneratingDrafts(false);
    }
  }

  async function importCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const result = await onImportJobs(file);
      setImportNotice(result.detail);
    } catch (error) {
      setImportNotice(error.message);
    } finally {
      event.target.value = "";
    }
  }

  function toggleComparison(jobId) {
    setComparisonIds((currentIds) => currentIds.includes(jobId)
      ? currentIds.filter((id) => id !== jobId)
      : [...currentIds, jobId].slice(-3));
  }

  return (
    <section className="mx-auto max-w-[1600px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Application tracker</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Move every opportunity forward</h2>
          <p className="mt-2 max-w-3xl text-slate-600">Track applications, keep tailored materials together, and prepare for each next step.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv,text/csv" onChange={importCsv} className="sr-only" />
          </label>
          <button type="button" onClick={onExportJobs} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>
      {importNotice && <p className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{importNotice}</p>}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TrackerMetric label="Tracked jobs" value={savedJobs.length} />
        <TrackerMetric label="Needs attention" value={attentionJobs.length} tone={attentionJobs.length ? "amber" : "teal"} />
        <TrackerMetric label="Response rate" value={`${analytics.responseRate}%`} />
        <TrackerMetric label="Average readiness" value={`${analytics.averageReadiness}%`} />
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

      {comparisonJobs.length > 0 && (
        <ComparisonPanel jobs={comparisonJobs} onClear={() => setComparisonIds([])} />
      )}

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
                    <article key={job.id} className={`rounded-md border bg-white p-3 shadow-sm ${editingJobId === job.id ? "border-teal ring-2 ring-teal/10" : "border-slate-200"}`}>
                      <label className="flex items-start gap-2">
                        <input type="checkbox" aria-label={`Compare ${job.title}`} checked={comparisonIds.includes(job.id)} onChange={() => toggleComparison(job.id)} className="mt-1 h-3.5 w-3.5 shrink-0 accent-teal" />
                        <span className="text-sm font-semibold leading-5 text-ink">{job.title}</span>
                      </label>
                      <p className="mt-1 truncate text-xs text-slate-500">{job.company || "Company not listed"}</p>
                      <JobNextAction job={job} />
                      {incompleteTaskCount(job) > 0 && <p className="mt-2 text-xs font-semibold text-sky-700">{incompleteTaskCount(job)} open task{incompleteTaskCount(job) === 1 ? "" : "s"}</p>}
                      {(job.recruiter_name || job.resume_version_title) && <p className="mt-2 truncate text-xs text-slate-500">{job.recruiter_name ? `Recruiter: ${job.recruiter_name}` : `Resume: ${job.resume_version_title}`}</p>}
                      <select value={job.status} onChange={(event) => onUpdateJob(job.id, { status: event.target.value })} className="mt-3 w-full rounded border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-600 focus:border-teal focus:outline-none">
                        {stages.map(([value, stageLabel]) => <option key={value} value={value}>{stageLabel}</option>)}
                      </select>
                      <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2">
                        <button type="button" title="Open application packet" aria-pressed={editingJobId === job.id} onClick={() => openEditor(job)} className={`rounded p-2 hover:bg-emerald-50 hover:text-teal ${editingJobId === job.id ? "bg-emerald-50 text-teal" : "text-slate-500"}`}><Pencil size={15} /></button>
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
        <form ref={packetEditorRef} onSubmit={saveEditor} className="mt-3 scroll-mt-24 space-y-5 rounded-md border border-teal/30 bg-white p-5 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-ink">Application packet</h3>
              <p className="mt-1 text-sm text-slate-500">Keep the tailored resume, reminders, drafts, and interview preparation with this role.</p>
            </div>
            <button type="button" title="Close editor" onClick={() => setEditingJobId(null)} className="rounded p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
          </div>

          <section>
            <h4 className="text-sm font-semibold text-ink">Application details</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
            <TextArea label="Notes" value={draft.notes} onChange={(value) => setDraft({ ...draft, notes: value })} placeholder="Contacts, decisions, and useful context..." />
          </section>

          <PacketTasks tasks={draft.tasks} onChange={(tasks) => setDraft({ ...draft, tasks })} />

          <section className="border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-ink">Application documents</h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">Starter drafts are templates. Review and personalize them before sending.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <input type="checkbox" checked={useAiDrafts} onChange={(event) => setUseAiDrafts(event.target.checked)} className="h-4 w-4 accent-teal" />
                  Use optional AI coach
                </label>
                <button type="button" onClick={generateDrafts} disabled={isGeneratingDrafts} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-teal hover:text-teal disabled:text-slate-300">
                  <Sparkles size={15} />
                  {isGeneratingDrafts ? "Creating drafts..." : "Create starter drafts"}
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <TextArea label="Cover letter draft" value={draft.cover_letter} onChange={(value) => setDraft({ ...draft, cover_letter: value })} />
              <TextArea label="Follow-up email draft" value={draft.follow_up_email} onChange={(value) => setDraft({ ...draft, follow_up_email: value })} />
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h4 className="text-sm font-semibold text-ink">Interview preparation</h4>
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <TextArea label="Personal pitch" value={draft.personal_pitch} onChange={(value) => setDraft({ ...draft, personal_pitch: value })} placeholder="Summarize why your real experience fits this role." />
              <TextArea label="Interview notes" value={draft.interview_notes} onChange={(value) => setDraft({ ...draft, interview_notes: value })} placeholder="Company research, questions to ask, and practice notes." />
            </div>
            <StarStories stories={draft.star_stories} onChange={(starStories) => setDraft({ ...draft, star_stories: starStories })} />
          </section>

          {packetNotice && <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{packetNotice}</p>}
          {saveError && <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>}
          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-400">
              {isSaving ? "Saving..." : "Save application packet"}
            </button>
          </div>
        </form>
      )}

      <ReportHistory history={history} onOpenReport={onOpenReport} onDeleteReport={onDeleteReport} />
    </section>
  );
}

function ComparisonPanel({ jobs, onClear }) {
  return (
    <section className="mt-5 rounded-md border border-sky-200 bg-sky-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Compare opportunities</h3>
          <p className="mt-1 text-xs text-slate-600">Select up to three tracked roles to compare practical details.</p>
        </div>
        <button type="button" onClick={onClear} className="rounded p-2 text-slate-500 hover:bg-white"><X size={16} /></button>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {jobs.map((job) => (
          <article key={job.id} className="rounded-md border border-sky-200 bg-white p-3 text-sm">
            <p className="font-semibold text-ink">{job.title}</p>
            <p className="mt-1 text-xs text-slate-500">{job.company || "Company not listed"}</p>
            <dl className="mt-3 space-y-2 text-xs">
              <ComparisonRow label="Location" value={job.location || "Not listed"} />
              <ComparisonRow label="Salary" value={job.salary_text || "Not listed"} />
              <ComparisonRow label="Workplace" value={formatLabel(job.workplace) || "Not listed"} />
              <ComparisonRow label="Open tasks" value={incompleteTaskCount(job)} />
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function PacketTasks({ tasks, onChange }) {
  function addTask() {
    onChange([...tasks, { id: createId("task"), title: "", due_date: "", completed: false }]);
  }
  function updateTask(index, values) {
    onChange(tasks.map((task, taskIndex) => taskIndex === index ? { ...task, ...values } : task));
  }
  return (
    <section className="border-t border-slate-200 pt-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-ink">Tasks and reminders</h4>
          <p className="mt-1 text-xs text-slate-500">Turn your next steps into a short, useful checklist.</p>
        </div>
        <button type="button" onClick={addTask} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-700 hover:border-teal hover:text-teal"><Plus size={14} />Add task</button>
      </div>
      <div className="mt-3 space-y-2">
        {tasks.map((task, index) => (
          <div key={task.id} className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 p-2">
            <input type="checkbox" aria-label={`Complete task ${index + 1}`} checked={task.completed} onChange={(event) => updateTask(index, { completed: event.target.checked })} className="h-4 w-4 accent-teal" />
            <input value={task.title} onChange={(event) => updateTask(index, { title: event.target.value })} className="min-w-[180px] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none" placeholder="Send follow-up email" />
            <input type="date" value={task.due_date || ""} onChange={(event) => updateTask(index, { due_date: event.target.value })} className="rounded border border-slate-300 px-2 py-1 text-xs" />
            <button type="button" title="Remove task" onClick={() => onChange(tasks.filter((_task, taskIndex) => taskIndex !== index))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
          </div>
        ))}
        {!tasks.length && <p className="rounded-md border border-dashed border-slate-300 p-3 text-center text-xs text-slate-500">No packet tasks yet.</p>}
      </div>
    </section>
  );
}

function StarStories({ stories, onChange }) {
  function addStory() {
    onChange([...stories, { id: createId("story"), title: "", notes: "" }]);
  }
  function updateStory(index, values) {
    onChange(stories.map((story, storyIndex) => storyIndex === index ? { ...story, ...values } : story));
  }
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">STAR stories</p>
        <button type="button" onClick={addStory} className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-teal hover:bg-emerald-50"><Plus size={13} />Add story</button>
      </div>
      <div className="mt-2 grid gap-2 xl:grid-cols-2">
        {stories.map((story, index) => (
          <div key={story.id} className="rounded-md border border-slate-200 p-3">
            <div className="flex gap-2">
              <input value={story.title} onChange={(event) => updateStory(index, { title: event.target.value })} className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold outline-none" placeholder="Dashboard project example" />
              <button type="button" title="Remove STAR story" onClick={() => onChange(stories.filter((_story, storyIndex) => storyIndex !== index))} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
            </div>
            <textarea value={story.notes} onChange={(event) => updateStory(index, { notes: event.target.value })} className="mt-2 min-h-20 w-full resize-y rounded border border-slate-300 px-2 py-2 text-xs leading-5 focus:border-teal focus:outline-none" placeholder="Situation, task, action, and measurable result." />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportHistory({ history, onOpenReport, onDeleteReport }) {
  return (
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

function ComparisonRow({ label, value }) {
  return <div className="flex justify-between gap-3"><dt className="text-slate-500">{label}</dt><dd className="text-right font-semibold text-slate-700">{value}</dd></div>;
}

function normalizedDraft(draft) {
  return {
    ...draft,
    applied_at: draft.applied_at || null,
    follow_up_date: draft.follow_up_date || null,
    interview_date: draft.interview_date || null,
    resume_version_id: draft.resume_version_id || null,
    tasks: draft.tasks.filter((task) => task.title.trim()).map((task) => ({ ...task, due_date: task.due_date || null })),
    star_stories: draft.star_stories.filter((story) => story.title.trim()),
  };
}

function trackerAnalytics(savedJobs, history) {
  const submittedJobs = savedJobs.filter((job) => ["applied", "interview", "offer", "rejected"].includes(job.status));
  const responses = submittedJobs.filter((job) => ["interview", "offer"].includes(job.status));
  const averageReadiness = history.length
    ? Math.round(history.reduce((total, item) => total + (item.summary.readiness_score || 0), 0) / history.length)
    : 0;
  return {
    responseRate: submittedJobs.length ? Math.round((responses.length / submittedJobs.length) * 100) : 0,
    averageReadiness,
  };
}

function incompleteTaskCount(job) {
  return (job.tasks || []).filter((task) => !task.completed).length;
}

function matchesQuery(job, query) {
  if (!query.trim()) return true;
  const searchableText = [job.title, job.company, job.location, job.recruiter_name, job.notes].join(" ").toLowerCase();
  return searchableText.includes(query.trim().toLowerCase());
}

function needsAttention(job) {
  const action = nextAction(job);
  const hasDueTask = (job.tasks || []).some((task) => !task.completed && task.due_date && task.due_date <= dateDaysFromNow(7));
  return hasDueTask || Boolean(action && (action.missing || action.date <= dateDaysFromNow(7)));
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
  return formatLocalDate(new Date());
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

function TextArea({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-teal focus:outline-none" placeholder={placeholder} />
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

function formatLabel(value) {
  return value ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
