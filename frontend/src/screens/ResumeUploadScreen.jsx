import { ClipboardPaste, Upload } from "lucide-react";

export default function ResumeUploadScreen({
  resumeText,
  onChange,
  onLoadSample,
  onUpload,
  isUploading,
  uploadStatus,
  uploadError,
  onNext,
}) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Resume upload</h2>
          <p className="mt-1 text-slate-600">Paste resume text or upload a PDF, DOCX, or TXT resume.</p>
        </div>
        <button
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ClipboardPaste size={16} />
          Load sample
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <label className="block rounded-md border border-slate-200 bg-white p-4 shadow-panel">
          <span className="text-sm font-medium text-slate-700">Resume text</span>
          <textarea
            value={resumeText}
            onChange={(event) => onChange(event.target.value)}
            className="mt-3 min-h-[420px] w-full resize-y rounded-md border border-slate-300 px-3 py-3 text-sm leading-6 focus:border-teal focus:outline-none"
            placeholder="Paste your resume content here..."
          />
        </label>

        <aside className="rounded-md border border-dashed border-slate-300 bg-white p-5">
          <div className="grid h-14 w-14 place-items-center rounded-md bg-mist text-teal">
            <Upload size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-ink">Upload resume</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Extract text from a resume file and review it before matching.
          </p>
          <label className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Upload size={16} />
            {isUploading ? "Uploading..." : "Choose file"}
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
            <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {uploadStatus}
            </p>
          )}
          {uploadError && (
            <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {uploadError}
            </p>
          )}
        </aside>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
        >
          Continue to job
        </button>
      </div>
    </section>
  );
}
