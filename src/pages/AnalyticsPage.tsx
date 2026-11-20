import { Database } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import { getWeeklyActivityChartData } from '../utils/intelligence';

interface AnalyticsPageProps {
  store: LearningStoreApi;
}

export function AnalyticsPage({ store }: AnalyticsPageProps) {
  const { state, dna } = store;

  const weeklyData = getWeeklyActivityChartData(state);
  const totalMinutes = state.studySessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const quizTrendData = [...state.quizAttempts]
    .reverse()
    .map((q, idx) => ({
      attempt: `#${idx + 1}`,
      title: q.topic,
      score: q.scorePercent,
    }));

  const topicChartData = dna.topicMetrics.slice(0, 8).map((t) => ({
    topic: t.topic.length > 18 ? `${t.topic.slice(0, 18)}…` : t.topic,
    mastery: t.masteryScore,
  }));

  return (
    <div className="space-y-8">
      {/* Header with explicit Real vs Demo Data provenance */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className={`text-xs font-medium ${state.isDemoData ? 'text-amber-300' : 'text-emerald-400'}`}>
            Data Provenance: {state.isDemoData ? 'Sample Demo Dataset (Illustrative)' : 'Real Local Student Activity'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">Progress Analytics</h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Track weekly study hours, quiz accuracy progression, topic mastery, and subject-level performance with transparent separation between real activity and sample demo data.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {state.isDemoData ? (
            <button
              type="button"
              onClick={store.resetToFreshWorkspace}
              className="px-4 py-2 rounded-xl border border-amber-500/40 bg-amber-950/30 hover:bg-amber-950/50 text-xs font-medium text-amber-200 cursor-pointer"
            >
              Clear Sample Data
            </button>
          ) : (
            <button
              type="button"
              onClick={store.loadDemoData}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-[#0D1226] hover:bg-slate-800 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Preview With Sample Data
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Total Study Time Logged</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-white">{totalHours}h</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">{totalMinutes} total minutes across {state.studySessions.length} session(s)</p>
        </div>
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Average Quiz Accuracy</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-indigo-300">
            {dna.quizAverage !== null ? `${dna.quizAverage}%` : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">{state.quizAttempts.length} quiz attempt(s)</p>
        </div>
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Mistake Resolution Rate</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-emerald-400">
            {state.mistakes.length > 0
              ? `${Math.round((state.mistakes.filter((m) => m.resolved).length / state.mistakes.length) * 100)}%`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {state.mistakes.filter((m) => m.resolved).length} / {state.mistakes.length} mistakes mastered
          </p>
        </div>
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Active Study Streak</p>
          <p className="mt-1 font-mono text-3xl font-bold tabular-nums text-amber-300">{dna.streakDays}d</p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">Level {dna.levelNumber} · {dna.totalXP} XP</p>
        </div>
      </section>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Weekly Study Time (Last 7 Days)</h3>
            <p className="text-xs text-slate-400">Minutes logged from Pomodoro, AI Tutor, Quizzes, and completed Planner blocks.</p>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="studyAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E294B" />
                <XAxis dataKey="label" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1226',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  name="Study Minutes"
                  stroke="#818CF8"
                  strokeWidth={2}
                  fill="url(#studyAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Quiz Improvement Trend</h3>
            <p className="text-xs text-slate-400">Score percentage progression across chronological quiz attempts.</p>
          </div>
          {quizTrendData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-center text-xs text-slate-500">
              Complete at least one Adaptive Quiz to visualize your score trajectory.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E294B" />
                  <XAxis dataKey="attempt" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1226',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Score %"
                    stroke="#38BDF8"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#38BDF8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </div>

      {/* Charts Row 2: Topic Mastery + Subject-Wise Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Topic Mastery Breakdown</h3>
            <p className="text-xs text-slate-400">Combined score from quiz recall, tutor sessions, and resolved mistakes.</p>
          </div>
          {topicChartData.length === 0 ? (
            <div className="h-[240px] flex items-center justify-center text-center text-xs text-slate-500">
              No topic metrics yet. Start studying in Tutor Studio or Quiz Arena.
            </div>
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E294B" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="topic" width={125} tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1226',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="mastery" name="Mastery %" fill="#4F46E5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Subject-Wise Performance</h3>
            <p className="text-xs text-slate-400">Direct comparison of mastery, quiz accuracy, open mistakes, and time invested.</p>
          </div>
          {dna.subjectSummaries.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No subjects logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 pr-3 font-medium">Subject</th>
                    <th className="py-2.5 px-3 font-medium text-right">Mastery</th>
                    <th className="py-2.5 px-3 font-medium text-right">Quiz Avg</th>
                    <th className="py-2.5 px-3 font-medium text-right">Mistakes</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {dna.subjectSummaries.map((s) => (
                    <tr key={s.subject}>
                      <td className="py-3 pr-3 font-medium text-white">{s.subject}</td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-indigo-300">
                        {s.averageMastery}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-200">
                        {s.quizAccuracy !== null ? `${s.quizAccuracy}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-300">
                        {s.unresolvedMistakes}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono tabular-nums text-slate-300">
                        {s.totalMinutes}m
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
