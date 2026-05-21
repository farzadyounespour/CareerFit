import { ClipboardPaste, Upload } from "lucide-react";

export default function ResumeUploadScreen({ resumeText, onChange, onLoadSample, onNext }) {
  return (
    <section className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Resume upload</h2>
          <p className="mt-1 text-slate-600">Paste resume text now. File parsing can plug into this screen later.</p>
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
          <h3 className="mt-4 font-semibold text-ink">Future upload support</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This section is separated so PDF and DOCX upload parsing can be added without redesigning the app.
          </p>
          <button
            type="button"
            disabled
            className="mt-4 w-full rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-400"
          >
            Upload disabled in MVP
          </button>
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

