import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  ClipboardCheck,
  Gauge,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

const featureItems = [
  {
    title: "Search real job postings",
    detail: "Look up roles by title, location, and country, then choose a posting to compare.",
    icon: Search,
    tone: "bg-teal text-white",
  },
  {
    title: "Compare your resume",
    detail: "Upload a resume or paste text and see how it lines up with the job description.",
    icon: BriefcaseBusiness,
    tone: "bg-amber text-white",
  },
  {
    title: "Find missing skills",
    detail: "Spot requirements that are missing, weak, partial, or already well supported.",
    icon: Target,
    tone: "bg-indigo-600 text-white",
  },
  {
    title: "Improve before applying",
    detail: "Use recommendations to tailor your resume and strengthen the application.",
    icon: TrendingUp,
    tone: "bg-slate-700 text-white",
  },
  {
    title: "Understand the score",
    detail: "Review clear evidence words and similarity signals behind the readiness report.",
    icon: Gauge,
    tone: "bg-emerald-600 text-white",
  },
  {
    title: "Move quickly",
    detail: "Use samples, uploads, and job search so you can test a role in a few steps.",
    icon: Sparkles,
    tone: "bg-cyan-700 text-white",
  },
];

const workflowItems = [
  { label: "Profile", detail: "Set the target role.", icon: BadgeCheck },
  { label: "Resume", detail: "Paste or upload PDF, DOCX, or TXT.", icon: ClipboardCheck },
  { label: "Jobs", detail: "Search Adzuna or paste a posting.", icon: Search },
  { label: "Report", detail: "Review evidence and readiness.", icon: Gauge },
];

export default function HomeScreen({ onNavigate, onAuthOpen }) {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="grid gap-8 py-4 lg:grid-cols-[1.05fr_0.95fr] lg:py-8">
        <div className="flex min-h-[360px] flex-col justify-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Job search and resume matching
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink lg:text-6xl">
            Find jobs and see how ready your resume is before you apply.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Search for a role, upload your resume, and get a clear match report that shows
            strengths, gaps, and practical ways to improve your application.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate("profile")}
              className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90"
            >
              Start matching
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onAuthOpen("create")}
              className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
            >
              Sign up
            </button>
          </div>
        </div>

        <div className="grid content-center gap-3">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <article key={item.label} className="flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white text-teal shadow-sm">
                  <Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Step {index + 1}
                  </p>
                  <h2 className="text-base font-semibold text-ink">{item.label}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <MetricCard label="Job search" value="Adzuna" detail="Search real postings by title and location" />
        <MetricCard label="Resume formats" value="PDF" detail="Also supports DOCX, TXT, and pasted text" />
        <MetricCard label="Report groups" value="4" detail="Matched, partial, weak, and missing" />
      </div>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Why use CareerFit</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">A faster way to choose and prepare for jobs</h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureItems.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title} className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
                <span className={`grid h-10 w-10 place-items-center rounded-md ${item.tone}`}>
                  <Icon size={19} />
                </span>
                <h3 className="mt-4 text-base font-semibold leading-6 text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            );
          })}
        </div>
      </section>
    </section>
  );
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </article>
  );
}
