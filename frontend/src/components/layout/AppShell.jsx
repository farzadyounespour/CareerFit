import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileText,
  Gauge,
  History,
  Home,
  LogIn,
  Moon,
  Sun,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useEffect, useRef } from "react";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: ChartNoAxesCombined },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "job", label: "Jobs", icon: BriefcaseBusiness },
  { id: "report", label: "Report", icon: Gauge },
  { id: "history", label: "Tracker", icon: History },
];

export default function AppShell({ activeScreen, onNavigate, isSignedIn, currentUser, onAuthOpen, onSignOut, onHistory, isDarkMode, onToggleDarkMode, children }) {
  const navRef = useRef(null);
  const activeItemRef = useRef(null);

  useEffect(() => {
    function centerActiveTab() {
      const nav = navRef.current;
      const activeItem = activeItemRef.current;
      if (!nav || !activeItem) return;
      nav.scrollTo({
        left: activeItem.offsetLeft - ((nav.clientWidth - activeItem.clientWidth) / 2),
        behavior: "smooth",
      });
    }

    centerActiveTab();
    window.addEventListener("resize", centerActiveTab);
    return () => window.removeEventListener("resize", centerActiveTab);
  }, [activeScreen]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => onNavigate("home")} className="flex items-center gap-3 text-left">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-teal text-white">
              <BriefcaseBusiness size={22} />
            </span>
            <span>
              <span className="block text-xl font-semibold text-ink">CareerFit</span>
              <span className="block text-sm font-medium text-slate-500">Application readiness</span>
            </span>
          </button>

          <nav ref={navRef} className="order-3 w-full overflow-x-auto lg:order-2 lg:w-auto">
            <div className="flex min-w-max rounded-md border border-slate-200 bg-slate-50 p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;

                return (
                  <button
                    key={item.id}
                    ref={isActive ? activeItemRef : null}
                    type="button"
                    onClick={() => item.id === "history" ? onHistory() : onNavigate(item.id)}
                    className={`inline-flex h-10 items-center gap-2 rounded px-3 text-sm font-semibold ${
                      isActive
                        ? "bg-teal text-white shadow-sm"
                        : "text-slate-600 hover:bg-white hover:text-ink"
                    }`}
                  >
                    <Icon size={16} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="order-2 flex flex-wrap items-center gap-2 lg:order-3">
            <button
              type="button"
              title={isDarkMode ? "Use light mode" : "Use dark mode"}
              aria-label={isDarkMode ? "Use light mode" : "Use dark mode"}
              onClick={onToggleDarkMode}
              className="rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:border-teal hover:text-teal"
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {isSignedIn ? (
              <>
                <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
                  {currentUser?.name || currentUser?.email}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onAuthOpen("login")}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
                >
                  <LogIn size={16} />
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => onAuthOpen("create")}
                  className="inline-flex items-center gap-2 rounded-md bg-teal px-3 py-2 text-sm font-semibold text-white hover:bg-teal/90"
                >
                  <UserPlus size={16} />
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
