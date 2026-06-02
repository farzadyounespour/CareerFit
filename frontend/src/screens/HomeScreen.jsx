import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

const workflowItems = [
  { label: "Add your resume", detail: "Upload once and review the extracted text.", icon: ClipboardCheck },
  { label: "Choose a posting", detail: "Search live roles, compare options, or paste one.", icon: Search },
  { label: "Review your evidence", detail: "See ATS checks, supported requirements, and gaps.", icon: Gauge },
  { label: "Improve and track", detail: "Tailor the resume and keep follow-ups organized.", icon: BriefcaseBusiness },
];

const capabilityItems = [
  { title: "Live job discovery", detail: "Search, filter, and compare postings", icon: Search },
  { title: "Explainable readiness", detail: "See evidence behind every score", icon: FileSearch },
  { title: "Application workspace", detail: "Save roles, resumes, and follow-ups", icon: BriefcaseBusiness },
];

const reportItems = [
  "ATS preparation checks",
  "Requirement-by-requirement evidence",
  "Matched and missing skills",
  "Prioritized resume improvements",
];

const connectedItems = [
  {
    icon: Search,
    eyebrow: "Discover",
    title: "Find roles worth your time",
    detail: "Search live postings, filter unsuitable roles, compare options side by side, and explore related job titles.",
    action: "Search jobs",
    destination: "job",
  },
  {
    icon: Target,
    eyebrow: "Prepare",
    title: "Focus your next resume edit",
    detail: "Understand which requirements your resume supports and where a specific example could strengthen the application.",
    action: "Check a resume",
    destination: "resume",
  },
  {
    icon: BellRing,
    eyebrow: "Follow through",
    title: "Keep applications moving",
    detail: "Save roles, organize each stage, and catch follow-ups before good opportunities slip past.",
    action: "Open tracker",
    destination: "history",
  },
];

export default function HomeScreen({ onNavigate, onAuthOpen }) {
  return (
    <section>
      <section className="relative mx-auto min-h-[600px] max-w-7xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
        <img
          src="/images/careerfit-hero.png"
          alt="CareerFit workspace showing a resume, job postings, and readiness score"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="careerfit-hero-scrim absolute inset-y-0 left-0 w-full lg:w-[59%]" />
        <div className="relative flex min-h-[600px] max-w-[650px] flex-col justify-center px-6 py-12 md:px-10 lg:px-14">
          <p className="text-sm font-bold uppercase tracking-wide text-teal">CareerFit application workspace</p>
          <h1 className="mt-4 max-w-[590px] text-4xl font-semibold leading-tight text-ink md:text-5xl">
            Prepare a stronger application for every role.
          </h1>
          <p className="mt-5 max-w-[555px] text-lg leading-8 text-slate-700">
            Search real postings, compare your resume with the requirements, and work through the improvements that matter before you apply.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => onNavigate("resume")} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
              Check your resume fit
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onNavigate("job")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
              <Search size={16} />
              Search jobs
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-300/70 pt-5 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Private workspace</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Explainable scores</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Optional AI coaching</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-x border-b border-slate-200 bg-white">
        <div className="grid lg:grid-cols-3">
          {capabilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="flex items-center gap-4 border-b border-slate-200 px-5 py-4 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-emerald-50 text-teal"><Icon size={18} /></span>
                <div>
                  <h2 className="text-sm font-semibold text-ink">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-teal">A focused workflow</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Move from job search to application with a clear next step</h2>
          <p className="mt-3 leading-7 text-slate-600">Start with the resume you already have. CareerFit keeps each decision connected to the role you want.</p>
        </div>
        <div className="mt-8 grid border-y border-slate-200 bg-white lg:grid-cols-4">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="border-b border-slate-200 p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal"><Icon size={19} /></span>
                  <span className="text-sm font-bold text-slate-300">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-semibold text-ink">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[0.88fr_1.12fr] lg:px-0">
          <div className="self-center">
            <p className="text-sm font-bold uppercase tracking-wide text-teal">Useful, not mysterious</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">Know why a role fits and what to improve first</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              CareerFit turns a resume scan into a practical revision plan. Start with the summary, inspect the evidence, and rescan after your edits.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {reportItems.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <BadgeCheck size={18} className="shrink-0 text-emerald-600" />
                  {item}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => onNavigate("resume")} className="mt-7 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-ink/90">
              Upload your resume
              <ArrowRight size={16} />
            </button>
          </div>

          <ReportPreview />
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-14">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-wide text-teal">One connected workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Spend less time switching tools and more time preparing well</h2>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {connectedItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border-t-2 border-slate-200 pt-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700"><Icon size={19} /></span>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.eyebrow}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 leading-7 text-slate-600">{item.detail}</p>
                <button type="button" onClick={() => onNavigate(item.destination)} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal/80">
                  {item.action}
                  <ArrowRight size={15} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 py-10 md:flex-row md:items-center lg:px-0">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-teal">Start with your next opportunity</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Keep resumes, reports, jobs, and follow-ups together.</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Create your workspace, add the resume you already have, and choose a role to evaluate.</p>
          </div>
          <button type="button" onClick={() => onAuthOpen("create")} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
            Create a free workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </section>
  );
}

function ReportPreview() {
  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-slate-50 shadow-panel">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Readiness report</p>
          <p className="mt-1 font-semibold text-ink">Data Analyst · Northstar Analytics</p>
        </div>
        <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-teal">Resume compared</span>
      </header>
      <div className="flex border-b border-slate-200 bg-white px-5">
        <span className="border-b-2 border-teal px-1 py-3 text-xs font-bold text-teal">Overview</span>
        <span className="px-4 py-3 text-xs font-semibold text-slate-500">Requirements</span>
        <span className="px-4 py-3 text-xs font-semibold text-slate-500">ATS preparation</span>
      </div>
      <div className="grid gap-5 p-5 lg:grid-cols-[160px_1fr]">
        <div className="flex flex-col items-center justify-center border-r border-slate-200 pr-5">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#0f766e_0deg,#0f766e_280deg,#dbe5ec_280deg,#dbe5ec_360deg)]">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
              <span className="text-2xl font-bold text-ink">78%</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">Readiness score</p>
          <p className="mt-1 text-center text-xs leading-5 text-slate-500">Strong starting point</p>
        </div>
        <div>
          <div className="grid gap-3 sm:grid-cols-3">
            <PreviewMetric label="ATS checks" value="8 / 9" width="88%" tone="emerald" />
            <PreviewMetric label="Skills" value="12 / 16" width="75%" tone="sky" />
            <PreviewMetric label="Evidence" value="6 / 8" width="75%" tone="amber" />
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Sparkles size={14} className="text-teal" />Next priority</p>
            <p className="mt-2 text-sm font-semibold text-ink">Add a measurable example of stakeholder reporting.</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Your resume mentions Tableau, but the posting also asks for clear communication of business findings.</p>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-5 py-3">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" />Explainable match</span>
          <span className="inline-flex items-center gap-1.5"><FileSearch size={14} className="text-sky-700" />Specific improvements</span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal">View report <ArrowRight size={13} /></span>
      </footer>
    </article>
  );
}

function PreviewMetric({ label, value, width, tone }) {
  const colors = {
    emerald: "bg-emerald-500",
    sky: "bg-sky-500",
    amber: "bg-amber-500",
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="text-slate-600">{label}</span>
        <span className="text-ink">{value}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className={`h-full rounded-full ${colors[tone]}`} style={{ width }} />
      </div>
    </div>
  );
}
