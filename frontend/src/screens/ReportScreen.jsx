import {
  AlertCircle,
  ArrowRight,
  BookmarkPlus,
  Calculator,
  CheckCircle2,
  ChevronDown,
  FileText,
  ListChecks,
  MessagesSquare,
  Printer,
  RotateCcw,
  Sparkles,
  Target,
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
  onRequestAiCoaching = () => {},
  isLoadingAiCoaching = false,
  aiCoachingError = "",
  history = [],
  onAddToTracker = () => {},
  canAddToTracker = true,
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
    priority_fixes: priorityFixes = [],
    ats = { score: 0, checks: [], issues: [] },
    interview_prep: interviewPrep,
    ai_coaching: aiCoaching,
  } = report;
  const score = summary.readiness_score || 0;
  const matchScore = summary.match_score || 0;
  const atsScore = ats.score || 0;
  const atsIssues = ats.issues || [];
  const requirementGaps = requirements.missing.length + requirements.weak.length;
  const hasSemanticMatches = Object.values(requirements).some((items) => items.some((item) => item.match_label));
  const aiCompleted = aiCoaching?.status === "completed";
  const aiRecommendations = aiCompleted ? enrichAiRecommendations(aiCoaching.recommendations || [], requirements) : [];
  const aiReportSections = aiCompleted ? normalizedReportSections(aiCoaching.report_sections || []) : [];
  const aiSkillInsights = aiCompleted ? normalizedSkillInsights(aiCoaching.skill_insights || []) : [];
  const priorityActions = buildPriorityActions(skills, requirements, atsIssues, recommendations, priorityFixes, aiRecommendations);
  const completedActionCount = priorityActions.filter((item) => completedActions.has(actionKey(item))).length;
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

          {aiReportSections.length > 0 && (
            <AiReportHighlights
              sections={aiReportSections}
              provider={aiCoaching.provider}
              model={aiCoaching.model}
            />
          )}

          <section id="priority-improvements" className="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-ink">Improve these first</h3>
                  <p className="mt-1 text-sm text-slate-600">Mark each fix as you tailor your resume, then update the resume and rescan.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {aiCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">
                      <Sparkles size={13} />
                      Ollama guidance ready
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={onRequestAiCoaching}
                      disabled={isLoadingAiCoaching}
                      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-teal hover:border-teal disabled:cursor-wait disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                    >
                      <Sparkles size={14} />
                      {isLoadingAiCoaching ? "Generating..." : "Retry AI"}
                    </button>
                  )}
                  <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">
                    {completedActionCount} of {priorityActions.length} complete
                  </span>
                </div>
              </div>
              {aiCoachingError && (
                <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{aiCoachingError}</p>
              )}
              {aiCoaching?.detail && aiCoaching.status !== "skipped" && !aiCompleted && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{aiCoaching.detail}</p>
              )}
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
                    <EvidenceGapCard item={item} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="skill-review" className="scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-ink">Skills for this job</h3>
              <p className="mt-1 text-sm text-slate-600">Add missing skills only when your real experience supports them.</p>
            </div>
            <div className="grid divide-y divide-slate-100 md:grid-cols-2 md:divide-x md:divide-y-0">
              <SkillBlock
                title="Supported in your resume"
                skills={skills.matched}
                insights={skillInsightsFor(aiSkillInsights, skills.matched, ["supported", "related"])}
                tone="matched"
                empty="No explicit skill matches found yet."
              />
              <SkillBlock
                title="Missing from your resume"
                skills={skills.missing}
                details={skills.missing_details}
                insights={skillInsightsFor(aiSkillInsights, skills.missing, ["missing", "related"])}
                tone="missing"
                empty="No important skill gaps detected."
              />
            </div>
          </section>

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
            open={hasSemanticMatches}
          >
            <RequirementDetails requirements={requirements} />
          </ReportDisclosure>

          <section id="additional-tools" className="scroll-mt-24 space-y-3">
            <div className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
              <p className="text-sm font-semibold uppercase tracking-wide text-teal">Additional tools</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">Open these only when you need the extra detail</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                The main report above is the action plan. Use these supporting sections for interview practice or audit details.
              </p>
            </div>

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
          </section>
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
            onClick={onAddToTracker}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
          >
            {canAddToTracker ? <BookmarkPlus size={16} /> : <ListChecks size={16} />}
            {canAddToTracker ? "Add to tracker" : "Open tracker"}
          </button>
          <nav aria-label="Report sections" className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Jump to section</p>
            <div className="mt-2 space-y-1">
              {aiReportSections.length > 0 && <ReportJumpLink target="ai-highlights">AI highlights</ReportJumpLink>}
              <ReportJumpLink target="priority-improvements">Priority fixes</ReportJumpLink>
              <ReportJumpLink target="skill-review">Skills</ReportJumpLink>
              <ReportJumpLink target="ats-checks">ATS checks</ReportJumpLink>
              <ReportJumpLink target="requirement-evidence">Requirement evidence</ReportJumpLink>
              <ReportJumpLink target="additional-tools">Additional tools</ReportJumpLink>
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

