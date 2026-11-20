import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Download,
  Loader2,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { AiErrorBanner } from '../components/AiErrorBanner';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import { AiServiceError, requestAdaptiveQuiz } from '../services/aiClient';
import type { AppRoute, LanguageMode, LearningLevel, QuizAnswerRecord, QuizAttempt, QuizQuestion } from '../types';

interface QuizArenaPageProps {
  store: LearningStoreApi;
  onNavigate: (route: AppRoute, context?: { subject?: string; topic?: string }) => void;
  initialSubject?: string;
  initialTopic?: string;
}

export function QuizArenaPage({ store, onNavigate, initialSubject, initialTopic }: QuizArenaPageProps) {
  const [subject, setSubject] = useState(initialSubject || 'Physics');
  const [topic, setTopic] = useState(initialTopic || 'Thermodynamics');
  const [difficulty, setDifficulty] = useState<LearningLevel>(store.dna.recommendedDifficulty);
  const [questionType, setQuestionType] = useState('Mixed (MCQ + Conceptual + Application)');
  const [count, setCount] = useState(5);
  const [language, setLanguage] = useState<LanguageMode>(store.state.profile.preferredLanguage);
  const [targetWeakAreas, setTargetWeakAreas] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  // Active quiz state
  const [quizTitle, setQuizTitle] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answeredRecords, setAnsweredRecords] = useState<QuizAnswerRecord[]>([]);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
    if (initialTopic) setTopic(initialTopic);
  }, [initialSubject, initialTopic]);

  const handleGenerateQuiz = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) {
      setError({ message: 'Please enter a topic to generate your adaptive quiz.', code: 'INVALID_INPUT' });
      return;
    }

    setError(null);
    setLoading(true);
    setCompletedAttempt(null);

    try {
      const weakConcepts = targetWeakAreas
        ? store.state.mistakes
            .filter((m) => !m.resolved && m.subject.toLowerCase() === subject.toLowerCase())
            .map((m) => `${m.topic}: ${m.misconceptionTag}`)
        : [];

      const res = await requestAdaptiveQuiz({
        subject: subject.trim(),
        topic: topic.trim(),
        difficulty,
        questionType,
        count,
        language,
        weakConcepts,
      });

      setQuizTitle(res.data.quizTitle || `${subject} — ${topic}`);
      setQuestions(res.data.questions);
      setCurrentIdx(0);
      setSelectedOption(null);
      setAnsweredRecords([]);
      setStartedAt(Date.now());
    } catch (err) {
      if (err instanceof AiServiceError) {
        setError({ message: err.message, code: err.code });
      } else {
        setError({ message: err instanceof Error ? err.message : 'Unable to generate quiz.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIdx];
  const currentRecord = answeredRecords[currentIdx];

  const handleConfirmAnswer = (optionIdx: number) => {
    if (!currentQuestion || currentRecord) return;
    setSelectedOption(optionIdx);
    const isCorrect = optionIdx === currentQuestion.correctIndex;
    const record: QuizAnswerRecord = {
      questionId: currentQuestion.id || `q-${currentIdx + 1}`,
      question: currentQuestion.question,
      subtopic: currentQuestion.subtopic || topic,
      selectedIndex: optionIdx,
      correctIndex: currentQuestion.correctIndex,
      isCorrect,
      explanation: currentQuestion.explanation,
      misconceptionNote: currentQuestion.misconceptionNote,
      options: currentQuestion.options,
    };
    setAnsweredRecords((prev) => [...prev, record]);
  };

  const handleNextOrFinish = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      return;
    }

    const correctCount = answeredRecords.filter((a) => a.isCorrect).length;
    const scorePercent = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    const durationSeconds = Math.max(15, Math.round((Date.now() - startedAt) / 1000));

    const attempt: QuizAttempt = {
      id: `quiz-${Date.now()}`,
      title: quizTitle || `${subject}: ${topic}`,
      subject: subject.trim(),
      topic: topic.trim(),
      difficulty,
      questionType,
      totalQuestions: questions.length,
      correctCount,
      scorePercent,
      durationSeconds,
      completedAt: new Date().toISOString(),
      answers: answeredRecords,
    };

    store.addQuizAttempt(attempt);
    setCompletedAttempt(attempt);
    setQuestions([]);
  };

  const downloadScoreReport = (attempt: QuizAttempt) => {
    const lines = [
      `# ARYASH AI — Adaptive Quiz Score Report`,
      `Title: ${attempt.title}`,
      `Subject: ${attempt.subject} | Topic: ${attempt.topic}`,
      `Difficulty: ${attempt.difficulty} | Date: ${attempt.completedAt.slice(0, 10)}`,
      `Score: ${attempt.correctCount}/${attempt.totalQuestions} (${attempt.scorePercent}%)`,
      '',
      '## Question-by-Question Review',
      ...attempt.answers.map(
        (a, i) =>
          `\n### Q${i + 1}. ${a.question}\n- Your Answer: ${a.options[a.selectedIndex] ?? 'None'}\n- Correct Answer: ${a.options[a.correctIndex]}\n- Result: ${a.isCorrect ? 'Correct' : 'Incorrect'}\n- Explanation: ${a.explanation}\n- Concept Watchout: ${a.misconceptionNote}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aryash-quiz-report-${attempt.completedAt.slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-300">
            Adaptive Quiz Arena · Recommended Level: {store.dna.recommendedDifficulty}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Adaptive Examination & Practice
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl">
            Questions adapt to your recorded mastery level. Every wrong answer is automatically captured into your Mistake Memory Vault with conceptual feedback.
          </p>
        </div>
      </div>

      {error && <AiErrorBanner message={error.message} code={error.code} onRetry={() => handleGenerateQuiz()} />}

      {/* Active Quiz Session */}
      {questions.length > 0 && currentQuestion && (
        <section className="rounded-2xl aryash-surface-solid p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <h3 className="font-display text-lg font-semibold text-white">{quizTitle}</h3>
              <p className="text-xs text-slate-400">
                {currentQuestion.category} · Subtopic: {currentQuestion.subtopic} · {difficulty}
              </p>
            </div>
            <span className="font-mono text-sm tabular-nums text-indigo-300">
              Question {currentIdx + 1} / {questions.length}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all"
              style={{ width: `${Math.round(((currentIdx + (currentRecord ? 1 : 0)) / questions.length) * 100)}%` }}
            />
          </div>

          <p className="text-base sm:text-lg font-medium text-white leading-relaxed">{currentQuestion.question}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, idx) => {
              const revealed = Boolean(currentRecord);
              const isCorrect = idx === currentQuestion.correctIndex;
              const isChosen = selectedOption === idx || currentRecord?.selectedIndex === idx;

              let btnClass = 'bg-[#080B18] border-slate-800 text-slate-200 hover:border-indigo-400/60';
              if (revealed) {
                if (isCorrect) btnClass = 'bg-emerald-500/15 border-emerald-500/60 text-emerald-100';
                else if (isChosen) btnClass = 'bg-rose-500/15 border-rose-500/60 text-rose-100';
                else btnClass = 'bg-[#080B18] border-slate-800/60 text-slate-500';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={revealed}
                  onClick={() => handleConfirmAnswer(idx)}
                  className={`p-4 rounded-xl border text-left text-sm transition-colors cursor-pointer flex items-start gap-3 ${btnClass}`}
                >
                  <span className="font-mono text-xs text-slate-400 mt-0.5 shrink-0">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="leading-relaxed">{opt}</span>
                </button>
              );
            })}
          </div>

          {currentRecord && (
            <div
              className={`rounded-xl border p-4 space-y-2 ${
                currentRecord.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-950/20'
                  : 'border-amber-500/30 bg-amber-950/20'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {currentRecord.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-200">Correct Answer</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200">Incorrect — Logged for Mistake Memory Vault</span>
                  </>
                )}
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">{currentRecord.explanation}</p>
              {!currentRecord.isCorrect && (
                <p className="text-xs text-amber-200/80">
                  Key misconception watchout: {currentRecord.misconceptionNote}
                </p>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNextOrFinish}
                  className="aryash-primary-btn px-5 py-2 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {currentIdx + 1 < questions.length ? 'Next Question' : 'View Score Report'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Completed Quiz Score Report */}
      {completedAttempt && (
        <section className="rounded-2xl aryash-surface-solid p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800/80">
            <div>
              <p className="text-xs font-medium text-indigo-300">Quiz Completed & Synced to Learning DNA</p>
              <h3 className="font-display text-2xl font-bold text-white mt-1">{completedAttempt.title}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {completedAttempt.subject} · {completedAttempt.difficulty} ·{' '}
                <span className="font-mono tabular-nums">{completedAttempt.durationSeconds}s</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadScoreReport(completedAttempt)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report
              </button>
              <button
                type="button"
                onClick={() => setCompletedAttempt(null)}
                className="aryash-primary-btn px-4 py-2 rounded-lg text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                New Quiz
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl bg-[#080B18] border border-slate-800 p-4">
              <p className="text-xs text-slate-400">Final Score</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-white mt-1">
                {completedAttempt.scorePercent}%
              </p>
              <p className="text-xs text-slate-400 mt-1 tabular-nums">
                {completedAttempt.correctCount} / {completedAttempt.totalQuestions} correct
              </p>
            </div>
            <div className="rounded-xl bg-[#080B18] border border-slate-800 p-4">
              <p className="text-xs text-slate-400">Mistakes Captured</p>
              <p className="font-mono text-3xl font-bold tabular-nums text-amber-300 mt-1">
                {completedAttempt.totalQuestions - completedAttempt.correctCount}
              </p>
              <p className="text-xs text-slate-400 mt-1">Automatically saved to Mistake Vault</p>
            </div>
            <div className="rounded-xl bg-[#080B18] border border-slate-800 p-4">
              <p className="text-xs text-slate-400">Next Recommended Step</p>
              <p className="text-sm font-semibold text-indigo-200 mt-1.5">
                {completedAttempt.scorePercent >= 80
                  ? 'Ready to step up difficulty'
                  : 'Review missed concepts in Mistake Vault'}
              </p>
              <button
                type="button"
                onClick={() =>
                  completedAttempt.scorePercent >= 80
                    ? onNavigate('learning-dna')
                    : onNavigate('mistakes')
                }
                className="text-xs text-indigo-300 hover:text-white underline mt-1.5 cursor-pointer"
              >
                {completedAttempt.scorePercent >= 80 ? 'Inspect Learning DNA' : 'Open Mistake Vault'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-sm font-semibold text-white">Detailed Answer Review</h4>
            {completedAttempt.answers.map((a, idx) => (
              <div key={idx} className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-1.5 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-white">
                    {idx + 1}. {a.question}
                  </p>
                  <span className={`font-semibold shrink-0 ${a.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {a.isCorrect ? 'Correct' : 'Missed'}
                  </span>
                </div>
                <p className="text-slate-400">
                  Your answer: <span className="text-slate-200">{a.options[a.selectedIndex]}</span> · Correct:{' '}
                  <span className="text-emerald-300">{a.options[a.correctIndex]}</span>
                </p>
                <p className="text-slate-300">{a.explanation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quiz Generator Form + Quiz History */}
      {questions.length === 0 && !completedAttempt && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleGenerateQuiz} className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-white">Configure Adaptive Quiz</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Physics, Mathematics, CS"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Thermodynamics, Recursion"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as LearningLevel)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Exam Prep">Exam Prep</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Questions</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={3}>3 Questions</option>
                  <option value={5}>5 Questions</option>
                  <option value={8}>8 Questions</option>
                  <option value={10}>10 Questions</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageMode)}
                  className="w-full px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Hinglish">Hinglish</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Question Style</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Mixed (MCQ + Conceptual + Application)">Mixed (MCQ + Conceptual + Application)</option>
                <option value="Conceptual Mastery">Conceptual Mastery</option>
                <option value="Application & Problem Solving">Application & Problem Solving</option>
                <option value="Exam-Pattern MCQs">Exam-Pattern MCQs</option>
              </select>
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={targetWeakAreas}
                onChange={(e) => setTargetWeakAreas(e.target.checked)}
                className="mt-0.5 accent-indigo-500"
              />
              <span>
                Reinforce my open Mistake Memory Vault concepts in {subject} when generating questions.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full aryash-primary-btn py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpenCheck className="w-4 h-4" />}
              {loading ? 'Generating Adaptive Questions...' : 'Launch Adaptive Quiz'}
            </button>
          </form>

          {/* Quiz History */}
          <section className="lg:col-span-6 rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-white">Quiz History</h3>
              <span className="font-mono text-xs tabular-nums text-slate-400">
                {store.state.quizAttempts.length} attempt(s)
              </span>
            </div>

            {store.state.quizAttempts.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <p className="text-sm text-slate-300">No completed quizzes yet</p>
                <p className="text-xs text-slate-500">
                  Launch a quiz on the left to establish your baseline score and unlock adaptive difficulty calibration.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/70 max-h-[420px] overflow-y-auto">
                {store.state.quizAttempts.map((attempt) => (
                  <div key={attempt.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{attempt.title}</p>
                      <p className="text-xs text-slate-400">
                        {attempt.subject} · {attempt.difficulty} · {attempt.completedAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          attempt.scorePercent >= 75
                            ? 'text-emerald-400'
                            : attempt.scorePercent >= 50
                              ? 'text-blue-300'
                              : 'text-amber-300'
                        }`}
                      >
                        {attempt.scorePercent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadScoreReport(attempt)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Download report"
                        aria-label="Download quiz report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
