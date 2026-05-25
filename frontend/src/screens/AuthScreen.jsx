import {
  ArrowRight,
  BriefcaseBusiness,
  X,
  Eye,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import { useState } from "react";

export default function AuthScreen({ initialMode = "create", onContinue, onClose }) {
  const [mode, setMode] = useState(initialMode);
  const isCreateMode = mode === "create";

  function handleSubmit(event) {
    event.preventDefault();
    onContinue();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6 text-ink">
      <aside className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-teal text-white">
              <BriefcaseBusiness size={21} />
            </span>
            <div>
              <p className="text-lg font-semibold text-ink">CareerFit</p>
              <p className="text-xs font-medium text-slate-500">Resume-job matching</p>
            </div>
          </div>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-teal">
            {isCreateMode ? "Create your account" : "Sign in"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {isCreateMode ? "Save your CareerFit workspace" : "Continue your CareerFit work"}
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
            Sign up
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
          You can use CareerFit without signing in. Accounts are for saving reports later.
        </p>
      </aside>
    </div>
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
