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
  { label: "Add your resume", detail: "Upload your current resume once.", icon: ClipboardCheck },
  { label: "Choose a job", detail: "Search live postings or paste one.", icon: Search },
  { label: "Review your fit", detail: "See ATS checks, evidence, and gaps.", icon: Gauge },
  { label: "Improve and track", detail: "Tailor your resume and follow up.", icon: BriefcaseBusiness },
];

const reportItems = [
  "ATS structure checks",
  "Matched and missing skills",
  "Requirement-by-requirement evidence",
  "Prioritized resume improvements",
];

const connectedItems = [
  {
    icon: Search,
    title: "Find relevant postings",
    detail: "Search by role, location, workplace preference, salary, and experience level.",
    action: "Search jobs",
    destination: "job",
  },
  {
    icon: Target,
    title: "Tailor with clear evidence",
    detail: "Understand why requirements match and focus your edits on the gaps that matter.",
    action: "Check a resume",
    destination: "resume",
  },
  {
    icon: BellRing,
    title: "Keep applications moving",
    detail: "Save roles, organize each stage, and catch overdue follow-ups before they slip.",
    action: "Open tracker",
    destination: "history",
  },
];

export default function HomeScreen({ onNavigate, onAuthOpen }) {
  return (
    <section>
      <section className="relative mx-auto min-h-[560px] max-w-7xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
        <img
          src="/images/careerfit-hero.png"
          alt="CareerFit workspace showing a resume, job postings, and readiness score"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="careerfit-hero-scrim absolute inset-y-0 left-0 w-full lg:w-[62%]" />
        <div className="relative flex min-h-[560px] max-w-2xl flex-col justify-center px-5 py-10 md:px-10 lg:px-14">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Job search and resume readiness</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink md:text-5xl lg:text-6xl">
            Turn each job posting into a stronger application.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
            Upload your resume, find real roles, and see the most useful improvements before you apply.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => onNavigate("resume")} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
              Check your resume fit
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onNavigate("job")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
              <Search size={16} />
              Search jobs
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Private workspace</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Explainable scores</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Free to start</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">One connected workflow</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Know what to do next at every step</h2>
          <p className="mt-3 leading-7 text-slate-600">Start with the resume you already have. CareerFit helps you use it more intentionally for each opportunity.</p>
        </div>
        <div className="mt-7 grid border-y border-slate-200 bg-white md:grid-cols-4">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="border-b border-slate-200 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:px-0">
          <div className="self-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Useful, not mysterious</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">See what your score means and what to improve first</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              CareerFit keeps the report practical. Review the evidence behind your match, work through a prioritized checklist, and rescan after you update your resume.
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

      <section className="mx-auto max-w-7xl py-12">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">More than a single score</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Keep the whole search in one place</h2>
        </div>
        <div className="mt-7 grid gap-8 lg:grid-cols-3">
          {connectedItems.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border-t-2 border-slate-200 pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700"><Icon size={19} /></span>
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
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 px-4 py-9 md:flex-row md:items-center lg:px-0">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Your job search workspace</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">Save resumes, reports, jobs, and follow-ups together.</h2>
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness report</p>
          <p className="mt-1 font-semibold text-ink">Data Analyst</p>
        </div>
        <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-teal">Resume compared</span>
      </header>
      <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-white p-5">
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[conic-gradient(#0f766e_0deg,#0f766e_280deg,#dbe5ec_280deg,#dbe5ec_360deg)]">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white">
              <span className="text-2xl font-bold text-ink">78%</span>
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-ink">Readiness score</p>
          <p className="mt-1 text-center text-xs leading-5 text-slate-500">A useful starting point for your next edit.</p>
        </div>
        <div className="space-y-3">
          <PreviewMetric label="ATS structure" value="8 of 9 checks" width="88%" tone="emerald" />
          <PreviewMetric label="Skills coverage" value="12 of 16 matched" width="75%" tone="sky" />
          <PreviewMetric label="Requirement evidence" value="6 of 8 supported" width="75%" tone="amber" />
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><Sparkles size={14} className="text-teal" />Next priority</p>
            <p className="mt-2 text-sm font-semibold text-ink">Add evidence for Tableau and stakeholder reporting.</p>
          </div>
        </div>
      </div>
      <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-emerald-600" />Explainable match</span>
        <span className="inline-flex items-center gap-1.5"><FileSearch size={14} className="text-sky-700" />Specific improvements</span>
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
    <div className="rounded-md border border-slate-200 bg-white p-3">
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
