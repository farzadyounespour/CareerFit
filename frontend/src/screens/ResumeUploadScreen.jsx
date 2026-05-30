import {
  ArrowRight,
  CheckCircle2,
  ClipboardPaste,
  FileCheck2,
  FileText,
  Info,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

export default function ResumeUploadScreen({
  resumeText,
  onChange,
  onLoadSample,
  onUpload,
  isUploading,
  uploadStatus,
  uploadError,
  onNext,
  onDelete,
}) {
  const wordCount = countWords(resumeText);
  const hasResume = resumeText.trim().length > 0;
  const resumeStatus = getResumeStatus(wordCount);

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

      <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
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

            <label className="mt-5 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:border-teal hover:bg-emerald-50/40">
              <Upload size={25} className="text-teal" />
              <span className="mt-3 text-sm font-semibold text-slate-700">
                {isUploading ? "Extracting resume text..." : "Choose a resume file"}
              </span>
              <span className="mt-1 text-xs leading-5 text-slate-500">
                CareerFit keeps the extracted text visible so you can check it before analysis.
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
              <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-700">
                {uploadError}
              </p>
            )}
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-teal" />
              <h3 className="font-semibold text-ink">ATS preparation</h3>
            </div>
            <div className="mt-4 space-y-3">
              <ChecklistItem text="Use clear section headings" />
              <ChecklistItem text="Include email, phone, and location" />
              <ChecklistItem text="Use readable bullet points" />
              <ChecklistItem text="Keep skills tied to evidence" />
            </div>
          </section>
        </div>

        <section className="rounded-md border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-md bg-sky-50 text-sky-700">
                <FileText size={19} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">Resume text preview</h3>
                <p className="text-sm text-slate-500">Review extracted text or paste your resume directly.</p>
              </div>
            </div>
            <ResumeBadge status={resumeStatus} />
          </div>

          <textarea
            value={resumeText}
            onChange={(event) => onChange(event.target.value)}
            className="mt-5 min-h-[460px] w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none"
            placeholder="Paste your resume content here, or choose a PDF, DOCX, or TXT file to extract the text automatically..."
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span>{wordCount.toLocaleString()} words</span>
              <span>{resumeText.length.toLocaleString()} characters</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info size={15} />
              Text remains editable before matching
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 flex justify-end">
        {hasResume && (
          <button
            type="button"
            onClick={onDelete}
            className="mr-3 inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50"
          >
            <Trash2 size={16} />
            Clear resume
          </button>
        )}
        <button
          type="button"
          onClick={onNext}
          disabled={!hasResume}
          className="inline-flex items-center gap-2 rounded-md bg-teal px-4 py-3 text-sm font-semibold text-white hover:bg-teal/90 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Continue to jobs
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}

function ChecklistItem({ text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600">
      <CheckCircle2 size={17} className="shrink-0 text-emerald-500" />
      <span>{text}</span>
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
