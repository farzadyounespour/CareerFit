const toneClasses = {
  matched: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-blue-200 bg-blue-50 text-blue-800",
  weak: "border-amber-200 bg-amber-50 text-amber-800",
  missing: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function RequirementGroup({ title, items, tone }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <span className={`rounded px-2 py-1 text-xs font-semibold ${toneClasses[tone]}`}>
          {items.length}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No requirements in this category.</p>
        ) : (
          items.map((item) => (
            <article key={`${item.text}-${item.score}`} className="border-t border-slate-100 pt-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-800">{item.text}</p>
                <span className="shrink-0 text-sm font-semibold text-slate-500">{item.score}%</span>
              </div>
              {item.evidence.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.evidence.map((word) => (
                    <span key={word} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {word}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

