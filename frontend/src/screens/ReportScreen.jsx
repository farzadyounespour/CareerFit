import {
  AlertCircle,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Copy,
  Download,
  FileText,
  ListChecks,
  MessagesSquare,
  Pencil,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";

const categoryLabels = {
  missing: "Missing",
  weak: "Weak",
  partial: "Partial",
  matched: "Matched",
};

const categoryStyles = {
  matched: "bg-emerald-500",
  partial: "bg-sky-500",
  weak: "bg-amber-400",
  missing: "bg-rose-400",
};

export default function ReportScreen({
  report,
  resumeText,
  jobDescription,
  onNavigate,
  onRequestAiCoaching,
  isLoadingAiCoaching = false,
  aiCoachingError = "",
  history = [],
  onUseResumeTemplate = () => {},
}) {
  const [activeDocument, setActiveDocument] = useState("resume");
  const [completedActions, setCompletedActions] = useState(new Set());
  if (!report) {
    return (
      <section className="mx-auto max-w-4xl rounded-md border border-slate-200 bg-white p-8 text-center shadow-panel">
        <h2 className="text-2xl font-semibold text-ink">No report yet</h2>
        <p className="mt-2 text-slate-600">Add a resume and choose a job posting to generate your first readiness report.</p>
      </section>
    );
  }

  const {
    summary = {},
    skills = { matched: [], missing: [] },
    requirements = { missing: [], weak: [], partial: [], matched: [] },
    recommendations = [],
    ats = { score: 0, checks: [], issues: [] },
    interview_prep: interviewPrep,
    ai_coaching: aiCoaching,
  } = report;
  const score = summary.readiness_score || 0;
  const matchScore = summary.match_score || 0;
  const atsScore = ats.score || 0;
  const atsIssues = ats.issues || [];
  const requirementGaps = requirements.missing.length + requirements.weak.length;
  const priorityActions = buildPriorityActions(skills, requirements, atsIssues, recommendations);
  const resumeExamples = buildResumeExamples(summary, skills, atsIssues);
  const completedActionCount = priorityActions.filter((item) => completedActions.has(actionKey(item))).length;
  const aiCompleted = aiCoaching?.status === "completed";
  const scoreBreakdown = summary.score_breakdown || {
    requirement_evidence: { score: matchScore, weight: 65 },
    skill_coverage: { score: matchScore, weight: 35 },
    ats_preparation: { score: atsScore, weight: 20 },
    job_match_weight: 80,
  };

  return (
    <section className="mx-auto max-w-7xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Application readiness report</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">{summary.target_role || "Selected job"} readiness</h2>
          <p className="mt-2 text-sm text-slate-500">
            {summary.candidate_name || "Your resume"} compared with {summary.requirements_reviewed || 0} job requirements
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onNavigate("job")}
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
          >
            <RotateCcw size={16} />
            Choose another job
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

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <main className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink">Your application at a glance</h3>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                  Start with the priority improvements below. Open the detailed checks only when you need the evidence behind the score.
                </p>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">{readinessLabel(score)}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ScoreCard label="Readiness" value={score} detail="Overall application preparation" />
              <ScoreCard label="Job match" value={matchScore} detail="Evidence found for this posting" />
              <ScoreCard label="ATS preparation" value={atsScore} detail={`${atsIssues.length} check${atsIssues.length === 1 ? "" : "s"} to improve`} />
            </div>
            <ScoreExplanation breakdown={scoreBreakdown} />
            <ScoreHistory history={history} targetRole={summary.target_role} />
          </section>

          <section id="priority-improvements" className="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Improve these first</h3>
                  <p className="mt-1 text-sm text-slate-600">Mark each fix as you tailor your resume, then update the resume and rescan.</p>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">
                  {completedActionCount} of {priorityActions.length} complete
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-teal transition-all" style={{ width: `${priorityActions.length ? (completedActionCount / priorityActions.length) * 100 : 100}%` }} />
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {priorityActions.map((item, index) => (
                <article key={`${item.title}-${index}`} className={`grid gap-3 p-5 sm:grid-cols-[32px_1fr] ${completedActions.has(actionKey(item)) ? "bg-emerald-50/40" : ""}`}>
                  <label className="grid h-7 w-7 cursor-pointer place-items-center rounded bg-slate-100 text-xs font-bold text-slate-600">
                    <input
                      type="checkbox"
                      aria-label={`Mark priority ${index + 1}: ${item.title} complete`}
                      checked={completedActions.has(actionKey(item))}
                      onChange={() => toggleCompletedAction(item, setCompletedActions)}
                      className="h-4 w-4 accent-teal"
                    />
                  </label>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{item.title}</p>
                      <ImpactBadge priority={item.priority} />
                    </div>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <ResumeExamples examples={resumeExamples} />

          <section id="skill-review" className="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-ink">Skills for this job</h3>
              <p className="mt-1 text-sm text-slate-600">Add missing skills only when your real experience supports them.</p>
            </div>
            <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              <SkillBlock title="Supported in your resume" skills={skills.matched} tone="matched" empty="No explicit skill matches found yet." />
              <SkillBlock title="Missing from your resume" skills={skills.missing} details={skills.missing_details} tone="missing" empty="No important skill gaps detected." />
            </div>
          </section>

          {aiCompleted ? (
            <SpecificImprovements coaching={aiCoaching} />
          ) : (
            <section id="specific-improvements" className="scroll-mt-24 rounded-md border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 shrink-0 text-teal" size={20} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-ink">Want more specific improvements?</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    Ask the optional AI coach for tailored resume changes based on this resume and job posting. It will not invent experience or create another saved report.
                  </p>
                  {aiCoaching?.detail && aiCoaching.status !== "skipped" && (
                    <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{aiCoaching.detail}</p>
                  )}
                  {aiCoachingError && (
                    <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{aiCoachingError}</p>
                  )}
                  <button
                    type="button"
                    onClick={onRequestAiCoaching}
                    disabled={isLoadingAiCoaching}
                    className="mt-4 inline-flex items-center gap-2 rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-wait disabled:bg-slate-400"
                  >
                    <Sparkles size={16} />
                    {isLoadingAiCoaching ? "Generating improvements..." : "Get specific improvements"}
                  </button>
                </div>
              </div>
            </section>
          )}

          <ReportDisclosure
            id="ats-checks"
            icon={ListChecks}
            title="ATS preparation checks"
            detail="Contact details, resume structure, and recruiter-friendly formatting."
            badge={`${atsScore}% ready`}
            open={atsIssues.length > 0}
          >
            <div className="divide-y divide-slate-100">
              {(ats.checks || []).map((check) => (
                <CheckRow key={check.id} label={check.label} passed={check.passed} />
              ))}
            </div>
          </ReportDisclosure>

          <ReportDisclosure
            id="requirement-evidence"
            icon={Target}
            title="Requirement evidence"
            detail="See how strongly your resume supports each part of the job posting."
            badge={`${requirementGaps} gap${requirementGaps === 1 ? "" : "s"}`}
          >
            <RequirementDetails requirements={requirements} />
          </ReportDisclosure>

          {interviewPrep && (
            <ReportDisclosure
              icon={MessagesSquare}
              title="Interview preparation"
              detail="Practice examples that connect your real experience to this role."
              badge={`${interviewPrep.questions.length} prompts`}
            >
              <InterviewPreparation interviewPrep={interviewPrep} />
            </ReportDisclosure>
          )}

          <ReportDisclosure
            id="source-documents"
            icon={FileText}
            title="Source documents"
            detail="Review the exact resume and job description used for this report."
          >
            <DocumentPreview
              activeDocument={activeDocument}
              setActiveDocument={setActiveDocument}
              resumeText={resumeText}
              jobDescription={jobDescription}
            />
          </ReportDisclosure>

          <TailoredResumeTemplate
            key={`${summary.target_role}-${resumeText}`}
            resumeText={resumeText}
            summary={summary}
            skills={skills}
            onUseTemplate={onUseResumeTemplate}
          />
        </main>

        <aside className="rounded-md border border-slate-200 bg-white p-5 shadow-panel lg:sticky lg:top-24">
          <p className="text-sm font-semibold text-slate-500">Overall readiness</p>
          <div className="mt-4 flex justify-center">
            <ScoreDial value={score} />
          </div>
          <p className="mt-4 text-center text-sm leading-6 text-slate-600">{readinessGuidance(score)}</p>
          <button
            type="button"
            onClick={() => scrollToReportSection("priority-improvements")}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90"
          >
            Review priority fixes
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("resume")}
            className="mt-3 w-full rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
          >
            Update resume
          </button>
          <nav aria-label="Report sections" className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jump to section</p>
            <div className="mt-2 space-y-1">
              <ReportJumpLink target="priority-improvements">Priority fixes</ReportJumpLink>
              <ReportJumpLink target="skill-review">Skills</ReportJumpLink>
              <ReportJumpLink target="ats-checks">ATS checks</ReportJumpLink>
              <ReportJumpLink target="requirement-evidence">Requirement evidence</ReportJumpLink>
              <ReportJumpLink target="resume-draft">Resume draft</ReportJumpLink>
            </div>
          </nav>
          <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100 text-sm">
            <SummaryRow label="Requirements reviewed" value={summary.requirements_reviewed || 0} />
            <SummaryRow label="Requirement gaps" value={requirementGaps} />
            <SummaryRow label="Missing skills" value={skills.missing.length} />
            <SummaryRow label="ATS improvements" value={atsIssues.length} />
          </dl>
        </aside>
      </div>
    </section>
  );
}

function TailoredResumeTemplate({ resumeText, summary, skills, onUseTemplate }) {
  const [draft, setDraft] = useState(() => buildAtsResumeTemplate(resumeText, summary, skills));
  const [copied, setCopied] = useState(false);

  async function copyDraft() {
    await navigator.clipboard?.writeText(draft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadDraft() {
    const url = URL.createObjectURL(new Blob([draft], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "careerfit-ats-resume-draft.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="resume-draft" className="scroll-mt-24 rounded-md border border-teal/30 bg-white shadow-panel">
      <div className="border-b border-teal/20 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-ink">ATS-friendly resume draft</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              CareerFit reorganized your uploaded text into a clean starting template. Review every line and replace bracketed placeholders with truthful details before using it.
            </p>
          </div>
          <span className="rounded bg-white px-2 py-1 text-xs font-bold text-teal">Editable draft</span>
        </div>
      </div>
      <div className="p-5">
        <textarea
          aria-label="ATS-friendly resume draft"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          className="min-h-[540px] w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-4 py-4 font-mono text-sm leading-6 text-slate-700 focus:border-teal focus:outline-none"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={copyDraft} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Copy size={16} />
            {copied ? "Copied draft" : "Copy draft"}
          </button>
          <button type="button" onClick={downloadDraft} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Download size={16} />
            Download TXT
          </button>
          <button type="button" onClick={() => onUseTemplate(draft)} className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90">
            Open in resume workspace
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

function ResumeExamples({ examples }) {
  const [copiedId, setCopiedId] = useState("");
  if (!examples.length) return null;

  async function copyExample(example) {
    await navigator.clipboard?.writeText(example.content);
    setCopiedId(example.id);
    window.setTimeout(() => setCopiedId(""), 1800);
  }

  return (
    <section className="rounded-md border border-sky-200 bg-white shadow-panel">
      <div className="border-b border-sky-200 bg-sky-50 p-5">
        <h3 className="text-lg font-semibold text-ink">Resume section examples</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Use these as fill-in templates. Keep only sections that are true for you and replace every bracketed placeholder with your real details.
        </p>
      </div>
      <div className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {examples.map((example) => (
          <article key={example.id} className="min-w-0 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">{example.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{example.detail}</p>
              </div>
              <button type="button" title={`Copy ${example.title}`} onClick={() => copyExample(example)} className="shrink-0 rounded p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700">
                <Copy size={16} />
              </button>
            </div>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">{example.content}</pre>
            {copiedId === example.id && <p className="mt-2 text-xs font-semibold text-emerald-700">Copied example</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function actionKey(item) {
  return `${item.title}-${item.detail}`;
}

function toggleCompletedAction(item, setCompletedActions) {
  const key = actionKey(item);
  setCompletedActions((currentActions) => {
    const nextActions = new Set(currentActions);
    if (nextActions.has(key)) {
      nextActions.delete(key);
    } else {
      nextActions.add(key);
    }
    return nextActions;
  });
}

function ScoreCard({ label, value, detail }) {
  return (
    <article className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-teal">{value}%</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function ScoreExplanation({ breakdown }) {
  return (
    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <Calculator className="mt-0.5 shrink-0 text-teal" size={18} />
        <div>
          <p className="text-sm font-semibold text-ink">How CareerFit calculates the score</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Job match combines requirement evidence and skill coverage. Readiness combines {breakdown.job_match_weight}% job match with {breakdown.ats_preparation.weight}% ATS preparation. AI coaching does not change the score.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <BreakdownItem label="Requirement evidence" value={breakdown.requirement_evidence.score} detail={`${breakdown.requirement_evidence.weight}% of job match`} />
        <BreakdownItem label="Skill coverage" value={breakdown.skill_coverage.score} detail={`${breakdown.skill_coverage.weight}% of job match`} />
        <BreakdownItem label="ATS preparation" value={breakdown.ats_preparation.score} detail={`${breakdown.ats_preparation.weight}% of readiness`} />
      </div>
    </div>
  );
}

function BreakdownItem({ label, value, detail }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-teal">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-teal" style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function ScoreDial({ value }) {
  const background = `conic-gradient(#0f766e ${value * 3.6}deg, #e2e8f0 0deg)`;
  return (
    <div className="grid h-36 w-36 place-items-center rounded-full" style={{ background }}>
      <div className="grid h-28 w-28 place-items-center rounded-full bg-white text-center">
        <div>
          <p className="text-3xl font-bold text-ink">{value}%</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Ready</p>
        </div>
      </div>
    </div>
  );
}

function SkillBlock({ title, skills, details = [], tone, empty }) {
  const className = tone === "matched" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800";
  const priorities = new Map(details.map((item) => [item.name, item.priority]));
  return (
    <div className="p-5">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {skills.length ? skills.map((skill) => (
          <span key={skill} className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${className}`}>
            {skill}
            {priorities.get(skill) === "low" && <span className="font-medium opacity-75">optional</span>}
          </span>
        )) : <span className="text-sm text-slate-500">{empty}</span>}
      </div>
    </div>
  );
}

function SpecificImprovements({ coaching }) {
  const [suggestions, setSuggestions] = useState(() => coaching.recommendations.map((item, index) => ({ ...item, id: `${index}-${item.title}`, status: "open" })));
  const [editingId, setEditingId] = useState(null);

  function updateSuggestion(id, values) {
    setSuggestions((current) => current.map((item) => item.id === id ? { ...item, ...values } : item));
  }

  return (
    <section id="specific-improvements" className="scroll-mt-24 rounded-md border border-emerald-200 bg-white shadow-panel">
      <div className="border-b border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 shrink-0 text-teal" size={20} />
          <div>
            <h3 className="text-lg font-semibold text-ink">Specific improvements</h3>
            <p className="mt-1 text-sm font-medium text-slate-700">{coaching.headline}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{coaching.summary}</p>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {suggestions.filter((item) => item.status !== "dismissed").map((item) => (
          <article key={item.id} className={`p-5 ${item.status === "accepted" ? "bg-emerald-50/40" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-teal">{item.priority} priority</p>
                <p className="mt-1 text-sm font-semibold text-ink">{item.title}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" title={`Accept ${item.title}`} onClick={() => updateSuggestion(item.id, { status: item.status === "accepted" ? "open" : "accepted" })} className="rounded p-2 text-slate-500 hover:bg-emerald-50 hover:text-teal"><CheckCircle2 size={16} /></button>
                <button type="button" title={`Edit ${item.title}`} onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="rounded p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-700"><Pencil size={16} /></button>
                <button type="button" title={`Dismiss ${item.title}`} onClick={() => updateSuggestion(item.id, { status: "dismissed" })} className="rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><X size={16} /></button>
              </div>
            </div>
            {editingId === item.id ? (
              <textarea value={item.detail} onChange={(event) => updateSuggestion(item.id, { detail: event.target.value })} className="mt-3 min-h-24 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm leading-6 focus:border-teal focus:outline-none" />
            ) : (
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.detail}</p>
            )}
            {item.status === "accepted" && <p className="mt-2 text-xs font-semibold text-emerald-700">Added to your tailoring checklist</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function ScoreHistory({ history, targetRole }) {
  const relevantHistory = history
    .filter((item) => !targetRole || item.target_role === targetRole)
    .slice(0, 5)
    .reverse();
  if (relevantHistory.length < 2) return null;
  return (
    <section className="mt-4 border-t border-slate-200 pt-4">
      <p className="text-sm font-semibold text-ink">Readiness improvement history</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Rescan after tailoring your resume to see whether the evidence and ATS preparation improved.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {relevantHistory.map((item) => (
          <div key={item.id} className="min-w-16 flex-1">
            <p className="text-xs font-bold text-teal">{item.summary.readiness_score || 0}%</p>
            <div className="mt-1 flex h-16 items-end rounded bg-slate-100 px-2">
              <div className="w-full rounded-t bg-teal" style={{ height: `${Math.max(item.summary.readiness_score || 0, 6)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReportDisclosure({ id, icon: Icon, title, detail, badge, open = false, children }) {
  return (
    <details id={id} className="group scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel" open={open}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 text-teal"><Icon size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          <span className="mt-1 block text-sm leading-5 text-slate-500">{detail}</span>
        </span>
        {badge && <span className="hidden rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 sm:block">{badge}</span>}
        <ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} />
      </summary>
      <div className="border-t border-slate-200">{children}</div>
    </details>
  );
}

function ReportJumpLink({ target, children }) {
  return (
    <button type="button" onClick={() => scrollToReportSection(target)} className="flex w-full items-center justify-between gap-2 rounded px-2 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-teal">
      {children}
      <ArrowRight size={14} />
    </button>
  );
}

function scrollToReportSection(target) {
  document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function CheckRow({ label, passed }) {
  const Icon = passed ? CheckCircle2 : AlertCircle;
  return (
    <div className="flex items-start gap-3 px-5 py-3.5">
      <Icon className={`mt-0.5 shrink-0 ${passed ? "text-emerald-500" : "text-amber"}`} size={18} />
      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="mt-0.5 text-sm text-slate-500">{passed ? "Detected in your resume." : `Add or improve your ${label.toLowerCase()}.`}</p>
      </div>
    </div>
  );
}

function RequirementDetails({ requirements }) {
  return (
    <div className="divide-y divide-slate-100">
      {Object.entries(categoryLabels).map(([key, label]) => (
        <details key={key} className="group/requirement" open={key === "missing" && requirements[key].length > 0}>
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
            <span className={`h-2.5 w-2.5 rounded-full ${categoryStyles[key]}`} />
            <span className="flex-1 text-sm font-semibold text-slate-700">{label} requirements</span>
            <span className="text-sm font-semibold text-slate-500">{requirements[key].length}</span>
            <ChevronDown className="text-slate-400 transition group-open/requirement:rotate-180" size={16} />
          </summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50">
            {requirements[key].length ? requirements[key].map((item) => (
              <article key={`${key}-${item.text}-${item.score}`} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="max-w-3xl text-sm font-medium leading-6 text-slate-700">{item.text}</p>
                  <div className="flex items-center gap-2">
                    <ImpactBadge priority={item.priority} />
                    <span className="text-sm font-bold text-slate-500">{item.score}%</span>
                  </div>
                </div>
                {!!item.evidence.length && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">Evidence found: {item.evidence.join(", ")}</p>
                )}
              </article>
            )) : <p className="px-5 py-4 text-sm text-slate-500">No requirements in this category.</p>}
          </div>
        </details>
      ))}
    </div>
  );
}

function InterviewPreparation({ interviewPrep }) {
  return (
    <div className="grid gap-0 lg:grid-cols-[1fr_240px]">
      <div className="divide-y divide-slate-100">
        {interviewPrep.questions.map((item) => (
          <article key={item.question} className="px-5 py-4">
            <p className="text-sm font-semibold leading-6 text-ink">{item.question}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.hint}</p>
          </article>
        ))}
      </div>
      <aside className="border-t border-slate-100 bg-emerald-50 p-5 lg:border-l lg:border-t-0">
        <p className="text-sm font-semibold text-teal">STAR answer guide</p>
        <div className="mt-3 space-y-3">
          {interviewPrep.star_prompts.map((item) => (
            <div key={item.label}>
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.detail}</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function DocumentPreview({ activeDocument, setActiveDocument, resumeText, jobDescription }) {
  return (
    <div>
      <div className="flex border-b border-slate-100 p-3">
        <button type="button" onClick={() => setActiveDocument("resume")} className={`rounded px-3 py-2 text-sm font-semibold ${activeDocument === "resume" ? "bg-emerald-50 text-teal" : "text-slate-500 hover:text-teal"}`}>Resume</button>
        <button type="button" onClick={() => setActiveDocument("job")} className={`rounded px-3 py-2 text-sm font-semibold ${activeDocument === "job" ? "bg-emerald-50 text-teal" : "text-slate-500 hover:text-teal"}`}>Job description</button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-5 text-sm leading-6 text-slate-600">
        {activeDocument === "resume" ? resumeText : jobDescription}
      </pre>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-700">{value}</dd>
    </div>
  );
}

function buildPriorityActions(skills, requirements, atsIssues, recommendations) {
  const actions = [];
  const importantSkillGaps = (skills.missing_details || skills.missing.map((name) => ({ name, priority: "high" })))
    .filter((item) => item.priority !== "low");
  if (importantSkillGaps.length) {
    actions.push({
      title: "Add evidence for missing skills",
      detail: `Use a project or work bullet to support ${importantSkillGaps.slice(0, 5).map((item) => item.name).join(", ")} when those skills reflect your real experience.`,
      priority: "high",
    });
  }
  [...requirements.missing].sort(comparePriority).slice(0, 2).forEach((item) => {
    actions.push({ title: "Address a missing requirement", detail: item.text, priority: item.priority || "high" });
  });
  requirements.weak.slice(0, 1).forEach((item) => {
    actions.push({ title: "Strengthen a weak requirement", detail: item.text, priority: item.priority || "medium" });
  });
  atsIssues.slice(0, 2).forEach((issue) => {
    actions.push({ title: `Improve ${issue.toLowerCase()}`, detail: `Update your resume so recruiters and applicant tracking systems can clearly detect your ${issue.toLowerCase()}.`, priority: "medium" });
  });
  recommendations.forEach((item) => actions.push({ ...item, priority: item.priority || "medium" }));

  return uniqueActions(actions).slice(0, 5);
}

function buildResumeExamples(summary, skills, atsIssues) {
  const issues = new Set(atsIssues);
  const targetRole = summary.target_role || "Target Role";
  const detectedSkills = skills.matched.slice(0, 5);
  const skillText = detectedSkills.length ? detectedSkills.join(", ") : "[relevant skills you genuinely use]";
  const strongestSkill = detectedSkills[0] || "[relevant skill]";
  const examples = [];

  if (issues.has("Summary section") || issues.has("Target-role language")) {
    examples.push({
      id: "summary",
      title: "Professional summary header",
      detail: "Add a short section near the top and connect it to your real background.",
      content: `PROFESSIONAL SUMMARY\n${targetRole} with experience using ${skillText}. [Add one truthful strength or measurable result relevant to the role.]`,
    });
  }
  if (["Experience section", "Experience dates", "Readable bullet points", "Measurable achievements"].some((issue) => issues.has(issue))) {
    examples.push({
      id: "experience",
      title: "Experience or project structure",
      detail: "A consistent header, dates, and outcome-focused bullets are easier for recruiters and ATS tools to scan.",
      content: `EXPERIENCE\n[Role or project name] | [Organization] | [Month Year - Month Year]\n- Used ${strongestSkill} to [describe your real action], resulting in [truthful outcome or number].\n- Collaborated with [team or stakeholder] to [describe a real contribution].`,
    });
  }
  if (issues.has("Skills section")) {
    examples.push({
      id: "skills",
      title: "Skills header",
      detail: "Group the skills already supported by your resume. Add other skills only when they reflect your real experience.",
      content: `SKILLS\n${skillText}`,
    });
  }
  if (issues.has("Education section")) {
    examples.push({
      id: "education",
      title: "Education header",
      detail: "Use a recognizable section label and keep the format simple.",
      content: "EDUCATION\n[Degree or diploma] | [School name] | [Graduation year]\n[Relevant coursework, honors, or academic project if applicable]",
    });
  }
  if (!examples.some((example) => example.id === "experience")) {
    examples.push({
      id: "experience-bullet",
      title: "Experience bullet example",
      detail: "Use this structure to make one real project or work contribution easier to understand.",
      content: `EXPERIENCE\n[Role or project name] | [Organization] | [Dates]\n- Used ${strongestSkill} to [describe your real action], resulting in [truthful outcome or number].`,
    });
  }
  if (examples.length < 4) {
    examples.push({
      id: "certifications",
      title: "Optional certifications header",
      detail: "Include this section only when you have a relevant certification, course credential, or license.",
      content: "CERTIFICATIONS\n[Certification or credential name] | [Issuing organization] | [Year]\n[Credential URL or expiration date if relevant]",
    });
  }

  return examples.slice(0, 4);
}

function buildAtsResumeTemplate(resumeText, summary, skills) {
  const parsed = parseResumeSections(resumeText);
  const candidateName = parsed.header[0] || summary.candidate_name || "[Your name]";
  const contactLines = parsed.header.slice(1);
  const targetRole = summary.target_role || "[Target role]";
  const detectedSkills = skills.matched.length ? skills.matched.join(", ") : "[Add your relevant skills]";

  return [
    candidateName,
    targetRole,
    contactLines.length ? contactLines.join("\n") : "[Email] | [Phone] | [City, Province or State]",
    "",
    "PROFESSIONAL SUMMARY",
    sectionText(parsed.sections.summary, `[Write 2-3 lines about your real experience relevant to ${targetRole}. Mention your strongest skills and one truthful result.]`),
    "",
    "SKILLS",
    sectionText(parsed.sections.skills, detectedSkills),
    "",
    "EXPERIENCE",
    sectionText(parsed.sections.experience, "[Role or project] | [Organization] | [Dates]\n- [Describe a real action and its result. Add a truthful number when possible.]"),
    "",
    "EDUCATION",
    sectionText(parsed.sections.education, "[Degree or diploma] | [School] | [Graduation year]"),
    "",
    "CERTIFICATIONS",
    sectionText(parsed.sections.certifications, "[Add relevant certifications only if applicable. Remove this section otherwise.]"),
    parsed.sections.projects.length ? `\nPROJECTS\n${parsed.sections.projects.join("\n")}` : "",
  ].join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function parseResumeSections(resumeText) {
  const aliases = {
    summary: ["summary", "professional summary", "profile", "objective"],
    skills: ["skills", "technical skills", "core skills", "competencies"],
    experience: ["experience", "work experience", "professional experience", "employment"],
    education: ["education", "academic background"],
    certifications: ["certifications", "certification", "licenses", "credentials"],
    projects: ["projects", "selected projects", "academic projects"],
  };
  const sections = Object.fromEntries(Object.keys(aliases).map((key) => [key, []]));
  const header = [];
  let activeSection = "";

  resumeText.split(/\r?\n/).forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    const normalized = line.toLowerCase().replace(/:$/, "");
    const section = Object.entries(aliases).find((entry) => entry[1].includes(normalized))?.[0];
    if (section) {
      activeSection = section;
    } else if (activeSection) {
      sections[activeSection].push(line);
    } else {
      header.push(line);
    }
  });
  return { header, sections };
}

function sectionText(lines, fallback) {
  return lines.length ? lines.join("\n") : fallback;
}

function comparePriority(first, second) {
  const rank = { high: 0, medium: 1, low: 2 };
  return (rank[first.priority] ?? 1) - (rank[second.priority] ?? 1);
}

function uniqueActions(actions) {
  const seen = new Set();
  return actions.filter((item) => {
    const key = `${item.title}-${item.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function ImpactBadge({ priority }) {
  if (!priority) return null;
  const className = priority === "high" ? "bg-rose-50 text-rose-700" : priority === "low" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-900";
  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${className}`}>{priority} impact</span>;
}

function readinessLabel(score) {
  if (score >= 75) return "Strong fit";
  if (score >= 50) return "Promising, tailor it";
  return "Needs focused improvement";
}

function readinessGuidance(score) {
  if (score >= 75) return "Your resume is well aligned. Review the remaining details before applying.";
  if (score >= 50) return "You have a useful foundation. Work through the top fixes before applying.";
  return "Focus on the first few improvements, then generate a fresh report.";
}
