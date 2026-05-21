export default function ScoreRing({ label, value, tone = "teal" }) {
  const color = tone === "amber" ? "#b7791f" : "#0f766e";
  const background = `conic-gradient(${color} ${value * 3.6}deg, #e2e8f0 0deg)`;

  return (
    <div className="flex items-center gap-4 rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <div
        className="grid h-24 w-24 shrink-0 place-items-center rounded-full"
        style={{ background }}
        aria-label={`${label}: ${value}%`}
      >
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white text-xl font-semibold text-ink">
          {value}%
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-1 text-sm text-slate-600">
          {value >= 75
            ? "Strong fit"
            : value >= 50
              ? "Promising, needs tailoring"
              : "Needs focused improvement"}
        </p>
      </div>
    </div>
  );
}

