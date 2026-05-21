import RequirementGroup from "../components/report/RequirementGroup.jsx";
import ScoreRing from "../components/report/ScoreRing.jsx";

export default function ReportScreen({ report }) {
  if (!report) {
    return (
      <section className="mx-auto max-w-4xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">No report yet</h2>
        <p className="mt-2 text-slate-600">Add resume and job text, then generate the first CareerFit report.</p>
      </section>
    );
  }

  const { summary, skills, requirements, recommendations } = report;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink">Explainable report</h2>
        <p className="mt-1 text-slate-600">
          {summary.candidate_name || "Candidate"} for {summary.target_role || "target role"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreRing label="Match score" value={summary.match_score} />
        <ScoreRing label="Readiness score" value={summary.readiness_score} tone="amber" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <RequirementGroup title="Matched requirements" items={requirements.matched} tone="matched" />
        <RequirementGroup title="Partially matched" items={requirements.partial} tone="partial" />
        <RequirementGroup title="Weak support" items={requirements.weak} tone="weak" />
        <RequirementGroup title="Missing requirements" items={requirements.missing} tone="missing" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
          <h3 className="font-semibold text-ink">Skill coverage</h3>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-600">Matched skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.matched.length ? (
                skills.matched.map((skill) => (
                  <span key={skill} className="rounded bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No explicit skill matches found.</span>
              )}
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-600">Missing skills</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skills.missing.length ? (
                skills.missing.map((skill) => (
                  <span key={skill} className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-800">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-slate-500">No important missing skills detected.</span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
          <h3 className="font-semibold text-ink">Recommendations</h3>
          <div className="mt-4 space-y-3">
            {recommendations.map((item) => (
              <article key={item.title} className="border-t border-slate-100 pt-3 first:border-t-0 first:pt-0">
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

