import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Check,
  Database,
  Flame,
  ShieldAlert,
  Wrench,
} from 'lucide-react';
import { getToolById } from '../data/toolsCatalog';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import type { AppRoute } from '../types';
import { getTodayMinutes, getTodayQuestionsAnswered } from '../utils/intelligence';

interface DashboardPageProps {
  store: LearningStoreApi;
  onNavigate: (route: AppRoute, context?: { toolId?: string; subject?: string; topic?: string }) => void;
}

export function DashboardPage({ store, onNavigate }: DashboardPageProps) {
  const { state, dna } = store;
  const todayMinutes = getTodayMinutes(state);
  const todayQuestions = getTodayQuestionsAnswered(state);
  const goalPct = Math.min(100, Math.round((todayMinutes / Math.max(1, state.profile.dailyGoalMinutes)) * 100));
  const questionGoalPct = Math.min(
    100,
    Math.round((todayQuestions / Math.max(1, state.profile.dailyGoalQuestions)) * 100)
  );

  const todayIso = new Date().toISOString().slice(0, 10);
  const todaysTasks = state.tasks.filter((t) => !t.completed || t.dueDate === todayIso).slice(0, 5);
  const upcomingExams = state.exams.slice(0, 3);
  const quickToolIds = Array.from(
    new Set([...state.recentTools.map((r) => r.toolId), ...state.favoriteTools])
  ).slice(0, 6);
  const quickTools = quickToolIds.map((id) => getToolById(id)).filter((t): t is NonNullable<typeof t> => Boolean(t));

  const lastSession = state.tutorSessions[0];
  const unlockedAchievements = dna.achievements.filter((a) => a.unlocked);

  return (
    <div className="space-y-8">
      {/* Sample Data Banner / Fresh Start Banner */}
      {state.isDemoData ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <p className="text-amber-200">
            <span className="font-semibold">Sample Demo Dataset Loaded:</span> Metrics below reflect sample engineering student data so you can explore ARYASH AI immediately.
          </p>
          <button
            type="button"
            onClick={store.resetToFreshWorkspace}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-medium cursor-pointer whitespace-nowrap"
          >
            Switch to My Fresh Workspace
          </button>
        </div>
      ) : (
        dna.totalInteractions === 0 && (
          <div className="rounded-xl border border-indigo-500/25 bg-indigo-950/25 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Your workspace starts at 0% — zero fabricated numbers.</p>
              <p className="text-xs text-slate-300">
                Complete a lesson in AI Tutor Studio or an Adaptive Quiz to populate your Learning DNA, or load our clearly labeled sample student dataset to preview full analytics.
              </p>
            </div>
            <button
              type="button"
              onClick={store.loadDemoData}
              className="px-3.5 py-2 rounded-lg border border-indigo-400/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-medium text-indigo-100 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              Load Sample Student Data
            </button>
          </div>
        )
      )}

      {/* Welcome & Continue Learning */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1.5">
          <p className="text-xs text-indigo-300 font-medium">
            {state.profile.targetExam} · {state.profile.preferredLanguage} · {state.profile.learningLevel}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Welcome back, {state.profile.name}
          </h2>
          <p className="text-sm text-slate-400">
            {lastSession
              ? `Last studied ${lastSession.topic} (${lastSession.subject}). Pick up where you left off or tackle a recommended focus area.`
              : 'Choose a concept in AI Tutor Studio or launch a quick diagnostic quiz to activate adaptive guidance.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() =>
              lastSession
                ? onNavigate('tutor', { subject: lastSession.subject, topic: lastSession.topic })
                : onNavigate('tutor')
            }
            className="aryash-primary-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
          >
            Continue Learning
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate('quiz')}
            className="px-4 py-2.5 rounded-xl border border-slate-700 bg-[#0D1226] hover:bg-slate-800 text-sm font-medium text-slate-200 cursor-pointer whitespace-nowrap"
          >
            Practice Quiz
          </button>
        </div>
      </section>

      {/* Top 4 KPI Strip (All derived strictly from stored state) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl aryash-surface-solid p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daily Study Goal</span>
            <span className="font-mono tabular-nums text-indigo-300">{goalPct}%</span>
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {todayMinutes} <span className="text-sm font-normal text-slate-400">/ {state.profile.dailyGoalMinutes} min</span>
          </p>
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 tabular-nums">
            Questions today: {todayQuestions}/{state.profile.dailyGoalQuestions} ({questionGoalPct}%)
          </p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {dna.streakDays} <span className="text-sm font-normal text-slate-400">day{dna.streakDays === 1 ? '' : 's'}</span>
          </p>
          <p className="text-xs text-slate-400">
            {dna.streakDays > 0 ? 'Active streak tracked from logged sessions.' : 'Log a lesson, quiz, or Pomodoro to begin.'}
          </p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Experience & Level</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {dna.totalXP} <span className="text-sm font-normal text-slate-400">XP · Level {dna.levelNumber}</span>
          </p>
          <p className="text-xs text-slate-400 tabular-nums">
            {unlockedAchievements.length} / {dna.achievements.length} achievements unlocked
          </p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Mastery Snapshot</span>
            <ShieldAlert className="w-4 h-4 text-blue-400" />
          </div>
          <p className="font-mono text-2xl font-bold tabular-nums text-white">
            {dna.topicMetrics.length > 0 ? `${dna.overallMastery}%` : '—'}
          </p>
          <p className="text-xs text-slate-400">
            {state.mistakes.filter((m) => !m.resolved).length} open mistake(s) in Vault
          </p>
        </div>
      </section>

      {/* Primary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Recommended Next Lessons (Adaptive Engine) */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Adaptive Recommendations</h3>
                <p className="text-xs text-slate-400">Generated from your actual quiz scores, tutor sessions, and Mistake Vault.</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('learning-dna')}
                className="text-xs font-medium text-indigo-300 hover:text-white cursor-pointer whitespace-nowrap"
              >
                Full Learning DNA →
              </button>
            </div>

            <div className="divide-y divide-slate-800/70">
              {dna.recommendations.map((rec) => (
                <div key={rec.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className={rec.priority === 'High' ? 'text-amber-300 font-medium' : 'text-indigo-300 font-medium'}>
                        {rec.priority} Priority
                      </span>
                      <span>·</span>
                      <span>{rec.subject}</span>
                      <span>·</span>
                      <span>{rec.topic}</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{rec.title}</p>
                    <p className="text-xs text-slate-400">{rec.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (rec.actionType === 'mistake-drill') onNavigate('mistakes');
                      else if (rec.actionType === 'quiz') onNavigate('quiz', { subject: rec.subject, topic: rec.topic });
                      else onNavigate('tutor', { subject: rec.subject, topic: rec.topic });
                    }}
                    className="px-3.5 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-xs font-medium text-indigo-200 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {rec.ctaLabel}
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Topic Mastery & Weak Topics */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-semibold text-white">Topic Mastery & Weak Areas</h3>
                <p className="text-xs text-slate-400">Sorted from lowest mastery to highest so weak areas stay visible.</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('analytics')}
                className="text-xs font-medium text-indigo-300 hover:text-white cursor-pointer"
              >
                Analytics →
              </button>
            </div>

            {dna.topicMetrics.length === 0 ? (
              <div className="py-8 text-center space-y-2 border-t border-slate-800/70">
                <p className="text-sm text-slate-300">No tracked topics yet</p>
                <p className="text-xs text-slate-500">
                  Complete a Tutor Studio explanation or an Adaptive Quiz to map your real topic mastery.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {dna.topicMetrics.slice(0, 6).map((tm) => (
                  <div key={`${tm.subject}-${tm.topic}`} className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-medium text-slate-100 truncate">{tm.topic}</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">{tm.subject}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[11px] font-medium ${
                            tm.status === 'Mastered'
                              ? 'text-emerald-400'
                              : tm.status === 'Developing'
                                ? 'text-blue-300'
                                : 'text-amber-300'
                          }`}
                        >
                          {tm.status}
                        </span>
                        <span className="font-mono tabular-nums text-white">{tm.masteryScore}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tm.status === 'Mastered'
                            ? 'bg-emerald-500'
                            : tm.status === 'Developing'
                              ? 'bg-blue-500'
                              : 'bg-amber-500'
                        }`}
                        style={{ width: `${tm.masteryScore}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Learning Activity */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Recent Learning Activity</h3>
            {state.activities.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">
                Your activity stream is empty. Completed lessons, quizzes, Pomodoro sessions, and resolved mistakes will log here automatically.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {state.activities.slice(0, 6).map((act) => (
                  <div key={act.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{act.title}</p>
                      <p className="text-xs text-slate-400">
                        {act.subject} · {act.detail}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-xs tabular-nums text-indigo-300">+{act.xpEarned} XP</p>
                      <p className="text-[11px] text-slate-500">{act.timestamp.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right 4 Columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Today's Personalised Study Plan */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                Today’s Study Plan
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="text-xs text-indigo-300 hover:text-white cursor-pointer"
              >
                Manage →
              </button>
            </div>
            {todaysTasks.length === 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-xs text-slate-400">No study tasks scheduled yet.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('planner')}
                  className="w-full py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  Create Study Task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {todaysTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => store.toggleTaskComplete(task.id)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                          : 'border-slate-600 hover:border-indigo-400'
                      }`}
                      aria-label={`Mark ${task.title} complete`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-xs font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {task.subject} · {task.durationMinutes} min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Exams */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">Upcoming Exams</h3>
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="text-xs text-indigo-300 hover:text-white cursor-pointer"
              >
                Add Exam →
              </button>
            </div>
            {upcomingExams.length === 0 ? (
              <p className="text-xs text-slate-400">
                Add an upcoming exam in Smart Study Planner to track countdown days automatically.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {upcomingExams.map((exam) => {
                  const daysLeft = Math.ceil(
                    (new Date(exam.examDate).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={exam.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-100 truncate">{exam.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {exam.subject} · Target {exam.targetScore}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                          daysLeft <= 7 ? 'text-amber-300' : 'text-indigo-300'
                        }`}
                      >
                        {daysLeft >= 0 ? `${daysLeft}d left` : 'Completed'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Tool Access */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-indigo-400" />
                Quick Tools
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('tools')}
                className="text-xs text-indigo-300 hover:text-white cursor-pointer"
              >
                All 36 →
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {quickTools.map((tool) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onNavigate('tools', { toolId: tool.id })}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800/90 hover:border-indigo-500/40 text-xs text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
                >
                  <span className="truncate font-medium">
                    {String(tool.number).padStart(2, '0')}. {tool.name}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Achievements */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-white">Achievements</h3>
            <div className="space-y-2.5">
              {dna.achievements.map((ach) => (
                <div key={ach.id} className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <p className={ach.unlocked ? 'font-medium text-slate-100' : 'text-slate-500'}>{ach.title}</p>
                    <p className="text-[11px] text-slate-500">{ach.detail}</p>
                  </div>
                  <span className={`font-mono text-[11px] shrink-0 ${ach.unlocked ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {ach.unlocked ? 'Earned' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Direct Action Shortcuts */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => onNavigate('tutor')}
          className="rounded-xl aryash-surface-solid p-4 hover:border-indigo-500/40 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Three-Way AI Tutor</p>
            <p className="text-xs text-slate-400">Simple, Real-Life, Technical & Step-by-Step</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('quiz')}
          className="rounded-xl aryash-surface-solid p-4 hover:border-blue-500/40 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <BookOpenCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Adaptive Quiz Arena</p>
            <p className="text-xs text-slate-400">Recommended level: {dna.recommendedDifficulty}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate('mistakes')}
          className="rounded-xl aryash-surface-solid p-4 hover:border-amber-500/40 transition-colors text-left flex items-center gap-3 cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">Mistake Memory Vault</p>
            <p className="text-xs text-slate-400">Targeted drills for recurring errors</p>
          </div>
        </button>
      </section>
    </div>
  );
}
