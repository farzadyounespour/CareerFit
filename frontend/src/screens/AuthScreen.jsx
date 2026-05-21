import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  FileText,
  Lock,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";

const benefits = [
  {
    icon: FileText,
    title: "Resume workspace",
    detail: "Upload or paste your resume and keep the matching flow organized.",
  },
  {
    icon: BarChart3,
    title: "Explainable scores",
    detail: "See matched, partial, weak, and missing requirements in one report.",
  },
  {
    icon: CheckCircle2,
    title: "Readiness guidance",
    detail: "Turn gaps into targeted improvements before applying.",
  },
];

export default function AuthScreen({ onContinue }) {
  const [mode, setMode] = useState("create");
  const isCreateMode = mode === "create";

  function handleSubmit(event) {
    event.preventDefault();
    onContinue();
  }

  return (
    <main className="min-h-screen bg-mist text-ink">
      <header className="border-b border-slate-200 bg-white/90 px-5 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
              <BriefcaseBusiness size={21} />
            </div>
            <div>
              <p className="text-lg font-semibold text-ink">CareerFit</p>
              <p className="text-xs font-medium text-slate-500">Resume-job matching</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
          >
            Continue as guest
          </button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-8 px-5 py-8 lg:grid-cols-[1fr_440px] lg:py-12">
        <div className="py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">
            Application readiness assessment
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink lg:text-5xl">
            Build a stronger application before you submit it.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            CareerFit compares a resume with a job description and explains which requirements are
            supported, partially supported, weak, or missing.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article key={benefit.title} className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal">
                    <Icon size={20} />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-ink">{benefit.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{benefit.detail}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-3 divide-x divide-slate-200 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="p-4">
              <p className="text-2xl font-semibold text-ink">4</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Report sections</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-semibold text-ink">2</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Input options</p>
            </div>
            <div className="p-4">
              <p className="text-2xl font-semibold text-ink">1</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Focused match score</p>
            </div>
          </div>
        </div>

        <aside className="rounded-md border border-slate-200 bg-white p-6 shadow-panel">
          <div>
            <p className="text-sm font-semibold text-teal">
              {isCreateMode ? "Create your account" : "Sign in"}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {isCreateMode ? "Start a new CareerFit workspace" : "Continue your CareerFit work"}
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded px-3 py-2 ${
                !isCreateMode ? "bg-white text-teal shadow-sm" : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded px-3 py-2 ${
                isCreateMode ? "bg-white text-teal shadow-sm" : "text-slate-500"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {isCreateMode && (
              <Field icon={UserRound} label="Full name" placeholder="Your name" />
            )}
            <Field icon={Mail} label="Email" type="email" placeholder="name@example.com" />
            <Field icon={Lock} label="Password" type="password" placeholder="Password" hasAction />
            {isCreateMode && (
              <Field icon={BriefcaseBusiness} label="Target role" placeholder="Junior Data Analyst" />
            )}

            <label className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 accent-teal" />
              Remember this device
            </label>

            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-teal text-sm font-bold text-white shadow-[0_10px_18px_rgba(15,118,110,0.22)] hover:bg-teal/90"
            >
              {isCreateMode ? "Create account" : "Login"}
              <ArrowRight size={18} />
            </button>
          </form>

          <button
            type="button"
            onClick={onContinue}
            className="mt-5 flex w-full items-center gap-4 rounded-md border border-dashed border-teal/30 bg-emerald-50/60 px-4 py-4 text-left hover:border-teal hover:bg-emerald-50"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-white text-teal">
              <ShieldCheck size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-slate-700">Continue as Guest</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">
                Try resume matching without saving an account.
              </span>
            </span>
            <ArrowRight className="shrink-0 text-slate-500" size={22} />
          </button>

          <div className="mt-5 border-t border-slate-200 pt-5 text-center text-sm font-semibold text-slate-500">
            {isCreateMode ? "Already have an account?" : "New user?"}
            <button
              type="button"
              onClick={() => setMode(isCreateMode ? "login" : "create")}
              className="ml-2 text-teal hover:text-teal/80"
            >
              {isCreateMode ? "Login" : "Create account"}
            </button>
          </div>

          <p className="mt-5 text-xs leading-5 text-slate-500">
            By continuing, you agree to CareerFit storing only the information needed for your matching report.
          </p>
        </aside>
      </section>
    </main>
  );
}

function Field({ icon: Icon, label, type = "text", placeholder, hasAction = false }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <div className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/10">
        <Icon className="text-slate-500" size={18} />
        <input
          type={type}
          className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
        />
        {hasAction && (
          <button type="button" title="Show password" className="text-slate-500 hover:text-teal">
            <Eye size={18} />
          </button>
        )}
      </div>
    </label>
  );
}
