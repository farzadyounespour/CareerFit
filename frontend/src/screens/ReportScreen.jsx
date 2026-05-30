import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  MessagesSquare,
  Printer,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const categoryLabels = {
  matched: "Matched",
  partial: "Partial",
  weak: "Weak",
  missing: "Missing",
};

const categoryStyles = {
  matched: "bg-emerald-500",
  partial: "bg-sky-500",
  weak: "bg-amber-400",
  missing: "bg-rose-400",
};

export default function ReportScreen({ report, resumeText, jobDescription, onNavigate }) {
  const [activeDocument, setActiveDocument] = useState("report");
  if (!report) {
    return (
      <section className="mx-auto max-w-4xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">No scan yet</h2>
        <p className="mt-2 text-slate-600">Add resume and job text, then generate your first CareerFit scan.</p>
      </section>
    );
  }

  const { summary, skills, requirements, recommendations, ats, interview_prep: interviewPrep, ai_coaching: aiCoaching } = report;
  const issues = {
    searchability: requirements.missing.length,
    hardSkills: skills.missing.length,
    softSkills: countMissingSoftSkills(skills.missing),
    recruiterTips: recommendations.length,
    formatting: ats?.issues.length || 0,
  };
  const score = summary.readiness_score;
  const atsScore = ats?.score || 0;
  const totalIssues = (ats?.issues.length || 0) + skills.missing.length + requirements.missing.length;

  return (
    <section className="mx-auto max-w-7xl">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-panel">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-500">Resume scan results</p>
            <h2 className="text-2xl font-semibold text-ink">
              {summary.target_role || "Target role"} readiness
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {summary.candidate_name || "Candidate"} · {summary.requirements_reviewed} requirements reviewed
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onNavigate("job")}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
            >
              <RotateCcw size={16} />
              Rescan
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
            <h3 className="text-lg font-semibold text-ink">Match rate</h3>
            <div className="mt-5 flex justify-center">
              <ScoreDial value={score} />
            </div>
            <button onClick={() => onNavigate("resume")} className="mt-6 w-full rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90">
              Upload & rescan
            </button>
            <button onClick={() => document.getElementById("recommended-fixes")?.scrollIntoView({ behavior: "smooth" })} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-50 px-4 py-3 text-sm font-semibold text-teal hover:bg-emerald-100">
              <Sparkles size={16} />
              View recommended fixes
            </button>

            <div className="mt-7 space-y-5">
              <SidebarMeter label="Searchability" issues={issues.searchability} value={meterValue(issues.searchability)} />
              <SidebarMeter label="Hard skills" issues={issues.hardSkills} value={meterValue(issues.hardSkills)} />
              <SidebarMeter label="Soft skills" issues={issues.softSkills} value={meterValue(issues.softSkills)} />
              <SidebarMeter label="Recruiter tips" issues={issues.recruiterTips} value={75} />
              <SidebarMeter label="Formatting" issues={issues.formatting} value={meterValue(issues.formatting)} />
            </div>
          </aside>

          <main className="bg-slate-50">
            <div className="grid grid-cols-3 border-b border-slate-200 text-center text-sm font-semibold text-slate-600">
              <button type="button" onClick={() => setActiveDocument("report")} className={`${activeDocument === "report" ? "bg-white text-ink" : "bg-slate-200"} px-4 py-4`}>
                Scan report
              </button>
              <button type="button" onClick={() => setActiveDocument("resume")} className={`${activeDocument === "resume" ? "bg-white text-ink" : "bg-slate-200"} px-4 py-4`}>
                Resume
              </button>
              <button type="button" onClick={() => setActiveDocument("job")} className={`${activeDocument === "job" ? "bg-white text-ink" : "bg-slate-200"} px-4 py-4`}>
                Job Description
              </button>
            </div>

            <div className="p-5 lg:p-8">
              {activeDocument !== "report" && (
                <section className="mb-6 rounded-md border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-ink">
                      {activeDocument === "resume" ? "Resume text" : "Job description"}
                    </h3>
                    <button type="button" onClick={() => setActiveDocument("report")} className="text-sm font-semibold text-teal">
                      Back to scan
                    </button>
                  </div>
                  <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {activeDocument === "resume" ? resumeText : jobDescription}
                  </pre>
                </section>
              )}
              {activeDocument === "report" && (
                <>
              <div className="grid gap-3 md:grid-cols-3">
                <OverviewCard label="Readiness score" value={`${score}%`} detail={readinessLabel(score)} tone="teal" />
                <OverviewCard label="ATS structure" value={`${atsScore}%`} detail={`${ats?.issues.length || 0} formatting issues`} tone="sky" />
                <OverviewCard label="Priority fixes" value={String(totalIssues)} detail="Review before applying" tone="amber" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Lightbulb className="text-amber" size={20} />
                  <div>
                    <p className="font-semibold text-ink">ATS-specific tips</p>
                    <p className="text-sm text-slate-600">
                      Add company details and tailor resume language to improve keyword matching.
                    </p>
                  </div>
                </div>
                <button onClick={() => document.getElementById("ats-checks")?.scrollIntoView({ behavior: "smooth" })} className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber hover:bg-amber-100">
                  View ATS checks
                </button>
              </div>

              <div id="ats-checks">
              <ScanSection
                title="Searchability"
                badge="Important"
                intro="CareerFit checks whether your resume is easy to match against the job posting and highlights gaps that can reduce recruiter visibility."
                tip="Fix missing or weak requirements to make your resume easier to find and understand."
              >
                {(ats?.checks || []).map((check) => (
                  <CheckRow
                    key={check.id}
                    label={check.label}
                    status={check.passed ? "pass" : "warn"}
                    text={check.passed ? `${check.label} detected.` : `Add or improve your ${check.label.toLowerCase()}.`}
                  />
                ))}
              </ScanSection>
              </div>

              <div id="recommended-fixes">
              <ScanSection
                title="Skills match"
                badge={`${skills.missing.length} gaps`}
                intro="These are the strongest skill signals CareerFit found from the job description."
                tip="Add project, coursework, or work evidence for missing skills before submitting."
              >
                <SkillBlock title="Matched skills" skills={skills.matched} tone="matched" empty="No explicit skill matches found." />
                <SkillBlock title="Missing skills" skills={skills.missing} tone="missing" empty="No important missing skills detected." />
              </ScanSection>

              <ScanSection
                title="Requirement evidence"
                badge={`${summary.requirements_reviewed} reviewed`}
                intro="Each requirement is grouped by how strongly the resume supports it."
                tip="Prioritize missing and weak requirements first; they usually create the biggest readiness gains."
              >
                <RequirementSummary requirements={requirements} />
              </ScanSection>

              <ScanSection
                title="Recommended fixes"
                badge="Next steps"
                intro="Use these fixes to tailor the resume before applying."
              >
                <div className="space-y-3">
                  {recommendations.map((item) => (
                    <article key={item.title} className="rounded-md border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                    </article>
                  ))}
                </div>
              </ScanSection>
              {interviewPrep && (
                <ScanSection
                  title="Interview preparation"
                  badge={`${interviewPrep.questions.length} prompts`}
                  intro="Practice concise examples for this role before the conversation starts."
                  tip="Use the STAR structure and adapt each answer to the selected posting."
                >
                  <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
                    <div className="space-y-3">
                      {interviewPrep.questions.map((item) => (
                        <article key={item.question} className="rounded-md border border-slate-200 bg-white p-4">
                          <div className="flex items-start gap-3">
                            <MessagesSquare size={17} className="mt-0.5 shrink-0 text-teal" />
                            <div>
                              <p className="text-sm font-semibold text-ink">{item.question}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-500">{item.hint}</p>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                    <aside className="h-fit rounded-md border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-teal">STAR answer guide</p>
                      <div className="mt-3 space-y-3">
                        {interviewPrep.star_prompts.map((item) => (
                          <div key={item.label}>
                            <p className="text-sm font-semibold text-ink">{item.label}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{item.detail}</p>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>
                </ScanSection>
              )}
              {aiCoaching?.status === "completed" && (
                <ScanSection
                  title="AI coaching"
                  badge="Optional"
                  intro={aiCoaching.headline}
                  tip={aiCoaching.summary}
                >
                  <div className="space-y-3 p-4">
                    {aiCoaching.recommendations.map((item) => (
                      <article key={`${item.priority}-${item.title}`} className="rounded-md border border-slate-200 bg-white p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-teal">{item.priority} priority</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                </ScanSection>
              )}
              {aiCoaching && !["completed", "skipped"].includes(aiCoaching.status) && (
                <p className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {aiCoaching.detail}
                </p>
              )}
              </div>
              </>
              )}
            </div>
          </main>
        </div>
      </div>
    </section>
  );
}

function ScoreDial({ value }) {
  const background = `conic-gradient(#10b981 ${value * 3.6}deg, #facc15 ${Math.max(value * 3.6, 16)}deg, #e2e8f0 0deg)`;

  return (
    <div className="grid h-44 w-44 place-items-center rounded-full" style={{ background }}>
      <div className="grid h-32 w-32 place-items-center rounded-full bg-emerald-50 text-center">
        <div>
          <p className="text-4xl font-bold text-ink">{value}%</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Readiness</p>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value, detail, tone }) {
  const color = tone === "teal" ? "text-teal" : tone === "sky" ? "text-sky-700" : "text-amber";
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">{detail}<ArrowUpRight size={14} /></p>
    </article>
  );
}

function SidebarMeter({ label, issues, value }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-semibold text-sky-600">
          {issues === 0 ? "No issues" : `${issues} issue${issues === 1 ? "" : "s"} to fix`}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${issues > 3 ? "bg-rose-400" : "bg-sky-400"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ScanSection({ title, badge, intro, tip, children }) {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-3xl font-semibold text-ink">{title}</h3>
        {badge && (
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            {badge}
          </span>
        )}
      </div>
      {intro && <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-600">{intro}</p>}
      {tip && (
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-700">
          <span className="font-semibold">Tip:</span> {tip}
        </p>
      )}
      <div className="mt-5 rounded-md border border-slate-200 bg-white">{children}</div>
    </section>
  );
}

function CheckRow({ label, status, text }) {
  const Icon = status === "pass" ? CheckCircle2 : AlertCircle;
  const iconClass = status === "pass" ? "text-emerald-500" : "text-amber";

  return (
    <div className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[180px_32px_1fr]">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <Icon className={iconClass} size={22} />
      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

function SkillBlock({ title, skills, tone, empty }) {
  const className =
    tone === "matched"
      ? "bg-emerald-50 text-emerald-800"
      : "bg-rose-50 text-rose-800";

  return (
    <div className="border-b border-slate-100 p-4 last:border-b-0">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length ? (
          skills.map((skill) => (
            <span key={skill} className={`rounded px-2 py-1 text-xs font-semibold ${className}`}>
              {skill}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-500">{empty}</span>
        )}
      </div>
    </div>
  );
}

function RequirementSummary({ requirements }) {
  return (
    <div className="divide-y divide-slate-100">
      {Object.entries(categoryLabels).map(([key, label]) => (
        <div key={key} className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-3 w-3 rounded-full ${categoryStyles[key]}`} />
              <p className="text-sm font-semibold text-slate-700">{label} requirements</p>
            </div>
            <span className="text-sm font-semibold text-slate-500">{requirements[key].length}</span>
          </div>
          <div className="space-y-3">
            {requirements[key].length ? (
              requirements[key].map((item) => (
                <article key={`${key}-${item.text}-${item.score}`} className="rounded-md bg-slate-50 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="max-w-3xl text-sm font-medium leading-6 text-slate-800">{item.text}</p>
                    <span className="text-sm font-bold text-slate-500">{item.score}%</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {typeof item.similarity === "number" && (
                      <span className="rounded bg-white px-2 py-1 text-xs font-semibold text-slate-500">
                        Similarity {item.similarity}%
                      </span>
                    )}
                    {item.evidence.map((word) => (
                      <span key={word} className="rounded bg-white px-2 py-1 text-xs text-slate-600">
                        {word}
                      </span>
                    ))}
                  </div>
                </article>
              ))
            ) : (
              <p className="text-sm text-slate-500">No requirements in this category.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function meterValue(issueCount) {
  return Math.max(18, 100 - issueCount * 16);
}

function countMissingSoftSkills(missingSkills) {
  const softSkills = new Set(["communication", "teamwork", "leadership", "problem solving"]);
  return missingSkills.filter((skill) => softSkills.has(skill)).length;
}

function readinessLabel(score) {
  if (score >= 75) return "Strong fit";
  if (score >= 50) return "Promising, tailor it";
  return "Needs focused improvement";
}
