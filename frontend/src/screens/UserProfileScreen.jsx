export default function UserProfileScreen({ profile, onChange, onNext }) {
  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink">User profile</h2>
        <p className="mt-1 text-slate-600">Set the candidate context for the matching report.</p>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              value={profile.name}
              onChange={(event) => onChange({ ...profile, name: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal focus:outline-none"
              placeholder="Farzad Younespour"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Target role</span>
            <input
              value={profile.target_role}
              onChange={(event) => onChange({ ...profile, target_role: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal focus:outline-none"
              placeholder="Junior Data Analyst"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Experience level</span>
            <select
              value={profile.experience_level}
              onChange={(event) => onChange({ ...profile, experience_level: event.target.value })}
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-teal focus:outline-none"
            >
              <option>Student</option>
              <option>Entry level</option>
              <option>Intermediate</option>
              <option>Senior</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
          >
            Continue to resume
          </button>
        </div>
      </div>
    </section>
  );
}

