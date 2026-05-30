import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
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
  { label: "Add your resume", detail: "Upload PDF, DOCX, or TXT and review the extracted text.", icon: ClipboardCheck },
  { label: "Choose a job", detail: "Search postings or paste a job description you already found.", icon: Search },
  { label: "Improve your fit", detail: "Review ATS checks, skill gaps, and requirement evidence.", icon: Gauge },
];

const reportItems = [
  "ATS structure checks",
  "Matched and missing skills",
  "Requirement-by-requirement evidence",
  "Practical resume recommendations",
];

export default function HomeScreen({ onNavigate, onAuthOpen }) {
  return (
    <section>
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel lg:grid-cols-[0.95fr_1.3fr]">
        <div className="flex min-h-[520px] flex-col justify-center px-5 py-8 md:px-8 lg:px-12 lg:py-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Job search and resume readiness</p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight text-ink lg:text-6xl">
            Find jobs that fit your experience.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-700">
            Search real postings, compare your resume, and understand exactly what to improve before you apply.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button type="button" onClick={() => onNavigate("profile")} className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
              Check your resume fit
              <ArrowRight size={16} />
            </button>
            <button type="button" onClick={() => onNavigate("job")} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
              <Search size={16} />
              Search jobs
            </button>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Free to try</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Explainable scores</span>
            <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-600" />Real job search</span>
          </div>
        </div>
        <img
          src="/images/careerfit-hero.png"
          alt="CareerFit workspace showing a resume, job postings, and readiness score"
          className="h-full min-h-[360px] w-full object-cover object-center lg:min-h-[520px]"
        />
      </div>

      <section className="mx-auto max-w-7xl py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">From job search to a stronger application</h2>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {workflowItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-teal"><Icon size={20} /></span>
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
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_0.9fr] lg:px-0">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Resume scan report</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink">See what a recruiter and ATS may notice first</h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-600">
              CareerFit does more than show one percentage. It explains which requirements are supported, where your evidence is weak, and which resume details need attention.
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

          <div className="grid content-center gap-3 sm:grid-cols-2">
            <InsightCard icon={ShieldCheck} label="ATS structure" value="9 checks" detail="Contact details, sections, bullets, and length" tone="emerald" />
            <InsightCard icon={Target} label="Skills coverage" value="Clear gaps" detail="Matched and missing job-specific skills" tone="amber" />
            <InsightCard icon={FileSearch} label="Evidence" value="Per requirement" detail="See why each requirement earned its score" tone="sky" />
            <InsightCard icon={Sparkles} label="Next steps" value="Actionable" detail="Focus your next resume edits where they matter" tone="indigo" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 py-10 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-sky-50 text-sky-700"><BriefcaseBusiness size={20} /></span>
          <h2 className="mt-4 text-xl font-semibold text-ink">Search jobs without leaving CareerFit</h2>
          <p className="mt-2 leading-7 text-slate-600">Search by title, location, country, and remote preference. Select any result and start a resume comparison immediately.</p>
          <button type="button" onClick={() => onNavigate("job")} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal/80">Explore job postings <ArrowRight size={15} /></button>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-amber-50 text-amber"><Bookmark size={20} /></span>
          <h2 className="mt-4 text-xl font-semibold text-ink">Keep the jobs and reports that matter</h2>
          <p className="mt-2 leading-7 text-slate-600">Create an account to save postings, revisit scans, and compare how your readiness improves as you tailor your resume.</p>
          <button type="button" onClick={() => onAuthOpen("create")} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-teal/80">Create a free workspace <ArrowRight size={15} /></button>
        </article>
      </section>
    </section>
  );
}

function InsightCard({ icon: Icon, label, value, detail, tone }) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber",
    sky: "bg-sky-50 text-sky-700",
    indigo: "bg-indigo-50 text-indigo-700",
  };
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-md ${colors[tone]}`}><Icon size={17} /></span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}
