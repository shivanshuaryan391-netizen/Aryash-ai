import { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { AiErrorBanner } from '../components/AiErrorBanner';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import { AiServiceError, requestMistakeDrill, type MistakeDrillResponse } from '../services/aiClient';
import type { MistakeRecord } from '../types';

interface MistakeVaultPageProps {
  store: LearningStoreApi;
}

export function MistakeVaultPage({ store }: MistakeVaultPageProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [showAddForm, setShowAddForm] = useState(false);

  // Manual entry form
  const [subject, setSubject] = useState('Physics');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [wrongAnswer, setWrongAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [whyWrong, setWhyWrong] = useState('');
  const [misconceptionTag, setMisconceptionTag] = useState('');

  // Targeted AI revision drill modal/drawer state
  const [drillingMistake, setDrillingMistake] = useState<MistakeRecord | null>(null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<{ message: string; code?: string } | null>(null);
  const [drillData, setDrillData] = useState<MistakeDrillResponse['data'] | null>(null);
  const [drillSelections, setDrillSelections] = useState<Record<number, number>>({});
  const [drillChecked, setDrillChecked] = useState(false);

  const subjects = ['All', ...Array.from(new Set(store.state.mistakes.map((m) => m.subject)))];

  const filteredMistakes = store.state.mistakes.filter((m) => {
    if (filter === 'open' && m.resolved) return false;
    if (filter === 'resolved' && !m.resolved) return false;
    if (subjectFilter !== 'All' && m.subject !== subjectFilter) return false;
    return true;
  });

  const openCount = store.state.mistakes.filter((m) => !m.resolved).length;
  const resolvedCount = store.state.mistakes.filter((m) => m.resolved).length;

  const handleAddManualMistake = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !question.trim()) return;
    store.addManualMistake({
      subject: subject.trim() || 'General',
      topic: topic.trim(),
      question: question.trim(),
      wrongAnswer: wrongAnswer.trim() || 'Misunderstood step',
      correctAnswer: correctAnswer.trim() || 'See explanation',
      whyWrong: whyWrong.trim() || 'Logged for conceptual revision.',
      misconceptionTag: misconceptionTag.trim() || `${topic.trim()} conceptual slip`,
      source: 'manual',
    });
    setTopic('');
    setQuestion('');
    setWrongAnswer('');
    setCorrectAnswer('');
    setWhyWrong('');
    setMisconceptionTag('');
    setShowAddForm(false);
  };

  const handleLaunchDrill = async (mistake: MistakeRecord) => {
    setDrillingMistake(mistake);
    setDrillData(null);
    setDrillError(null);
    setDrillSelections({});
    setDrillChecked(false);
    setDrillLoading(true);
    try {
      const res = await requestMistakeDrill({
        subject: mistake.subject,
        topic: mistake.topic,
        question: mistake.question,
        wrongAnswer: mistake.wrongAnswer,
        correctAnswer: mistake.correctAnswer,
        misconception: mistake.misconceptionTag,
      });
      setDrillData(res.data);
    } catch (err) {
      if (err instanceof AiServiceError) {
        setDrillError({ message: err.message, code: err.code });
      } else {
        setDrillError({ message: err instanceof Error ? err.message : 'Unable to generate revision drill.' });
      }
    } finally {
      setDrillLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-amber-300">
            Mistake Memory Vault · {openCount} Open · {resolvedCount} Resolved
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Eliminate Recurring Exam Mistakes
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Wrong answers from Adaptive Quiz Arena appear here automatically. Log manual homework/test errors too, diagnose why they happened, and run targeted AI cure drills.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="aryash-primary-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer self-start whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Log Mistake Manually
        </button>
      </div>

      {/* Manual Mistake Logger */}
      {showAddForm && (
        <form onSubmit={handleAddManualMistake} className="rounded-2xl aryash-surface-solid p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-white">Record a Concept Mistake</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close form"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (e.g. Chemistry)"
              required
              className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g. Chemical Equilibrium)"
              required
              className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={misconceptionTag}
              onChange={(e) => setMisconceptionTag(e.target.value)}
              placeholder="Misconception pattern (e.g. Sign error in ΔG)"
              className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question or concept where the mistake happened..."
            required
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              value={wrongAnswer}
              onChange={(e) => setWrongAnswer(e.target.value)}
              placeholder="What you answered / assumed"
              className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
            <input
              type="text"
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              placeholder="Correct answer or rule"
              className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <textarea
            rows={2}
            value={whyWrong}
            onChange={(e) => setWhyWrong(e.target.value)}
            placeholder="Why was that approach incorrect?"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="aryash-primary-btn px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
            >
              Save to Vault
            </button>
          </div>
        </form>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0D1226] border border-slate-800">
          {(
            [
              { id: 'open', label: `Open (${openCount})` },
              { id: 'resolved', label: `Resolved (${resolvedCount})` },
              { id: 'all', label: `All (${store.state.mistakes.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                filter === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-[#0D1226] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {subjects.map((s) => (
            <option key={s} value={s}>
              Subject: {s}
            </option>
          ))}
        </select>
      </div>

      {/* Active Targeted Revision Drill Panel */}
      {drillingMistake && (
        <section className="rounded-2xl border border-indigo-500/40 bg-[#0D1226] p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs font-medium text-indigo-300">Targeted Misconception Cure Drill</p>
              <h3 className="font-display text-lg font-bold text-white mt-0.5">{drillingMistake.misconceptionTag}</h3>
              <p className="text-xs text-slate-400">
                {drillingMistake.subject} · {drillingMistake.topic}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDrillingMistake(null)}
              className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              aria-label="Close revision drill"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {drillError && (
            <AiErrorBanner
              message={drillError.message}
              code={drillError.code}
              onRetry={() => handleLaunchDrill(drillingMistake)}
            />
          )}

          {drillLoading && (
            <div className="py-10 flex items-center justify-center gap-3 text-sm text-indigo-200">
              <Loader2 className="w-5 h-5 animate-spin" />
              Diagnosing root cause and building targeted revision questions...
            </div>
          )}

          {!drillLoading && drillData && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-300">Root Cause Diagnosis</p>
                  <p className="text-xs text-slate-200 leading-relaxed">{drillData.rootCause}</p>
                </div>
                <div className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-300">Mental Model Fix</p>
                  <p className="text-xs text-slate-200 leading-relaxed">{drillData.mentalModelFix}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-display text-sm font-semibold text-white">3-Question Mastery Check</h4>
                {drillData.practiceQuestions.map((pq, qi) => (
                  <div key={qi} className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-3">
                    <p className="text-sm font-medium text-white">
                      {qi + 1}. {pq.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pq.options.map((opt, oi) => {
                        const picked = drillSelections[qi] === oi;
                        const isRight = pq.correctIndex === oi;
                        let cls = 'border-slate-800 bg-[#0D1226] text-slate-300 hover:border-slate-600';
                        if (drillChecked) {
                          if (isRight) cls = 'border-emerald-500/70 bg-emerald-500/15 text-emerald-100';
                          else if (picked) cls = 'border-rose-500/70 bg-rose-500/15 text-rose-100';
                        } else if (picked) {
                          cls = 'border-indigo-500 bg-indigo-500/15 text-white';
                        }
                        return (
                          <button
                            key={oi}
                            type="button"
                            disabled={drillChecked}
                            onClick={() => setDrillSelections((prev) => ({ ...prev, [qi]: oi }))}
                            className={`text-left px-3 py-2 rounded-lg border text-xs cursor-pointer transition-colors ${cls}`}
                          >
                            <span className="font-mono mr-2 text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {drillChecked && (
                      <p className="text-xs text-slate-300">
                        <span className="font-semibold text-indigo-300">Explanation: </span>
                        {pq.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {!drillChecked ? (
                  <button
                    type="button"
                    onClick={() => setDrillChecked(true)}
                    className="aryash-primary-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer"
                  >
                    Check Drill Answers
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs text-slate-200 font-mono tabular-nums">
                      Drill Score:{' '}
                      {drillData.practiceQuestions.filter((q, i) => drillSelections[i] === q.correctIndex).length} /{' '}
                      {drillData.practiceQuestions.length}
                    </span>
                    {!drillingMistake.resolved && (
                      <button
                        type="button"
                        onClick={() => {
                          store.toggleMistakeResolved(drillingMistake.id);
                          setDrillingMistake(null);
                        }}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white cursor-pointer"
                      >
                        Mark Mistake as Resolved (+60 XP)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Mistakes List */}
      {filteredMistakes.length === 0 ? (
        <div className="rounded-2xl aryash-surface-solid p-10 text-center space-y-2">
          <ShieldAlert className="w-7 h-7 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-200">No mistakes in this view</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {filter === 'open'
              ? 'You have zero open mistakes. Wrong answers from Adaptive Quiz Arena or manually logged exam slips will be tracked here.'
              : 'Resolved mistakes appear here once you conquer them through revision drills.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((mistake) => (
            <article key={mistake.id} className="rounded-2xl aryash-surface-solid p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span className="font-medium text-indigo-300">{mistake.subject}</span>
                    <span>·</span>
                    <span>{mistake.topic}</span>
                    <span>·</span>
                    <span className="font-mono tabular-nums text-amber-300">Occurred {mistake.occurrences}x</span>
                    <span>·</span>
                    <span className={mistake.resolved ? 'text-emerald-400 font-medium' : 'text-amber-300 font-medium'}>
                      {mistake.resolved ? 'Resolved' : 'Needs Revision'}
                    </span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-white">{mistake.misconceptionTag}</h3>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLaunchDrill(mistake)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/30 text-xs font-medium text-indigo-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Targeted Revision Drill
                  </button>
                  <button
                    type="button"
                    onClick={() => store.toggleMistakeResolved(mistake.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {mistake.resolved ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" /> Reopen
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Mark Resolved
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => store.deleteMistake(mistake.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                    aria-label="Delete mistake"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-200">{mistake.question}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-[#080B18] border border-slate-800 p-3.5">
                  <p className="text-rose-300 font-medium mb-1">Recorded Wrong Answer</p>
                  <p className="text-slate-300">{mistake.wrongAnswer}</p>
                </div>
                <div className="rounded-xl bg-[#080B18] border border-slate-800 p-3.5">
                  <p className="text-emerald-300 font-medium mb-1">Correct Concept / Answer</p>
                  <p className="text-slate-200">{mistake.correctAnswer}</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-100">Why it went wrong: </span>
                {mistake.whyWrong}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
