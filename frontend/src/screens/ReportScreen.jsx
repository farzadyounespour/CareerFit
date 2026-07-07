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
  PenLine,
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
  const priorityActions = buildPriorityActions(skills, requirements, atsIssues, recommendations, priorityFixes);
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
            open={hasSemanticMatches}
          >
            <RequirementDetails requirements={requirements} />
          </ReportDisclosure>

          <TailoredResumeTemplate
            key={`${summary.target_role}-${resumeText}`}
            resumeText={resumeText}
            summary={summary}
            skills={skills}
            onUseTemplate={onUseResumeTemplate}
          />

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

function TailoredResumeTemplate({ resumeText, summary, skills, onUseTemplate }) {
  const [sections, setSections] = useState(() => buildResumeWorkspaceSections(resumeText, summary, skills));
  const [activeSectionId, setActiveSectionId] = useState("summary");
  const [copied, setCopied] = useState(false);
  const activeSection = sections.find((section) => section.id === activeSectionId) || sections[0];
  const draft = serializeResumeSections(sections);
  const placeholderCount = (draft.match(/\[[^\]]+\]/g) || []).length;
  const completedRequiredSections = sections.filter((section) => section.required && section.content.trim() && !section.content.includes("[")).length;
  const requiredSectionCount = sections.filter((section) => section.required).length;

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

  function updateSection(sectionId, content) {
    setSections((currentSections) => currentSections.map((section) => section.id === sectionId ? { ...section, content } : section));
  }

  return (
    <details id="resume-draft" className="group scroll-mt-24 rounded-md border border-slate-200 bg-white shadow-panel">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-teal">
          <PenLine size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">Resume draft workspace</span>
          <span className="mt-1 block text-sm leading-5 text-slate-500">
            Create a tailored plain-text resume only after you review the priority fixes.
          </span>
        </span>
        <span className="hidden rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600 sm:block">
          {placeholderCount ? `${placeholderCount} placeholders` : "Ready to review"}
        </span>
        <ChevronDown className="shrink-0 text-slate-400 transition group-open:rotate-180" size={18} />
      </summary>
      <div className="border-t border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">Resume tailoring workspace</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">Create a tailored resume version</h3>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Review each section, keep only truthful details, and replace bracketed placeholders before using the resume.
            </p>
          </div>
          <span className="rounded bg-white px-2 py-1 text-xs font-bold text-teal">Review required</span>
        </div>
      </div>
      <div className="grid divide-y divide-slate-100 xl:grid-cols-[220px_minmax(0,1fr)_360px] xl:divide-x xl:divide-y-0">
        <aside className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Sections</p>
          <div className="mt-3 space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                aria-label={`Edit ${section.label} section`}
                onClick={() => setActiveSectionId(section.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold ${activeSectionId === section.id ? "bg-emerald-50 text-teal" : "text-slate-600 hover:bg-slate-50 hover:text-teal"}`}
              >
                {section.label}
                {section.required && <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Required</span>}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Readiness</p>
            <p className="mt-2 text-sm font-semibold text-ink">{completedRequiredSections} of {requiredSectionCount} core sections reviewed</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{placeholderCount ? `${placeholderCount} placeholder${placeholderCount === 1 ? "" : "s"} still need truthful detail.` : "No bracketed placeholders remain."}</p>
          </div>
        </aside>

        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{activeSection.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{activeSection.helper}</p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">Section editor</span>
          </div>
          <textarea
            aria-label={`Edit ${activeSection.label}`}
            value={activeSection.content}
            onChange={(event) => updateSection(activeSection.id, event.target.value)}
            className="mt-4 min-h-[360px] w-full resize-y rounded-md border border-slate-300 bg-white px-4 py-4 font-mono text-sm leading-6 text-slate-700 focus:border-teal focus:outline-none"
          />
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Truthfulness check</p>
            <p className="mt-1 text-xs leading-5 text-amber-900">
              Remove any line you cannot support in an interview. Add job keywords only when your real work or projects prove them.
            </p>
          </div>
        </div>

        <aside className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Resume preview</p>
            <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-teal">ATS plain text</span>
          </div>
          <div className="mt-4 max-h-[620px] overflow-auto rounded-md border border-slate-200 bg-white p-4 shadow-sm">
            <ResumePreview sections={sections} />
          </div>
        </aside>
      </div>
      <div className="border-t border-slate-100 p-5">
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={copyDraft} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Copy size={16} />
            {copied ? "Copied resume" : "Copy resume"}
          </button>
          <button type="button" onClick={downloadDraft} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal">
            <Download size={16} />
            Download TXT
          </button>
          <button type="button" onClick={() => onUseTemplate(draft)} className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90">
            Use this resume version
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </details>
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

function ResumePreview({ sections }) {
  const header = sections.find((section) => section.id === "header");
  const bodySections = sections.filter((section) => section.id !== "header" && section.content.trim());
  const headerLines = (header?.content || "").split(/\r?\n/).filter(Boolean);
  return (
    <div className="text-sm leading-6 text-slate-700">
      <div className="border-b border-slate-200 pb-3 text-center">
        <p className="text-lg font-bold uppercase tracking-wide text-ink">{headerLines[0] || "[Your name]"}</p>
        {headerLines.slice(1).map((line) => (
          <p key={line} className="text-xs text-slate-500">{line}</p>
        ))}
      </div>
      <div className="mt-4 space-y-4">
        {bodySections.map((section) => (
          <section key={section.id}>
            <p className="border-b border-slate-200 pb-1 text-xs font-bold uppercase tracking-wide text-teal">{section.outputLabel}</p>
            <div className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-700">{section.content}</div>
          </section>
        ))}
      </div>
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
            <AiRecommendationDetails item={item} />
            {item.status === "accepted" && <p className="mt-2 text-xs font-semibold text-emerald-700">Added to your tailoring checklist</p>}
          </article>
        ))}
      </div>
    </section>
  );
}

function AiRecommendationDetails({ item }) {
  const detailItems = [
    ["Job ask", item.job_requirement],
    ["Resume evidence", item.resume_evidence],
    ["Where to add", item.where_to_add],
    ["What to add", item.what_to_add],
  ].filter(([, value]) => value);

  if (!detailItems.length && !item.bullet_template && !item.truthfulness_note) return null;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      {!!detailItems.length && (
        <div className="grid gap-2 sm:grid-cols-2">
          {detailItems.map(([label, value]) => (
            <div key={label} className="rounded bg-white px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      )}
      {item.bullet_template && (
        <div className="mt-2 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-teal">Suggested resume bullet</p>
          <p className="mt-1 text-xs leading-5 text-slate-700">{item.bullet_template}</p>
        </div>
      )}
      {item.truthfulness_note && (
        <p className="mt-2 text-xs leading-5 text-slate-500">
          <span className="font-semibold text-slate-600">Truthfulness note: </span>
          {item.truthfulness_note}
        </p>
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

function buildPriorityActions(skills, requirements, atsIssues, recommendations, backendFixes = []) {
  if (backendFixes.length) {
    return backendFixes
      .filter((item) => isActionableRequirement({ text: `${item.title || ""} ${item.detail || ""} ${item.jobSignal || ""}` }))
      .map(normalizePriorityFix)
      .slice(0, 5);
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
      evidenceNeeded: "One truthful bullet that maps your work directly to this requirement.",
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
      evidenceNeeded: "Add the method, context, and measurable or observable result.",
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

  return uniqueActions(actions).slice(0, 5);
}

function normalizePriorityFix(fix) {
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
  };
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

function buildResumeWorkspaceSections(resumeText, summary, skills) {
  const parsed = parseResumeSections(resumeText);
  const candidateName = parsed.header[0] || summary.candidate_name || "[Your name]";
  const contactLines = parsed.header.slice(1);
  const targetRole = summary.target_role || "[Target role]";
  const detectedSkills = skills.matched.length ? skills.matched.join(", ") : "[Add your relevant skills]";
  return [
    {
      id: "header",
      label: "Header",
      outputLabel: "",
      required: true,
      helper: "Confirm your name, target role, and contact details. Keep this short and recruiter-friendly.",
      content: [
        candidateName,
        targetRole,
        contactLines.length ? contactLines.join(" | ") : "[Email] | [Phone] | [City, Province or State]",
      ].join("\n"),
    },
    {
      id: "summary",
      label: "Professional summary",
      outputLabel: "Professional Summary",
      required: true,
      helper: "Use 2-3 lines that connect your real background to the selected job.",
      content: sectionText(parsed.sections.summary, `[Write 2-3 lines about your real experience relevant to ${targetRole}. Mention your strongest skills and one truthful result.]`),
    },
    {
      id: "skills",
      label: "Skills",
      outputLabel: "Skills",
      required: true,
      helper: "Group skills that are supported by your resume. Do not add unsupported keywords.",
      content: sectionText(parsed.sections.skills, detectedSkills),
    },
    {
      id: "experience",
      label: "Experience",
      outputLabel: "Experience",
      required: true,
      helper: "Use role, organization, dates, and outcome-focused bullets. Add numbers only when truthful.",
      content: sectionText(parsed.sections.experience, "[Role or project] | [Organization] | [Dates]\n- [Describe a real action and its result. Add a truthful number when possible.]"),
    },
    {
      id: "projects",
      label: "Projects",
      outputLabel: "Projects",
      required: false,
      helper: "Use this for academic, portfolio, or personal projects that support missing job evidence.",
      content: sectionText(parsed.sections.projects, ""),
    },
    {
      id: "education",
      label: "Education",
      outputLabel: "Education",
      required: true,
      helper: "Keep education simple: degree, school, dates, and relevant coursework if useful.",
      content: sectionText(parsed.sections.education, "[Degree or diploma] | [School] | [Graduation year]"),
    },
    {
      id: "certifications",
      label: "Certifications",
      outputLabel: "Certifications",
      required: false,
      helper: "Include this only when you have a relevant credential. Leave blank otherwise.",
      content: sectionText(parsed.sections.certifications, ""),
    },
  ];
}

function serializeResumeSections(sections) {
  const header = sections.find((section) => section.id === "header")?.content.trim();
  const body = sections
    .filter((section) => section.id !== "header" && section.content.trim())
    .map((section) => `${section.outputLabel.toUpperCase()}\n${section.content.trim()}`);
  return [header, ...body].filter(Boolean).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
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
