import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Download,
  Mail,
  MapPin,
  Phone,
  UserRound,
  Trash2,
} from "lucide-react";

const trackedFields = ["name", "email", "target_role", "experience_level", "location", "summary"];

export default function UserProfileScreen({
  profile,
  onChange,
  onNext,
  saveError,
  isSignedIn,
  onDeleteAccount,
  currentUser,
  accountNotice,
  onRequestEmailVerification,
  onExportWorkspace,
}) {
  const completedFields = trackedFields.filter((field) => profile[field]?.trim()).length;
  const completion = Math.round((completedFields / trackedFields.length) * 100);

  function update(field, value) {
    onChange({ ...profile, [field]: value });
  }

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Candidate profile</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Tell us what kind of work fits you</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Your profile gives job search and readiness reports better context. You can update it at any time.
          </p>
        </div>
        <div className="w-full max-w-xs rounded-md border border-slate-200 bg-white p-4 shadow-panel">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-slate-600">Profile completion</span>
            <span className="text-sm font-bold text-teal">{completion}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-emerald-50 text-teal">
                <UserRound size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Contact details</h3>
                <p className="text-sm text-slate-500">Used to personalize your workspace and ATS checks.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field icon={UserRound} label="Full name" value={profile.name} onChange={(value) => update("name", value)} placeholder="Your full name" />
              <Field icon={Mail} label="Email" type="email" value={profile.email} onChange={(value) => update("email", value)} placeholder="name@example.com" />
              <Field icon={Phone} label="Phone" type="tel" value={profile.phone} onChange={(value) => update("phone", value)} placeholder="+1 514 555 1212" />
              <Field icon={MapPin} label="Current location" value={profile.location} onChange={(value) => update("location", value)} placeholder="Montreal, QC" />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-amber-50 text-amber">
                <BriefcaseBusiness size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Career preferences</h3>
                <p className="text-sm text-slate-500">Set the role and working style you want to target.</p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field icon={BriefcaseBusiness} label="Target role" value={profile.target_role} onChange={(value) => update("target_role", value)} placeholder="Junior Data Analyst" />
              <SelectField label="Experience level" value={profile.experience_level} onChange={(value) => update("experience_level", value)} options={["Student", "Entry level", "Intermediate", "Senior"]} />
              <SelectField label="Work preference" value={profile.work_preference} onChange={(value) => update("work_preference", value)} options={["Open to remote or on-site", "Remote preferred", "Hybrid preferred", "On-site preferred"]} />
            </div>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700">
                <FileText size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Professional summary</h3>
                <p className="text-sm text-slate-500">A short snapshot helps frame recommendations for your target role.</p>
              </div>
            </div>
            <textarea
              value={profile.summary}
              onChange={(event) => update("summary", event.target.value)}
              className="mt-5 min-h-32 w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none"
              placeholder="Example: Data analytics student with hands-on experience using Python, SQL, and Tableau for reporting projects."
            />
          </section>

          {isSignedIn && (
            <section className="rounded-md border border-rose-200 bg-white p-5 shadow-panel">
              <h3 className="font-semibold text-ink">Account email</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {currentUser?.email_verified ? "Your email address is verified." : "Verify your email address so account recovery is dependable."}
              </p>
              {!currentUser?.email_verified && (
                <button type="button" onClick={onRequestEmailVerification} className="mt-3 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
                  Send verification link
                </button>
              )}
              {accountNotice && <p className="mt-3 break-words text-xs leading-5 text-slate-500">{accountNotice}</p>}
              <div className="my-5 border-t border-slate-200" />
              <h3 className="font-semibold text-rose-700">Privacy controls</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Deleting your account permanently removes your profile, saved resumes, saved jobs, and report history.
              </p>
              <button
                type="button"
                onClick={onExportWorkspace}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
              >
                <Download size={16} />
                Download workspace data
              </button>
              <button
                type="button"
                onClick={() => window.confirm("Delete your CareerFit account and all saved data?") && onDeleteAccount()}
                className="ml-2 mt-4 inline-flex items-center gap-2 rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                <Trash2 size={16} />
                Delete account
              </button>
            </section>
          )}
        </div>

        <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <h3 className="font-semibold text-ink">Before you continue</h3>
          <div className="mt-4 space-y-4">
            <ChecklistItem checked={Boolean(profile.target_role.trim())} text="Choose a target role" />
            <ChecklistItem checked={Boolean(profile.location.trim())} text="Add your location" />
            <ChecklistItem checked={Boolean(profile.summary.trim())} text="Write a short summary" />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Resume upload is the next step. ATS checks will use the resume text itself, while this profile helps tailor your report.
          </p>
          {saveError && <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{saveError}</p>}
          <button
            type="button"
            onClick={onNext}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90"
          >
            Continue to resume
            <ArrowRight size={16} />
          </button>
        </aside>
      </div>
    </section>
  );
}

function Field({ icon: Icon, label, type = "text", value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-300 px-3 focus-within:border-teal">
        <Icon size={16} className="text-slate-400" />
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full bg-transparent py-2 outline-none" placeholder={placeholder} />
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal focus:outline-none">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function ChecklistItem({ checked, text }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <CheckCircle2 size={18} className={checked ? "text-emerald-500" : "text-slate-300"} />
      <span className={checked ? "font-medium text-slate-700" : "text-slate-500"}>{text}</span>
    </div>
  );
}
