import {
  AlertTriangle,
  Bell,
  BellOff,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  FileClock,
  Gauge,
  Trash2,
} from "lucide-react";

const activeStages = new Set(["preparing", "applied", "interview", "offer"]);

export default function DashboardScreen({ history, savedJobs, searchAlerts, onNavigate, onToggleAlert, onUpdateAlert, onDeleteAlert }) {
  const activeJobs = savedJobs.filter((job) => activeStages.has(job.status));
  const interviews = savedJobs.filter((job) => job.status === "interview");
  const upcoming = savedJobs
    .filter((job) => job.follow_up_date || job.interview_date)
    .sort((first, second) => nextDate(first).localeCompare(nextDate(second)))
    .slice(0, 5);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Progress dashboard</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Keep your search moving</h2>
          <p className="mt-2 max-w-2xl text-slate-600">See your pipeline, upcoming follow-ups, search alerts, and readiness progress in one place.</p>
        </div>
        <button type="button" onClick={() => onNavigate("history")} className="rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
          Open application tracker
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active applications" value={activeJobs.length} icon={BriefcaseBusiness} />
        <MetricCard label="Interviews" value={interviews.length} icon={CalendarClock} />
        <MetricCard label="Average readiness" value={`${averageReadiness(history)}%`} icon={Gauge} />
        <MetricCard label="Saved scans" value={history.length} icon={FileClock} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal"><CalendarClock size={18} /></span>
            <div>
              <h3 className="font-semibold text-ink">Upcoming actions</h3>
              <p className="text-sm text-slate-500">Follow-ups and interviews that deserve attention.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {upcoming.length ? upcoming.map((job) => (
              <article key={job.id} className="flex items-center justify-between gap-4 rounded-md border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-ink">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{job.company || "Company not listed"} · {labelStage(job.status)}</p>
                </div>
                <UpcomingAction job={job} />
              </article>
            )) : <EmptyState text="Add follow-up or interview dates in the tracker to build your next-action list." />}
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700"><Bell size={18} /></span>
            <div>
              <h3 className="font-semibold text-ink">Saved search alerts</h3>
              <p className="text-sm text-slate-500">Daily or weekly searches you want to revisit.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {searchAlerts.length ? searchAlerts.map((alert) => (
              <article key={alert.id} className="rounded-md border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{alert.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{alert.workplace === "any" ? "Any workplace" : alert.workplace.replace("_", "-")}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" title={alert.is_active ? "Pause alert" : "Enable alert"} onClick={() => onToggleAlert(alert)} className="rounded p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                      {alert.is_active ? <Bell size={16} /> : <BellOff size={16} />}
                    </button>
                    <button type="button" title="Delete alert" onClick={() => onDeleteAlert(alert.id)} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <label className="mt-3 block">
                  <span className="sr-only">Alert frequency</span>
                  <select value={alert.frequency} onChange={(event) => onUpdateAlert(alert, { frequency: event.target.value })} className="rounded-md border border-slate-300 px-2 py-2 text-xs font-semibold text-slate-600 focus:border-teal focus:outline-none">
                    <option value="daily">Daily alert</option>
                    <option value="weekly">Weekly alert</option>
                  </select>
                </label>
              </article>
            )) : <EmptyState text="Save a search from the Jobs page to create your first alert." />}
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

function EmptyState({ text }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <ChartNoAxesCombined size={22} className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function averageReadiness(history) {
  if (!history.length) return 0;
  return Math.round(history.reduce((total, item) => total + (item.summary.readiness_score || 0), 0) / history.length);
}

function nextDate(job) {
  return nextAction(job)?.date || "9999-12-31";
}

function UpcomingAction({ job }) {
  const action = nextAction(job);
  if (!action) return null;
  const overdue = action.date < today();
  return (
    <div className="text-right text-sm">
      <p className={`flex items-center justify-end gap-1 font-semibold ${overdue ? "text-rose-600" : "text-teal"}`}>
        {overdue && <AlertTriangle size={14} />}
        {overdue ? `Overdue ${action.label.toLowerCase()}` : action.label}
      </p>
      <p className={`mt-1 ${overdue ? "text-rose-600" : "text-slate-500"}`}>{formatDate(action.date)}</p>
    </div>
  );
}

function nextAction(job) {
  return [
    { label: "Interview", date: job.interview_date },
    { label: "Follow up", date: job.follow_up_date },
  ]
    .filter((action) => action.date)
    .sort((first, second) => first.date.localeCompare(second.date))[0];
}

function today() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function labelStage(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
