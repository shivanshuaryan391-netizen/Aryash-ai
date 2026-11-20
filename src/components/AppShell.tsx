import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarDays,
  ChevronRight,
  Dna,
  Flame,
  Home,
  LayoutDashboard,
  Menu,
  Search,
  ShieldAlert,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { TOOLS_CATALOG } from '../data/toolsCatalog';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import type { AppRoute } from '../types';
import { BrandMark } from './BrandMark';

interface AppShellProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute, context?: { toolId?: string; subject?: string; topic?: string }) => void;
  store: LearningStoreApi;
  children: ReactNode;
}

const NAV_ITEMS: { route: AppRoute; label: string; icon: typeof LayoutDashboard }[] = [
  { route: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { route: 'tutor', label: 'AI Tutor Studio', icon: Brain },
  { route: 'learning-dna', label: 'Learning DNA', icon: Dna },
  { route: 'quiz', label: 'Adaptive Quiz', icon: BookOpenCheck },
  { route: 'mistakes', label: 'Mistake Vault', icon: ShieldAlert },
  { route: 'planner', label: 'Study Planner', icon: CalendarDays },
  { route: 'analytics', label: 'Analytics', icon: BarChart3 },
  { route: 'tools', label: 'Tools Hub (36)', icon: Wrench },
];

const ROUTE_TITLES: Record<AppRoute, string> = {
  landing: 'Home',
  dashboard: 'Student Dashboard',
  tutor: 'AI Tutor Studio',
  'learning-dna': 'Learning DNA Engine',
  quiz: 'Adaptive Quiz Arena',
  mistakes: 'Mistake Memory Vault',
  planner: 'Smart Study Planner',
  analytics: 'Progress Analytics',
  tools: 'Student Productivity Toolkit',
};

export function AppShell({ activeRoute, onNavigate, store, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [query, setQuery] = useState('');

  const [nameInput, setNameInput] = useState(store.state.profile.name);
  const [examInput, setExamInput] = useState(store.state.profile.targetExam);
  const [goalMinInput, setGoalMinInput] = useState(String(store.state.profile.dailyGoalMinutes));

  useEffect(() => {
    setNameInput(store.state.profile.name);
    setExamInput(store.state.profile.targetExam);
    setGoalMinInput(String(store.state.profile.dailyGoalMinutes));
  }, [store.state.profile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setProfileOpen(false);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matchedPages = NAV_ITEMS.filter((n) => !q || n.label.toLowerCase().includes(q));
    const matchedTools = TOOLS_CATALOG.filter(
      (t) =>
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.categoryLabel.toLowerCase().includes(q)
    ).slice(0, 8);
    const matchedMistakes = store.state.mistakes
      .filter((m) => !q || m.topic.toLowerCase().includes(q) || m.misconceptionTag.toLowerCase().includes(q))
      .slice(0, 4);
    return { matchedPages, matchedTools, matchedMistakes };
  }, [query, store.state.mistakes]);

  const openMistakesCount = store.state.mistakes.filter((m) => !m.resolved).length;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile({
      name: nameInput.trim() || 'Student',
      targetExam: examInput.trim() || 'General Academics',
      dailyGoalMinutes: Math.max(15, Math.min(480, Number(goalMinInput) || 60)),
    });
    setProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#080B18] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-[260px] shrink-0 border-r border-slate-800/70 bg-[#0A0E20] sticky top-0 h-screen">
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/60">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left cursor-pointer group"
          >
            <BrandMark size={28} />
            <span className="font-display font-bold text-base tracking-tight text-white whitespace-nowrap">
              ARYASH AI
            </span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            title="Back to Homepage"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors cursor-pointer"
            aria-label="Go to landing page"
          >
            <Home className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pt-4 pb-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#0F152D] border border-slate-800/90 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 shrink-0" />
              Search pages & 36 tools...
            </span>
            <kbd className="font-mono text-[10px] text-slate-500">Ctrl K</kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5" aria-label="Primary Workspace Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => onNavigate(item.route)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-indigo-500/15 text-white border border-indigo-400/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/45 border border-transparent'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.route === 'mistakes' && openMistakesCount > 0 && (
                  <span className="font-mono text-xs tabular-nums text-amber-300">{openMistakesCount}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Student Profile & Progress Summary */}
        <div className="p-4 border-t border-slate-800/70 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="tabular-nums font-mono text-slate-200">{store.dna.streakDays}d</span> streak
            </span>
            <span className="font-mono tabular-nums text-indigo-300">
              Lvl {store.dna.levelNumber} · {store.dna.totalXP} XP
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.round((store.dna.xpIntoLevel / store.dna.xpForNextLevel) * 100))}%` }}
            />
          </div>
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-400/25 flex items-center justify-center text-indigo-300 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-100 truncate">{store.state.profile.name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {store.state.isDemoData ? 'Sample Demo Dataset' : 'Local Student Storage'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Compact Workspace Top Bar (<= 56px height to respect 15% mobile sticky cap) */}
        <header className="h-14 sticky top-0 z-30 bg-[#080B18]/90 backdrop-blur-md border-b border-slate-800/70 px-4 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:bg-slate-800/70 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">ARYASH AI</span>
              <span className="text-slate-600 hidden sm:inline">/</span>
              <h1 className="font-display font-semibold text-slate-100 truncate">{ROUTE_TITLES[activeRoute]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/70 cursor-pointer"
              aria-label="Search tools and pages"
            >
              <Search className="w-4 h-4" />
            </button>
            {store.state.isDemoData && (
              <span className="hidden md:inline text-xs text-amber-300 font-medium whitespace-nowrap">
                Sample Demo Data Active
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigate(activeRoute === 'tutor' ? 'quiz' : 'tutor')}
              className="aryash-primary-btn px-3.5 py-2 rounded-lg text-xs font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              {activeRoute === 'tutor' ? 'Take Adaptive Quiz' : 'Ask AI Tutor'}
            </button>
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[#0A0E20] border-r border-slate-800 flex flex-col h-full">
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <BrandMark size={26} />
                <span className="font-display font-bold text-white">ARYASH AI</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <button
                type="button"
                onClick={() => {
                  onNavigate('landing');
                  setMobileOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Landing Page
              </button>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeRoute === item.route;
                return (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => {
                      onNavigate(item.route);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer ${
                      active ? 'bg-indigo-500/15 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setProfileOpen(true);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 text-left cursor-pointer"
              >
                Student Profile & Storage Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Command Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setSearchOpen(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-[#0D1226] border border-slate-700/80 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800">
              <Search className="w-4 h-4 text-indigo-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to any page, 36 productivity tools, or tracked mistake..."
                className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
              {searchResults.matchedPages.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-slate-500">Workspace Pages</p>
                  <div className="space-y-0.5">
                    {searchResults.matchedPages.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.route}
                          type="button"
                          onClick={() => {
                            onNavigate(p.route);
                            setSearchOpen(false);
                            setQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-indigo-500/15 hover:text-white transition-colors text-left cursor-pointer"
                        >
                          <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {searchResults.matchedTools.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-slate-500">Student Productivity Tools</p>
                  <div className="space-y-0.5">
                    {searchResults.matchedTools.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onNavigate('tools', { toolId: t.id });
                          setSearchOpen(false);
                          setQuery('');
                        }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-left hover:bg-indigo-500/15 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-slate-100 truncate">
                            {t.number}. {t.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{t.categoryLabel}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchResults.matchedMistakes.length > 0 && (
                <div>
                  <p className="px-2 pb-1.5 text-xs font-medium text-slate-500">Mistake Memory Vault</p>
                  <div className="space-y-0.5">
                    {searchResults.matchedMistakes.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          onNavigate('mistakes');
                          setSearchOpen(false);
                          setQuery('');
                        }}
                        className="w-full px-3 py-2 rounded-lg text-left hover:bg-indigo-500/15 transition-colors cursor-pointer"
                      >
                        <p className="text-sm text-slate-100 truncate">{m.misconceptionTag}</p>
                        <p className="text-xs text-slate-400 truncate">
                          {m.subject} · {m.topic}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Optional Local Profile & Data Mode Modal */}
      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs" onClick={() => setProfileOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#0D1226] border border-slate-700/80 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Student Profile & Storage</h2>
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close profile dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              ARYASH AI stores your progress privately in browser localStorage—no paid cloud database or mandatory account required.
            </p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Exam / Goal</label>
                <input
                  type="text"
                  value={examInput}
                  onChange={(e) => setExamInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Daily Study Goal (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={goalMinInput}
                  onChange={(e) => setGoalMinInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-700 text-sm text-white tabular-nums focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="aryash-primary-btn px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-800 space-y-2.5">
              <p className="text-xs font-medium text-slate-300">Dataset Controls</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    store.loadDemoData();
                    setProfileOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
                >
                  Load Sample Student Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    store.resetToFreshWorkspace();
                    setProfileOpen(false);
                  }}
                  className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-950/30 hover:bg-rose-950/60 text-xs font-medium text-rose-200 transition-colors cursor-pointer"
                >
                  Clear All Local Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
