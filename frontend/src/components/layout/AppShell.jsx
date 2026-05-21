import { BriefcaseBusiness, FileText, Gauge, UserRound } from "lucide-react";

const navItems = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "job", label: "Job", icon: BriefcaseBusiness },
  { id: "report", label: "Report", icon: Gauge },
];

export default function AppShell({ activeScreen, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal">CareerFit</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Application readiness</h1>
        </div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ${
                  isActive
                    ? "bg-teal text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="border-b border-slate-200 bg-white px-4 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">Explainable resume-job matching</p>
              <h2 className="text-xl font-semibold text-ink">CareerFit Workspace</h2>
            </div>
            <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 lg:hidden">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => onNavigate(item.id)}
                    className={`rounded p-2 ${
                      activeScreen === item.id ? "bg-teal text-white" : "text-slate-600"
                    }`}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

