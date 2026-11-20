import {
  AlertCircle,
  ArrowRight,
  Brain,
  Database,
  Dna,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import type { AppRoute, ExplanationAngle } from '../types';

interface LearningDNAPageProps {
  store: LearningStoreApi;
  onNavigate: (route: AppRoute, context?: { subject?: string; topic?: string }) => void;
}

const ANGLE_NAMES: Record<ExplanationAngle, string> = {
  simple: 'Simple Intuition Mode',
  realLife: 'Real-Life Analogy Mode',
  technical: 'Technical Academic Mode',
  stepByStep: 'Step-by-Step Derivation Mode',
};

export function LearningDNAPage({ store, onNavigate }: LearningDNAPageProps) {
  const { dna, state } = store;

  const radarData =
    dna.subjectSummaries.length >= 3
      ? dna.subjectSummaries.slice(0, 6).map((s) => ({
          subject: s.subject,
          mastery: s.averageMastery,
        }))
      : [];

  const angleChartData = (Object.entries(state.angleClicks) as [ExplanationAngle, number][]).map(
    ([angle, clicks]) => ({
      mode: ANGLE_NAMES[angle].replace(' Mode', ''),
      interactions: clicks,
    })
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-300">
            Learning DNA Engine · {state.isDemoData ? 'Sample Demo Dataset' : 'Computed From Live Local History'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Your Cognitive Learning Profile
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Every mastery estimate, confidence level, knowledge gap, and misconception pattern below is derived strictly from your recorded quizzes, AI Tutor sessions, and Mistake Vault entries.
          </p>
        </div>

        {!dna.hasSufficientData && !state.isDemoData && (
          <button
            type="button"
            onClick={store.loadDemoData}
            className="px-4 py-2 rounded-xl border border-indigo-400/35 bg-indigo-500/15 hover:bg-indigo-500/25 text-xs font-medium text-indigo-100 inline-flex items-center gap-2 cursor-pointer whitespace-nowrap self-start"
          >
            <Database className="w-3.5 h-3.5" />
            Preview With Sample Data
          </button>
        )}
      </div>

      {/* Honest Insufficient Data Diagnostic */}
      {!dna.hasSufficientData && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-display text-base font-semibold text-amber-100">
                Insufficient Data for Full Learning DNA Calibration ({dna.totalInteractions} / {dna.minimumRequiredInteractions} interactions)
              </h3>
              <p className="text-xs text-amber-200/85 leading-relaxed max-w-3xl">
                ARYASH AI refuses to invent fake strengths or fabricated weak spots. Complete at least {dna.minimumRequiredInteractions} study interactions (AI Tutor breakdowns, Adaptive Quizzes, or logged mistakes) so your cognitive profile reflects genuine performance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('tutor')}
              className="aryash-primary-btn px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
            >
              Ask First Tutor Concept
            </button>
            <button
              type="button"
              onClick={() => onNavigate('quiz')}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-[#0D1226] hover:bg-slate-800 text-xs font-medium text-white cursor-pointer"
            >
              Take 5-Question Diagnostic Quiz
            </button>
          </div>
        </div>
      )}

      {/* Core DNA Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl aryash-surface-solid p-5 space-y-1.5">
          <p className="text-xs text-slate-400">Overall Mastery Estimate</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-white">
            {dna.topicMetrics.length > 0 ? `${dna.overallMastery}%` : 'Insufficient'}
          </p>
          <p className="text-xs text-slate-500">Weighted across {dna.topicMetrics.length} tracked topic(s)</p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-1.5">
          <p className="text-xs text-slate-400">Evidence Confidence</p>
          <p className="font-mono text-3xl font-bold tabular-nums text-indigo-300">
            {dna.topicMetrics.length > 0 ? `${dna.overallConfidence}%` : '0%'}
          </p>
          <p className="text-xs text-slate-500">Grows as you verify tutor lessons with quizzes</p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-1.5">
          <p className="text-xs text-slate-400">Adaptive Quiz Difficulty</p>
          <p className="font-display text-2xl font-bold text-white">{dna.recommendedDifficulty}</p>
          <p className="text-xs text-slate-500">
            {dna.quizAverage !== null ? `Based on ${dna.quizAverage}% quiz accuracy` : 'Default profile level'}
          </p>
        </div>

        <div className="rounded-2xl aryash-surface-solid p-5 space-y-1.5">
          <p className="text-xs text-slate-400">Dominant Learning Mode</p>
          <p className="font-display text-lg font-bold text-blue-300">
            {dna.dominantAngle ? ANGLE_NAMES[dna.dominantAngle] : 'Not Yet Detected'}
          </p>
          <p className="text-xs text-slate-500">Tracked from Three-Way Tutor exploration</p>
        </div>
      </section>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-white">Subject Mastery Geometry</h3>
              <p className="text-xs text-slate-400">Comparison of mastery scores across studied subjects.</p>
            </div>
            <Dna className="w-4 h-4 text-indigo-400" />
          </div>

          {radarData.length >= 3 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1E294B" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 10 }} />
                  <Radar
                    name="Mastery %"
                    dataKey="mastery"
                    stroke="#6366F1"
                    fill="#6366F1"
                    fillOpacity={0.32}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1226',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : dna.subjectSummaries.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dna.subjectSummaries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E294B" />
                  <XAxis dataKey="subject" tick={{ fill: '#CBD5E1', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0D1226',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="averageMastery" name="Mastery %" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-center text-xs text-slate-500">
              Study at least 1 subject in AI Tutor Studio or Adaptive Quiz Arena to plot subject mastery.
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold text-white">Explanation Style Pattern</h3>
              <p className="text-xs text-slate-400">Which explanation angles you engage with most in Tutor Studio.</p>
            </div>
            <Brain className="w-4 h-4 text-blue-400" />
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={angleChartData} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E294B" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis type="category" dataKey="mode" width={135} tick={{ fill: '#CBD5E1', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0D1226',
                    borderColor: '#334155',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="interactions" name="Mode Views" fill="#3B82F6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Strong Subjects vs Weak Subjects & Knowledge Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Strong Subjects & Understood Topics
            </h3>
          </div>
          {dna.strongSubjects.length === 0 ? (
            <p className="text-xs text-slate-400">
              No subjects have crossed the 72% verified mastery threshold yet. Complete quizzes to confirm strengths.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {dna.strongSubjects.map((subj) => (
                <div key={subj.subject} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{subj.subject}</p>
                    <p className="text-xs text-slate-400">
                      Quiz accuracy: {subj.quizAccuracy !== null ? `${subj.quizAccuracy}%` : 'Not quizzed'} · {subj.totalMinutes} min studied
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold tabular-nums text-emerald-400">
                    {subj.averageMastery}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Detected Knowledge Gaps & Weak Areas
            </h3>
          </div>
          {dna.knowledgeGaps.length === 0 ? (
            <p className="text-xs text-slate-400">
              {dna.hasSufficientData
                ? 'Zero active knowledge gaps detected right now. Keep challenging yourself at higher difficulty.'
                : 'Knowledge gaps will appear here automatically once quiz mistakes or low-mastery topics are recorded.'}
            </p>
          ) : (
            <div className="divide-y divide-slate-800/70">
              {dna.knowledgeGaps.map((gap) => (
                <div
                  key={`${gap.subject}-${gap.topic}`}
                  className="py-3 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{gap.topic}</p>
                    <p className="text-xs text-slate-400">
                      {gap.subject} · Mastery {gap.masteryScore}% · {gap.unresolvedMistakes} open mistake(s)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('tutor', { subject: gap.subject, topic: gap.topic })}
                    className="text-xs font-medium text-indigo-300 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    Re-learn <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Recurring Misconceptions Table */}
      <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-base font-semibold text-white">Recurring Misconceptions Detected</h3>
            <p className="text-xs text-slate-400">Aggregated from Mistake Memory Vault and Adaptive Quiz Arena errors.</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('mistakes')}
            className="text-xs font-medium text-indigo-300 hover:text-white cursor-pointer"
          >
            Open Vault →
          </button>
        </div>

        {dna.recurringMisconceptions.length === 0 ? (
          <p className="text-xs text-slate-400">
            No misconceptions recorded yet. Incorrect quiz answers are automatically analyzed and grouped here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Misconception Pattern</th>
                  <th className="py-2.5 px-4 font-medium">Subject</th>
                  <th className="py-2.5 px-4 font-medium text-right">Occurrences</th>
                  <th className="py-2.5 pl-4 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dna.recurringMisconceptions.map((mc) => (
                  <tr key={`${mc.subject}-${mc.tag}`}>
                    <td className="py-3 pr-4 text-slate-100 font-medium">{mc.tag}</td>
                    <td className="py-3 px-4 text-slate-400">{mc.subject}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-300">{mc.count}x</td>
                    <td className="py-3 pl-4 text-right">
                      <span className={mc.resolvedCount > 0 ? 'text-emerald-400' : 'text-amber-300'}>
                        {mc.resolvedCount > 0 ? 'Resolved' : 'Active Gap'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