function AiReportHighlights({ sections, provider, model }) {
  return (
    <section id="ai-highlights" className="scroll-mt-24 rounded-md border border-emerald-200 bg-white shadow-panel">
      <div className="border-b border-emerald-200 bg-emerald-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 shrink-0 text-teal" size={20} />
            <div>
              <h3 className="text-lg font-semibold text-ink">AI report highlights</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Tailored guidance from {provider || "AI"}{model ? ` (${model})` : ""}, grounded in the resume, job posting, and CareerFit evidence.
              </p>
            </div>
          </div>
          <span className="rounded bg-white px-2 py-1 text-xs font-bold text-teal">
            {provider === "ollama" ? "Ollama enriched" : "AI enriched"}
          </span>
        </div>
      </div>
      <div className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        {sections.map((section) => (
          <article key={`${section.title}-${section.summary}`} className="p-5">
            <p className="text-sm font-semibold text-ink">{section.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{section.summary}</p>
            {section.evidence && (
              <p className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                <span className="font-semibold text-slate-700">Evidence: </span>
                {section.evidence}
              </p>
            )}
            {section.next_step && (
              <p className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-slate-700">
                <span className="font-semibold text-teal">Next step: </span>
                {section.next_step}
              </p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function EvidenceGapCard({ item }) {
  const hasGapDetails = item.jobSignal || item.resumeSignal || item.evidenceNeeded;
  if (!hasGapDetails && !item.example && !item.checklist?.length && !item.why) return null;

  return (
    <div className="mt-3 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      {hasGapDetails && (
        <div className="grid divide-y divide-slate-200 bg-white md:grid-cols-3 md:divide-x md:divide-y-0">
          <EvidenceGapColumn
            label="Job asks for"
            value={item.jobSignal}
            empty="No specific job signal found."
            tone="job"
          />
          <EvidenceGapColumn
            label="Resume shows"
            value={item.resumeSignal}
            empty="No clear resume proof yet."
            tone="resume"
          />
          <EvidenceGapColumn
            label="Add this proof"
            value={item.evidenceNeeded}
            empty="Add one specific, truthful example."
            tone="proof"
          />
        </div>
      )}
      <div className="space-y-3 p-3">
        {item.where && (
          <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-slate-600">
            <span className="font-bold uppercase tracking-wide text-slate-500">Best place</span>
            <span className="rounded bg-white px-2 py-1 font-semibold text-slate-700">{item.where}</span>
          </div>
        )}
        {!!item.checklist?.length && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">A strong fix includes</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.checklist.map((detail) => (
                <span key={detail} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-slate-600">
                  <CheckCircle2 size={12} className="text-teal" />
                  {detail}
                </span>
              ))}
            </div>
          </div>
        )}
        {item.why && (
          <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
            <span className="font-semibold text-slate-700">Why this matters: </span>
            {item.why}
          </p>
        )}
        {item.example && (
          <div className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-teal">Suggested resume bullet</p>
            <p className="mt-1 text-xs leading-5 text-slate-700">{item.example}</p>
          </div>
        )}
        {item.truthfulnessNote && (
          <p className="text-xs leading-5 text-slate-500">
            <span className="font-semibold text-slate-600">Truthfulness note: </span>
            {item.truthfulnessNote}
          </p>
        )}
      </div>
    </div>
  );
}

function EvidenceGapColumn({ label, value, empty, tone }) {
  const toneClasses = {
    job: "text-rose-700 bg-rose-50",
    resume: "text-sky-700 bg-sky-50",
    proof: "text-teal bg-emerald-50",
  };

  return (
    <div className="p-3">
      <p className={`inline-flex rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${toneClasses[tone]}`}>
        {label}
      </p>
      <p className={`mt-2 text-xs leading-5 ${value ? "text-slate-700" : "text-slate-400"}`}>
        {value || empty}
      </p>
    </div>
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

function SkillBlock({ title, skills, details = [], insights = [], tone, empty }) {
  const className = tone === "matched" ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800";
  const priorities = new Map(details.map((item) => [item.name, item.priority]));
  const visibleInsights = insights.slice(0, 4);
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
      {visibleInsights.length > 0 && (
        <div className="mt-4 space-y-2">
          {visibleInsights.map((insight) => (
            <div key={`${insight.skill}-${insight.status}-${insight.detail}`} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-teal">{insight.skill}</p>
                <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">{formatLabel(insight.status)}</span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-700">{insight.detail}</p>
              {insight.evidence && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-600">Evidence: </span>
                  {insight.evidence}
                </p>
              )}
              {insight.next_step && (
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-600">Next step: </span>
                  {insight.next_step}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
        <details key={key} className="group/requirement" open={(key === "missing" && requirements[key].length > 0) || requirements[key].some((item) => item.match_label)}>
          <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4">
            <span className={`h-2.5 w-2.5 rounded-full ${categoryStyles[key]}`} />
            <span className="flex-1 text-sm font-semibold text-slate-700">{label} requirements</span>
            <span className="text-sm font-semibold text-slate-500">{requirements[key].length}</span>
            <ChevronDown className="text-slate-400 transition group-open/requirement:rotate-180" size={16} />
          </summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50">
            {requirements[key].length ? requirements[key].map((item) => (
              <RequirementEvidenceRow key={`${key}-${item.text}-${item.score}`} item={item} />
            )) : <p className="px-5 py-4 text-sm text-slate-500">No requirements in this category.</p>}
          </div>
        </details>
      ))}
    </div>
  );
}

function RequirementEvidenceRow({ item }) {
  const evidenceText = item.semantic_evidence || item.best_evidence;
  const explanation = item.semantic_explanation || item.match_basis;
  const scoreDetails = [
    item.lexical_score ? `Lexical ${item.lexical_score}%` : "",
    item.semantic_score ? `Concept ${item.semantic_score}%` : "",
    item.embedding_score ? `Embedding ${item.embedding_score}%` : "",
  ].filter(Boolean);

  return (
    <article className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-3xl text-sm font-medium leading-6 text-slate-700">{item.text}</p>
        <div className="flex items-center gap-2">
          {item.match_label && (
            <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">{item.match_label}</span>
          )}
          {item.match_basis && !item.match_label && (
            <span className="rounded bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">{item.match_basis}</span>
          )}
          <ImpactBadge priority={item.priority} />
          <span className="text-sm font-bold text-slate-500">{item.score}%</span>
        </div>
      </div>
      {evidenceText && (
        <div className="mt-3 rounded-md border border-emerald-100 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-teal">Strongest resume evidence</p>
          <p className="mt-1 text-sm leading-6 text-slate-700">{evidenceText}</p>
          {explanation && (
            <p className="mt-1 text-xs leading-5 text-slate-500">{explanation}</p>
          )}
          {!!scoreDetails.length && (
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {scoreDetails.join(" · ")}
            </p>
          )}
        </div>
      )}
      {!!item.evidence?.length && (
        <p className="mt-2 text-xs leading-5 text-slate-500">Keyword evidence: {item.evidence.join(", ")}</p>
      )}
    </article>
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

function normalizedReportSections(sections = []) {
  return sections
    .map((section) => ({
      title: cleanText(section.title),
      summary: cleanText(section.summary),
      evidence: cleanText(section.evidence),
      next_step: cleanText(section.next_step),
    }))
    .filter((section) => section.title && section.summary)
    .slice(0, 4);
}

function normalizedSkillInsights(insights = []) {
  return insights
    .map((insight) => ({
      skill: cleanText(insight.skill),
      status: normalizeSkillInsightStatus(insight.status),
      detail: cleanText(insight.detail),
      evidence: cleanText(insight.evidence),
      next_step: cleanText(insight.next_step),
    }))
    .filter((insight) => insight.skill && insight.detail)
    .slice(0, 8);
}

function skillInsightsFor(insights = [], skills = [], allowedStatuses = []) {
  const normalizedSkills = new Set(skills.map(normalizeSkillKey));
  return insights.filter((insight) => {
    const allowed = allowedStatuses.includes(insight.status);
    if (!allowed) return false;
    return normalizedSkills.size === 0 || normalizedSkills.has(normalizeSkillKey(insight.skill));
  });
}

function normalizeSkillInsightStatus(status = "") {
  const normalized = cleanText(status).toLowerCase();
  if (["supported", "missing", "related"].includes(normalized)) return normalized;
  return "related";
}

function normalizeSkillKey(skill = "") {
  return cleanText(skill).toLowerCase();
}

function cleanText(value = "") {
  return typeof value === "string" ? value.trim() : "";
}

function formatLabel(value = "") {
  return cleanText(value).replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function enrichAiRecommendations(recommendations = [], requirements = {}) {
  const requirementItems = flattenRequirementItems(requirements);
  return recommendations.map((fix) => {
    const relatedRequirement = findRelatedRequirement(fix, requirementItems);
    const jobRequirement = firstMeaningfulText(
      fix.job_requirement,
      fix.jobSignal,
      relatedRequirement?.text,
      quotedRequirementSignal(fix),
      topicRequirementSignal(fix),
    );
    const resumeEvidence = firstResumeEvidenceText(
      fix.resume_evidence,
      fix.resumeSignal,
      requirementResumeSignal(relatedRequirement),
    );
    const whatToAdd = firstMeaningfulText(
      fix.what_to_add,
      fix.evidenceNeeded,
      requirementEvidenceNeeded(relatedRequirement?.text || jobRequirement || fix.title || "", relatedRequirement?.score >= 20 ? "weak" : "missing"),
    );

    return {
      ...fix,
      job_requirement: jobRequirement,
      resume_evidence: resumeEvidence,
      where_to_add: firstMeaningfulText(fix.where_to_add, fix.where, "Experience or Projects"),
      what_to_add: whatToAdd,
      truthfulness_note: firstMeaningfulText(fix.truthfulness_note, fix.truthfulnessNote, "Use this only if it reflects work you actually did."),
    };
  });
}

function buildPriorityActions(skills, requirements, atsIssues, recommendations, backendFixes = [], aiFixes = []) {
  const aiActions = aiFixes
    .filter(isActionableRecommendation)
    .map((fix) => normalizePriorityFix(fix, "ai"));

  if (backendFixes.length) {
    const backendActions = backendFixes
      .filter((item) => isActionableRequirement({ text: `${item.title || ""} ${item.detail || ""} ${item.jobSignal || ""}` }))
      .map(normalizePriorityFix)
    return uniqueActions([...aiActions, ...backendActions]).slice(0, 5);
  }

  const actions = [];
  const importantSkillGaps = (skills.missing_details || skills.missing.map((name) => ({ name, priority: "high" })))
    .filter((item) => item.priority !== "low");
  if (importantSkillGaps.length) {
    const importantSkillNames = importantSkillGaps.slice(0, 5).map((item) => item.name);
    const firstSkillGap = importantSkillNames[0];
    actions.push({
      title: "Add evidence for missing skills",
      detail: `CareerFit found ${formatList(importantSkillNames)} in the job posting, but not enough resume evidence that proves you used ${importantSkillNames.length === 1 ? "it" : "them"}.`,
      priority: "high",
      where: "Experience or Projects",
      evidenceNeeded: `A real example that names ${firstSkillGap}, the feature or system, your action, and the result.`,
      jobSignal: formatList(importantSkillNames),
      resumeSignal: resumeSkillSignal(skills.matched),
      checklist: skillEvidenceChecklist(firstSkillGap),
      why: "Recruiters and ATS tools look for proof, not just a keyword in the skills list. A concrete bullet makes the match stronger and easier to defend in an interview.",
      example: skillBulletExample(firstSkillGap),
    });
  }
  [...requirements.missing].filter(isActionableRequirement).sort(comparePriority).slice(0, 2).forEach((item) => {
    actions.push({
      title: "Address a missing requirement",
      detail: `The resume does not yet show clear evidence for this job requirement: ${item.text}`,
      priority: item.priority || "high",
      where: "Most relevant experience, project, or summary line",
      evidenceNeeded: requirementEvidenceNeeded(item.text, "missing"),
      jobSignal: item.text,
      resumeSignal: requirementEvidenceSignal(item),
      checklist: ["Requirement keyword", "Concrete project", "Your action", "Outcome"],
      why: "A missing requirement usually means the job asks for something CareerFit could not connect to any resume evidence.",
      example: requirementBulletExample(item.text),
    });
  });
  requirements.weak.filter(isActionableRequirement).slice(0, 1).forEach((item) => {
    actions.push({
      title: "Strengthen a weak requirement",
      detail: `CareerFit found related wording, but the resume needs a clearer example for: ${item.text}`,
      priority: item.priority || "medium",
      where: "Rewrite an existing bullet under the closest role or project",
      evidenceNeeded: requirementEvidenceNeeded(item.text, "weak"),
      jobSignal: item.text,
      resumeSignal: requirementEvidenceSignal(item),
      checklist: ["Specific feature/system", "Method or tool", "Scope or scale", "Result"],
      why: "Weak matches often happen when the resume has a related skill word but not enough context to prove depth.",
      example: requirementBulletExample(item.text),
    });
  });
  atsIssues.slice(0, 2).forEach((issue) => {
    actions.push({
      title: `Improve ${issue.toLowerCase()}`,
      detail: `Update your resume so recruiters and applicant tracking systems can clearly detect your ${issue.toLowerCase()}.`,
      priority: "medium",
      where: resumeSectionForAtsIssue(issue),
      evidenceNeeded: atsEvidenceDetail(issue),
      jobSignal: "ATS structure check",
      resumeSignal: `CareerFit flagged ${issue.toLowerCase()} as incomplete or hard to detect.`,
      checklist: ["Clear heading", "Plain text", "Consistent formatting"],
    });
  });
  recommendations
    .filter(isActionableRecommendation)
    .forEach((item) => actions.push({ ...item, priority: item.priority || "medium" }));

  return uniqueActions([...aiActions, ...actions]).slice(0, 5);
}

function normalizePriorityFix(fix, source = fix.source) {
  return {
    title: fix.title,
    detail: fix.detail,
    priority: fix.priority || "medium",
    where: fix.where || fix.where_to_add,
    evidenceNeeded: fix.evidenceNeeded || fix.what_to_add,
    jobSignal: fix.jobSignal || fix.job_requirement,
    resumeSignal: fix.resumeSignal || fix.resume_evidence,
    checklist: fix.checklist || [],
    why: fix.why,
    example: fix.example || fix.bullet_template,
    truthfulnessNote: fix.truthfulnessNote || fix.truthfulness_note,
    status: fix.status,
    source,
  };
}

function flattenRequirementItems(requirements = {}) {
  return Object.values(requirements || {})
    .flat()
    .filter((item) => item?.text);
}

function findRelatedRequirement(fix, requirementItems = []) {
  const sourceText = [
    fix.title,
    fix.detail,
    fix.job_requirement,
    fix.jobSignal,
    fix.what_to_add,
    fix.bullet_template,
  ].filter(Boolean).join(" ");
  const sourceTokens = new Set(meaningfulActionTokens(sourceText));
  const quotedRequirement = quotedRequirementSignal(fix)?.toLowerCase();
  const explicitRequirement = firstMeaningfulText(fix.job_requirement, fix.jobSignal)?.toLowerCase();
  let bestMatch = null;
  let bestScore = 0;

  requirementItems.forEach((item) => {
    const requirementText = item.text || "";
    const normalizedRequirement = requirementText.toLowerCase();
    const requirementTokens = meaningfulActionTokens(requirementText);
    const overlapScore = requirementTokens.filter((token) => sourceTokens.has(token)).length;
    const explicitScore = explicitRequirement && normalizedRequirement.includes(explicitRequirement) ? 8 : 0;
    const quotedScore = quotedRequirement && normalizedRequirement.includes(quotedRequirement) ? 6 : 0;
    const score = overlapScore + explicitScore + quotedScore;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  });

  return bestScore > 0 ? bestMatch : null;
}

function firstMeaningfulText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

function firstResumeEvidenceText(...values) {
  const candidates = values
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim());
  return candidates.find((value) => !isNoResumeEvidenceText(value)) || candidates[0] || "No related resume evidence detected yet.";
}

function isNoResumeEvidenceText(value) {
  return /\b(no|none|not)\b.*\b(evidence|proof|detected|found|related)\b/i.test(value);
}

function requirementResumeSignal(requirement) {
  if (!requirement) return "No related resume evidence detected yet.";
  if (requirement.semantic_evidence) return requirement.semantic_evidence;
  if (requirement.best_evidence) return requirement.best_evidence;
  if (requirement.evidence?.length) return `Related wording found: ${formatList(requirement.evidence.slice(0, 5))}.`;
  return "No related resume evidence detected yet.";
}

function quotedRequirementSignal(fix) {
  const text = [fix.detail, fix.what_to_add, fix.title].filter(Boolean).join(" ");
  const match = text.match(/["'“”‘’]([^"'“”‘’]{5,220})["'“”‘’]/);
  return match?.[1]?.trim() || "";
}

function topicRequirementSignal(fix) {
  const topic = (fix.title || "")
    .replace(/^(add|address|clarify|expand|improve|mention|show|strengthen)\s+/i, "")
    .replace(/\s+evidence$/i, "")
    .trim();
  return topic ? `Job requirement related to ${topic}.` : "Job requirement from the selected posting.";
}

const ACTION_TOKEN_STOPWORDS = new Set([
  "add",
  "align",
  "and",
  "are",
  "bullet",
  "careerfit",
  "clear",
  "detail",
  "easier",
  "evidence",
  "experience",
  "found",
  "high",
  "impact",
  "improve",
  "indicates",
  "job",
  "match",
  "medium",
  "partial",
  "posting",
  "proof",
  "related",
  "requirement",
  "resume",
  "show",
  "shows",
  "specific",
  "strengthen",
  "the",
  "this",
  "with",
  "your",
]);

function meaningfulActionTokens(text = "") {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) || [])
    .filter((token) => token.length > 2 && !ACTION_TOKEN_STOPWORDS.has(token));
}

function formatList(items) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function resumeSkillSignal(matchedSkills) {
  if (!matchedSkills?.length) return "No strong skill evidence detected yet.";
  return `CareerFit currently detects ${formatList(matchedSkills.slice(0, 4))}, but not this missing skill evidence.`;
}

function requirementEvidenceSignal(item) {
  if (item.semantic_evidence) return item.semantic_evidence;
  if (item.evidence?.length) return `Related wording found: ${formatList(item.evidence.slice(0, 5))}.`;
  return "No direct resume evidence detected for this requirement.";
}

function isActionableRequirement(item) {
  const text = normalizeActionText(item.text || "");
  return !NON_RESUME_ACTION_PATTERNS.some((pattern) => pattern.test(text));
}

function isActionableRecommendation(item) {
  const text = normalizeActionText(`${item.title || ""} ${item.detail || ""} ${item.example || ""}`);
  return !NON_RESUME_ACTION_PATTERNS.some((pattern) => pattern.test(text));
}

function normalizeActionText(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

const NON_RESUME_ACTION_PATTERNS = [
  /\b(if you have questions|questions regarding|please contact|email protected|reach out)\b/,
  /\b(hiring practices|hiring process|recruitment process|application process|selection process|screening process|interview process|recruiting team|talent acquisition)\b/,
  /\b(artificial intelligence|ai tools?|automated tools?|automated decision|algorithmic)\b.*\b(hiring|recruit|application|selection|screening|assessment)\b/,
  /\b(hiring|recruit|application|selection|screening|assessment)\b.*\b(artificial intelligence|ai tools?|automated tools?|automated decision|algorithmic)\b/,
  /\b(equal opportunity|eeo|affirmative action|reasonable accommodation|accommodation request|diversity and inclusion|veteran status|disability status)\b/,
  /\b(privacy policy|privacy notice|personal information|personal data|gdpr|ccpa|data retention|cookies?)\b/,
  /\b(apply now|submit your application|click apply|learn more|job alert|talent community|careers page|application portal)\b/,
  /\b(compensation|salary range|pay range|benefits package|vacation policy|paid time off|stock options|bonus eligible|equity package)\b/,
  /\b(background check|reference check|employment verification|work authorization|visa sponsorship|e-verify|criminal history)\b/,
  /\b(agency|agencies|recruiters?|staffing firms?|unsolicited resumes?)\b/,
  /\b(job id|job number|requisition|req id|posted date|posting date|employment type|work location)\b/,
];

function skillEvidenceChecklist(skill) {
  if (/test|qa|quality/i.test(skill)) {
    return ["Testing type", "Feature or API", "Tool or method", "Defect/result"];
  }
  if (/sql|postgres|database|mongodb|redis|supabase/i.test(skill)) {
    return ["Dataset or table", "Query/design choice", "Business result", "Scale"];
  }
  if (/react|next|typescript|javascript|node|express/i.test(skill)) {
    return ["Feature built", "Framework/tool", "User impact", "Deployment/result"];
  }
  return ["Skill used", "Project context", "Your action", "Result"];
}

function skillBulletExample(skill) {
  if (/test|qa|quality/i.test(skill)) {
    return `Tested [feature/API/workflow] using [unit, integration, functional, performance, or chaos testing], covering [edge case or failure mode] and improving [release confidence, defects found, or reliability].`;
  }
  if (/sql|postgres|database|mongodb|redis|supabase/i.test(skill)) {
    return `Used ${skill} to [model, query, or optimize] [dataset/system], improving [reporting speed, data quality, reliability, or decision-making].`;
  }
  if (/react|next|typescript|javascript|node|express/i.test(skill)) {
    return `Built [feature or workflow] with ${skill}, improving [user task, performance, maintainability, or delivery speed].`;
  }
  return `Used ${skill} to [describe a real feature, tool, or project], resulting in [truthful outcome or measurable result].`;
}

function requirementBulletExample(requirement) {
  if (/test|quality|sdlc|software development lifecycle/i.test(requirement)) {
    return "Applied [testing methodology] during [SDLC phase/project], validating [feature/system] through [test type/tool] and improving [release quality, reliability, or defect detection].";
  }
  if (/api|backend|service|endpoint/i.test(requirement)) {
    return "Built [backend service/API endpoint] for [use case], integrating [system/tool] and improving [latency, reliability, automation, or user workflow].";
  }
  if (/full.?stack|react|next|typescript/i.test(requirement)) {
    return "Delivered [full-stack feature] using [frontend/backend tools], connecting [data/API] to [user workflow] and improving [specific outcome].";
  }
  return `Built or improved [specific project/system] related to "${shortenText(requirement, 80)}", using [tools/method] to achieve [truthful result].`;
}

function requirementEvidenceNeeded(requirement, status) {
  const prefix = status === "weak" ? "Strengthen the weak match with" : "Add a truthful bullet with";
  if (/test|quality|qa|sdlc|software development lifecycle/i.test(requirement)) {
    return `${prefix} the test type, feature or workflow tested, tool or method used, and defect, reliability, or release-quality result.`;
  }
  if (/api|backend|service|endpoint|integration/i.test(requirement)) {
    return `${prefix} the API/service name, integration or endpoint you built, your implementation role, and the reliability, latency, automation, or user-workflow result.`;
  }
  if (/data|sql|database|analytics|dashboard|reporting|pipeline/i.test(requirement)) {
    return `${prefix} the dataset, query/dashboard/pipeline work, decision you made, and the reporting, quality, speed, or business result.`;
  }
  if (/react|frontend|front.?end|ui|typescript|javascript|full.?stack/i.test(requirement)) {
    return `${prefix} the user-facing feature, frontend/backend tools, your contribution, and the usability, performance, or delivery result.`;
  }
  if (/cloud|aws|azure|gcp|docker|kubernetes|deployment|devops|ci\/cd/i.test(requirement)) {
    return `${prefix} the environment, deployment or infrastructure task, tool used, and reliability, scale, or delivery result.`;
  }
  if (/lead|collaborat|stakeholder|communicat|mentor|cross-functional|team/i.test(requirement)) {
    return `${prefix} the team or stakeholder context, your communication or leadership action, and the decision, delivery, or alignment result.`;
  }
  return `${prefix} the exact requirement wording, a concrete project or system, your action, and the outcome you can truthfully support.`;
}

function resumeSectionForAtsIssue(issue) {
  if (/summary/i.test(issue)) return "Professional Summary";
  if (/education/i.test(issue)) return "Education";
  if (/experience|dates|bullet|measurable/i.test(issue)) return "Experience";
  if (/skill/i.test(issue)) return "Skills";
  return "Header or relevant resume section";
}

function atsEvidenceDetail(issue) {
  if (/summary/i.test(issue)) return "A 2-3 line summary with target-role language and one truthful strength.";
  if (/bullet/i.test(issue)) return "Short bullets that start with action verbs and describe outcomes.";
  if (/measurable/i.test(issue)) return "A truthful number, scale, frequency, or observable result.";
  return `A clearly labeled ${issue.toLowerCase()} section or detail.`;
}

function shortenText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
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
