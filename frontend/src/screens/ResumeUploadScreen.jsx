import {
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileCheck2,
  FileText,
  FolderOpen,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";

export default function ResumeUploadScreen({
  resumeText,
  onChange,
  onLoadSample,
  onUpload,
  isUploading,
  uploadStatus,
  uploadError,
  onDismissError,
  onNext,
  onDelete,
  resumeVersions = [],
  onSaveVersion = () => {},
  onLoadVersion = () => {},
  onDeleteVersion = () => {},
}) {
  const [versionTitle, setVersionTitle] = useState("");
  const wordCount = countWords(resumeText);
  const hasResume = resumeText.trim().length > 0;
  const resumeStatus = getResumeStatus(wordCount);
  const atsChecks = getAtsChecks(resumeText);
  const passedChecks = atsChecks.filter((item) => item.passed).length;

  return (
    <section className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">Resume workspace</p>
          <h2 className="mt-2 text-3xl font-semibold text-ink">Add the resume you want to improve</h2>
          <p className="mt-2 max-w-2xl text-slate-600">
            Upload your current resume or paste the text manually. CareerFit extracts the content so you can review it before matching.
          </p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
        >
          <ClipboardPaste size={16} />
          Load sample resume
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-md bg-emerald-50 text-teal">
                <Upload size={20} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Upload resume</h3>
                <p className="text-sm text-slate-500">PDF, DOCX, or TXT up to 5 MB</p>
              </div>
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-4 hover:border-teal hover:bg-emerald-50/40">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-white text-teal">
                <Upload size={22} />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-700">
                {isUploading ? "Extracting resume text..." : "Choose a resume file"}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-500">PDF, DOCX, or TXT up to 5 MB</span>
              </span>
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                disabled={isUploading}
                onChange={(event) => {
                  onUpload(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
            </label>

            {uploadStatus && (
              <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-700">
                {uploadStatus}
              </p>
            )}
            {uploadError && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
                <span>{uploadError}</span>
                <button type="button" title="Dismiss upload error" onClick={onDismissError} className="mt-0.5 shrink-0 rounded p-1 hover:bg-rose-100">
                  <X size={15} />
                </button>
              </div>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700">
                  <FileText size={19} />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">Resume text</h3>
                  <p className="text-sm text-slate-500">Review the extracted text or paste your resume.</p>
                </div>
              </div>
              <ResumeBadge status={resumeStatus} />
            </div>

            <textarea
              value={resumeText}
              onChange={(event) => onChange(event.target.value)}
              className="mt-5 min-h-[420px] w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none"
              placeholder="Paste your resume content here..."
            />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                <span>{wordCount.toLocaleString()} words</span>
                <span>{resumeText.length.toLocaleString()} characters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {hasResume && (
                  <button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 size={15} />
                    Clear resume
                  </button>
                )}
                <button type="button" onClick={onNext} disabled={!hasResume} className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-300">
                  Continue to jobs
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700"><FolderOpen size={18} /></span>
              <div>
                <h3 className="font-semibold text-ink">Saved versions</h3>
                <p className="text-sm text-slate-500">Tailored resume copies</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <input value={versionTitle} onChange={(event) => setVersionTitle(event.target.value)} className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal focus:outline-none" placeholder="Version name" />
              <button type="button" title="Save resume version" disabled={!hasResume || !versionTitle.trim()} onClick={() => {
                onSaveVersion(versionTitle.trim());
                setVersionTitle("");
              }} className="rounded-md bg-teal p-2 text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-300">
                <Save size={17} />
              </button>
            </div>
            <div className="mt-3 max-h-48 space-y-2 overflow-auto">
              {resumeVersions.length ? resumeVersions.map((resume) => (
                <div key={resume.id} className="flex items-center gap-1 rounded-md border border-slate-200 px-1 py-1 hover:border-teal hover:bg-emerald-50">
                  <button type="button" title={`Load ${resume.title}`} onClick={() => onLoadVersion(resume)} className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded px-2 py-1 text-left text-sm">
                    <span className="truncate font-semibold text-slate-700">{resume.title}</span>
                    <FolderOpen size={15} className="shrink-0 text-teal" />
                  </button>
                  <button type="button" title={`Remove ${resume.title}`} onClick={() => onDeleteVersion(resume.id)} className="shrink-0 rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              )) : <p className="text-sm leading-6 text-slate-500">No saved versions yet.</p>}
            </div>
          </section>

          <details className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <summary className="cursor-pointer list-none">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-teal" />
                <div>
                  <h3 className="font-semibold text-ink">ATS preparation</h3>
                  <p className="text-xs font-semibold text-slate-500">{passedChecks} of {atsChecks.length} checks ready</p>
                </div>
              </div>
            </summary>
            <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
              {atsChecks.map((item) => <ChecklistItem key={item.label} {...item} />)}
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}

function ChecklistItem({ label, passed }) {
  const Icon = passed ? CheckCircle2 : XCircle;
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <Icon size={17} className={passed ? "shrink-0 text-emerald-500" : "shrink-0 text-rose-400"} />
      <span>{label}</span>
    </div>
  );
}

function ResumeBadge({ status }) {
  const Icon = status.tone === "ready" ? FileCheck2 : FileText;
  const className = status.tone === "ready"
    ? "bg-emerald-50 text-emerald-700"
    : status.tone === "short"
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-500";

  return (
    <span className={`inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-semibold ${className}`}>
      <Icon size={14} />
      {status.label}
    </span>
  );
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function getResumeStatus(wordCount) {
  if (wordCount === 0) {
    return { label: "Waiting for resume", tone: "empty" };
  }
  if (wordCount < 50) {
    return { label: "Add more detail", tone: "short" };
  }
  return { label: "Ready to match", tone: "ready" };
}

function getAtsChecks(text) {
  const normalized = text.toLowerCase();
  return [
    {
      label: "Clear summary, skills, experience, and education headings",
      passed: ["summary", "skills", "experience", "education"].every((heading) => normalized.includes(heading)),
    },
    {
      label: "Email address included",
      passed: /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text),
    },
    {
      label: "Phone number included",
      passed: /(?:\+?\d[\d(). -]{8,}\d)/.test(text),
    },
    {
      label: "Location included",
      passed: /\b(location|address|city|province|state|remote|canada|united states|montreal|toronto|vancouver|ottawa|new york)\b/i.test(text),
    },
    {
      label: "Readable bullet points used",
      passed: /^\s*[-*•]\s+/m.test(text),
    },
    {
      label: "Resume length between 50 and 1,200 words",
      passed: countWords(text) >= 50 && countWords(text) <= 1200,
    },
    {
      label: "Experience dates included",
      passed: /\b(?:19|20)\d{2}\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/i.test(text),
    },
    {
      label: "Measurable achievements included",
      passed: /\b\d+(?:[.,]\d+)?%?\b/.test(text),
    },
    {
      label: "Paragraphs stay concise for scanning",
      passed: text.split("\n").filter((line) => line.trim()).every((line) => line.trim().split(/\s+/).length <= 55),
    },
  ];
}
