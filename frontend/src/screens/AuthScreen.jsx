import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  Lock,
  Mail,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

export default function AuthScreen({
  initialMode = "create",
  onContinue,
  onPasswordReset,
  onPasswordResetConfirm,
  linkParams,
  onClose,
}) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({ name: "", email: "", password: "", target_role: "", remember: false });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isCreateMode = mode === "create";
  const isResetRequest = mode === "reset";
  const isResetConfirm = mode === "reset-confirm";

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      if (isResetRequest) {
        const result = await onPasswordReset({ email: form.email });
        setNotice(result.reset_url ? `${result.detail} ${result.reset_url}` : result.detail);
      } else if (isResetConfirm) {
        const result = await onPasswordResetConfirm({ ...linkParams, password: form.password });
        setNotice(result.detail);
        setMode("login");
      } else {
        await onContinue(mode, form);
      }
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6 text-ink">
      <aside role="dialog" aria-modal="true" aria-label="CareerFit account" className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-md border border-slate-200 bg-white p-6 shadow-2xl">
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
          <button type="button" title="Close" onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-teal">
            {isResetRequest || isResetConfirm ? "Account recovery" : isCreateMode ? "Create your account" : "Sign in"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {isResetRequest ? "Reset your password" : isResetConfirm ? "Choose a new password" : isCreateMode ? "Save your CareerFit workspace" : "Continue your CareerFit work"}
          </h2>
        </div>

        {!isResetRequest && !isResetConfirm && (
          <div className="mt-6 grid grid-cols-2 rounded-md bg-slate-100 p-1 text-sm font-semibold">
            <ModeButton active={!isCreateMode} onClick={() => setMode("login")}>Login</ModeButton>
            <ModeButton active={isCreateMode} onClick={() => setMode("create")}>Sign up</ModeButton>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isCreateMode && !isResetRequest && !isResetConfirm && (
            <Field icon={UserRound} label="Full name" placeholder="Your name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
          )}
          {!isResetConfirm && (
            <Field icon={Mail} label="Email" type="email" placeholder="name@example.com" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
          )}
          {!isResetRequest && (
            <Field
              icon={Lock}
              label={isResetConfirm ? "New password" : "Password"}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value })}
              actionIcon={showPassword ? EyeOff : Eye}
              actionLabel={showPassword ? "Hide password" : "Show password"}
              onAction={() => setShowPassword((visible) => !visible)}
            />
          )}
          {isCreateMode && !isResetRequest && !isResetConfirm && (
            <Field icon={BriefcaseBusiness} label="Target role" placeholder="Junior Data Analyst" value={form.target_role} onChange={(value) => setForm({ ...form, target_role: value })} />
          )}

          {!isResetRequest && !isResetConfirm && (
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-500">
              <input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} className="h-5 w-5 rounded border-slate-300 accent-teal" />
              Remember this device
            </label>
          )}

          <button type="submit" disabled={isSubmitting} className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-teal text-sm font-bold text-white shadow-[0_10px_18px_rgba(15,118,110,0.22)] hover:bg-teal/90 disabled:bg-slate-400">
            {isSubmitting ? "Please wait..." : isResetRequest ? "Send reset link" : isResetConfirm ? "Update password" : isCreateMode ? "Create account" : "Login"}
            <ArrowRight size={18} />
          </button>
        </form>

        {error && <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        {notice && <p className="mt-4 break-words rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}

        {!isResetConfirm && (
          <div className="mt-5 border-t border-slate-200 pt-5 text-center text-sm font-semibold text-slate-500">
            {isResetRequest ? "Remember your password?" : isCreateMode ? "Already have an account?" : "New user?"}
            <button type="button" onClick={() => setMode(isCreateMode || isResetRequest ? "login" : "create")} className="ml-2 text-teal hover:text-teal/80">
              {isResetRequest ? "Login" : isCreateMode ? "Login" : "Create account"}
            </button>
          </div>
        )}
        {!isCreateMode && !isResetRequest && !isResetConfirm && (
          <button type="button" onClick={() => setMode("reset")} className="mt-4 w-full text-center text-sm font-semibold text-teal hover:text-teal/80">
            Forgot password?
          </button>
        )}
      </aside>
    </div>
  );
}

function ModeButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`rounded px-3 py-2 ${active ? "bg-white text-teal shadow-sm" : "text-slate-500"}`}>{children}</button>;
}

function Field({ icon: Icon, label, type = "text", placeholder, value, onChange, actionIcon: ActionIcon, actionLabel, onAction }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <div className="mt-2 flex h-12 items-center gap-3 rounded-md border border-slate-300 bg-white px-3 focus-within:border-teal focus-within:ring-2 focus-within:ring-teal/10">
        <Icon className="text-slate-500" size={18} />
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder={placeholder} />
        {ActionIcon && <button type="button" title={actionLabel} onClick={onAction} className="text-slate-400 hover:text-teal"><ActionIcon size={18} /></button>}
      </div>
    </label>
  );
}
