import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  FileUp,
  History,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { AiErrorBanner } from '../components/AiErrorBanner';
import { MarkdownRenderer } from '../components/MarkdownRenderer';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import {
  AiServiceError,
  fileToBase64Attachment,
  requestTutorResponse,
  type FileAttachmentPayload,
} from '../services/aiClient';
import type {
  ExplanationAngle,
  LanguageMode,
  LearningLevel,
  ThreeWayExplanation,
  TutorMessage,
  TutorSession,
} from '../types';

interface TutorStudioPageProps {
  store: LearningStoreApi;
  initialSubject?: string;
  initialTopic?: string;
}

const SUBJECT_PRESETS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Economics',
  'History',
  'English & Writing',
  'General',
];

const ANGLE_META: { id: ExplanationAngle; label: string; subtitle: string }[] = [
  { id: 'simple', label: 'Simple Mode', subtitle: 'Beginner-friendly intuition' },
  { id: 'realLife', label: 'Real-Life Mode', subtitle: 'Practical examples & analogies' },
  { id: 'technical', label: 'Technical Mode', subtitle: 'Rigorous academic terminology' },
  { id: 'stepByStep', label: 'Step-by-Step', subtitle: 'Guided sequential breakdown' },
];

function safeStr(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  return value;
}

function resolveAngleContent(threeWay: ThreeWayExplanation, angle: ExplanationAngle, fallbackContent: string): string {
  const candidate = safeStr(threeWay[angle]);
  if (candidate) return candidate;
  const ordered: ExplanationAngle[] = ['simple', 'realLife', 'technical', 'stepByStep'];
  for (const key of ordered) {
    const val = safeStr(threeWay[key]);
    if (val) return val;
  }
  return safeStr(threeWay.summary) || safeStr(fallbackContent);
}

async function copyTextReliable(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to execCommand fallback for sandboxed iframes
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function TutorStudioPage({ store, initialSubject, initialTopic }: TutorStudioPageProps) {
  const cleanInitialSubject = safeStr(initialSubject, 'Mathematics');
  const cleanInitialTopic = safeStr(initialTopic, '');

  const [activeSessionId, setActiveSessionId] = useState<string | null>(
    store.state.tutorSessions[0]?.id ?? null
  );
  const [subject, setSubject] = useState<string>(cleanInitialSubject);
  const [topic, setTopic] = useState<string>(cleanInitialTopic);
  const [language, setLanguage] = useState<LanguageMode>(store.state.profile.preferredLanguage || 'English');
  const [level, setLevel] = useState<LearningLevel>(store.state.profile.learningLevel || 'Intermediate');
  const [input, setInput] = useState<string>(
    cleanInitialTopic ? `Explain ${cleanInitialTopic} clearly in ${cleanInitialSubject}.` : ''
  );
  const [attachment, setAttachment] = useState<FileAttachmentPayload | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    prompt: string;
    mode: 'three-way' | 'alternative' | 'simple' | 'realLife' | 'technical' | 'stepByStep';
  } | null>(null);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [selectedAngles, setSelectedAngles] = useState<Record<string, ExplanationAngle>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [sideTab, setSideTab] = useState<'history' | 'saved'>('history');

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const nextSubject = safeStr(initialSubject);
    const nextTopic = safeStr(initialTopic);
    if (nextSubject) setSubject(nextSubject);
    if (nextTopic) {
      setTopic(nextTopic);
      setInput(`Explain ${nextTopic} clearly with examples and step-by-step reasoning.`);
    }
  }, [initialSubject, initialTopic]);

  const activeSession: TutorSession | undefined = store.state.tutorSessions.find(
    (s) => s.id === activeSessionId
  );

  const subjectOptions = useMemo(() => {
    const current = safeStr(subject);
    if (!current || SUBJECT_PRESETS.includes(current)) return SUBJECT_PRESETS;
    return [current, ...SUBJECT_PRESETS];
  }, [subject]);

  useEffect(() => {
    if (loading || activeSession?.messages.length) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [loading, activeSession?.messages.length]);

  const startNewSession = () => {
    setActiveSessionId(null);
    setError(null);
    setAttachment(null);
    setPendingQuestion(null);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await fileToBase64Attachment(file);
      setAttachment(encoded);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Unable to attach file.');
    }
  };

  const runTutorQuery = async (
    promptText: string,
    mode: 'three-way' | 'alternative' | 'simple' | 'realLife' | 'technical' | 'stepByStep' = 'three-way',
    overrides?: { subject?: string; topic?: string; replaceAssistantId?: string }
  ) => {
    const cleanPrompt = safeStr(promptText);
    if (!cleanPrompt) {
      setError({ message: 'Please type a question or concept before submitting.', code: 'INVALID_INPUT' });
      return;
    }

    const activeSubject = safeStr(overrides?.subject, safeStr(subject, 'General'));
    const activeTopic = safeStr(overrides?.topic, safeStr(topic));

    setError(null);
    setLoading(true);
    setPendingQuestion(cleanPrompt);
    setLastRequest({ prompt: cleanPrompt, mode });

    const sessionToUse = activeSession;
    const now = new Date().toISOString();

    const userMsg: TutorMessage = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content: cleanPrompt,
      timestamp: now,
      subject: activeSubject,
      topic: activeTopic || 'Concept Inquiry',
      language,
      level,
      attachmentName: attachment?.name,
    };

    const priorMessages = sessionToUse?.messages ?? [];

    try {
      const weakTopics = store.dna.knowledgeGaps.map((g) => `${g.subject}: ${g.topic}`);
      const res = await requestTutorResponse({
        question: cleanPrompt,
        subject: activeSubject,
        topic: activeTopic,
        language,
        level,
        mode,
        weakTopics,
        history: priorMessages
          .slice(-6)
          .map((m) => ({ role: m.role, content: safeStr(m.content) }))
          .filter((m) => m.content.length > 0),
        attachment: attachment ?? undefined,
      });

      let assistantMsg: TutorMessage;

      if (res.mode === 'three-way' && res.data) {
        const d = res.data;
        const cleanSimple = safeStr(d.simple);
        const cleanRealLife = safeStr(d.realLife);
        const cleanTechnical = safeStr(d.technical);
        const cleanStepByStep = safeStr(d.stepByStep);
        const cleanSummary = safeStr(d.summary) || cleanSimple.slice(0, 180);

        if (!cleanSimple && !cleanRealLife && !cleanTechnical && !cleanStepByStep) {
          throw new AiServiceError(
            'Gemini returned an empty explanation payload. Please retry.',
            'INVALID_RESPONSE',
            502
          );
        }

        const sanitizedThreeWay: ThreeWayExplanation = {
          detectedSubject: safeStr(d.detectedSubject, activeSubject),
          detectedTopic: safeStr(d.detectedTopic, activeTopic || cleanPrompt.slice(0, 48)),
          summary: cleanSummary,
          simple: cleanSimple || cleanSummary,
          realLife: cleanRealLife || cleanSummary,
          technical: cleanTechnical || cleanSummary,
          stepByStep: cleanStepByStep || cleanSummary,
          keyTakeaways: Array.isArray(d.keyTakeaways)
            ? d.keyTakeaways.map((k) => safeStr(k)).filter(Boolean)
            : [],
          followUpQuestions: Array.isArray(d.followUpQuestions)
            ? d.followUpQuestions.map((q) => safeStr(q)).filter(Boolean)
            : [],
        };

        assistantMsg = {
          id: `msg-a-${Date.now() + 1}`,
          role: 'assistant',
          content: sanitizedThreeWay.summary,
          timestamp: new Date().toISOString(),
          subject: sanitizedThreeWay.detectedSubject,
          topic: sanitizedThreeWay.detectedTopic,
          language,
          level,
          threeWay: sanitizedThreeWay,
        };
      } else {
        const markdown = res.mode === 'single' ? safeStr(res.markdown) : '';
        if (!markdown) {
          throw new AiServiceError(
            'Gemini returned an empty explanation. Please click Retry.',
            'INVALID_RESPONSE',
            502
          );
        }

        assistantMsg = {
          id: `msg-a-${Date.now() + 1}`,
          role: 'assistant',
          content: markdown,
          timestamp: new Date().toISOString(),
          subject: activeSubject,
          topic: activeTopic || safeStr(sessionToUse?.topic, 'Follow-Up Explanation'),
          language,
          level,
        };
      }

      const resolvedSubject = safeStr(assistantMsg.subject, activeSubject);
      const resolvedTopic = safeStr(assistantMsg.topic, activeTopic || 'Concept Breakdown');

      let nextMessages: TutorMessage[];
      if (overrides?.replaceAssistantId && sessionToUse) {
        nextMessages = priorMessages.map((m) => (m.id === overrides.replaceAssistantId ? assistantMsg : m));
      } else {
        nextMessages = [...priorMessages, userMsg, assistantMsg];
      }

      const updatedSession: TutorSession = sessionToUse
        ? {
            ...sessionToUse,
            subject: resolvedSubject,
            topic: resolvedTopic,
            language,
            level,
            updatedAt: assistantMsg.timestamp,
            messages: nextMessages,
          }
        : {
            id: `tutor-${Date.now()}`,
            title: resolvedTopic.length > 48 ? `${resolvedTopic.slice(0, 48)}...` : resolvedTopic,
            subject: resolvedSubject,
            topic: resolvedTopic,
            language,
            level,
            updatedAt: assistantMsg.timestamp,
            messages: [userMsg, assistantMsg],
          };

      store.upsertTutorSession(updatedSession);
      setActiveSessionId(updatedSession.id);
      setTopic(resolvedTopic);
      setSubject(resolvedSubject);
      if (!overrides?.replaceAssistantId) {
        setInput('');
      }
      setAttachment(null);

      store.logStudySession({
        subject: resolvedSubject,
        topic: resolvedTopic,
        minutes: 8,
        source: 'tutor',
      });
      store.logActivity({
        type: 'tutor',
        title: `AI Tutor: ${resolvedTopic}`,
        subject: resolvedSubject,
        detail:
          mode === 'three-way'
            ? `Three-Way + Step-by-Step (${language})`
            : `Alternative explanation (${language})`,
        xpEarned: 35,
      });
    } catch (err) {
      if (err instanceof AiServiceError) {
        setError({ message: err.message, code: err.code });
      } else {
        setError({ message: err instanceof Error ? err.message : 'Unable to reach AI Tutor.' });
      }
    } finally {
      setLoading(false);
      setPendingQuestion(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading && safeStr(input)) {
      runTutorQuery(input, 'three-way');
    }
  };

  const handleCopyMessage = async (msg: TutorMessage) => {
    const activeAngle = selectedAngles[msg.id] ?? 'simple';
    const text = msg.threeWay
      ? `# ${safeStr(msg.topic, 'Explanation')} (${safeStr(msg.subject, 'General')})\n\n## Summary\n${safeStr(msg.threeWay.summary)}\n\n## Simple Mode\n${safeStr(msg.threeWay.simple)}\n\n## Real-Life Mode\n${safeStr(msg.threeWay.realLife)}\n\n## Technical Mode\n${safeStr(msg.threeWay.technical)}\n\n## Step-by-Step Mode\n${safeStr(msg.threeWay.stepByStep)}`
      : safeStr(msg.content);

    const ok = await copyTextReliable(text);
    if (ok) {
      setCopiedId(`${msg.id}-${activeAngle}`);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleSaveExplanation = (msg: TutorMessage, questionText: string) => {
    const angle = selectedAngles[msg.id] ?? 'simple';
    const contentToSave = msg.threeWay
      ? resolveAngleContent(msg.threeWay, angle, msg.content)
      : safeStr(msg.content);
    if (!contentToSave) return;

    store.saveExplanation({
      subject: safeStr(msg.subject, 'General'),
      topic: safeStr(msg.topic, 'Saved Concept'),
      question: safeStr(questionText, msg.topic),
      angle: msg.threeWay ? 'full' : angle,
      content: contentToSave,
      threeWay: msg.threeWay,
    });
    setSavedIds((prev) => new Set(prev).add(msg.id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      {/* Left History & Saved Explanations Rail */}
      <aside className="xl:col-span-3 rounded-2xl aryash-surface-solid p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#080B18] border border-slate-800 flex-1">
            <button
              type="button"
              onClick={() => setSideTab('history')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                sideTab === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              History ({store.state.tutorSessions.length})
            </button>
            <button
              type="button"
              onClick={() => setSideTab('saved')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                sideTab === 'saved' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Saved ({store.state.savedExplanations.length})
            </button>
          </div>
          <button
            type="button"
            onClick={startNewSession}
            title="New Conversation"
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shrink-0"
            aria-label="New Tutor Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {sideTab === 'history' ? (
          <div className="space-y-1.5 max-h-[560px] overflow-y-auto">
            {store.state.tutorSessions.length === 0 ? (
              <div className="py-8 px-3 text-center space-y-1.5">
                <History className="w-5 h-5 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No tutor conversations yet.</p>
                <p className="text-[11px] text-slate-500">Ask any question to build your saved library.</p>
              </div>
            ) : (
              store.state.tutorSessions.map((sess) => {
                const active = sess.id === activeSessionId;
                return (
                  <div
                    key={sess.id}
                    className={`group rounded-xl border p-3 transition-colors ${
                      active
                        ? 'bg-indigo-500/12 border-indigo-400/35'
                        : 'bg-[#080B18] border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSessionId(sess.id);
                          setSubject(safeStr(sess.subject, 'General'));
                          setTopic(safeStr(sess.topic, ''));
                          setLanguage(sess.language || 'English');
                          setLevel(sess.level || 'Intermediate');
                          setError(null);
                        }}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-white truncate">
                          {safeStr(sess.title, 'Tutor Session')}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {safeStr(sess.subject, 'General')} · {sess.language || 'English'}
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          store.deleteTutorSession(sess.id);
                          if (activeSessionId === sess.id) setActiveSessionId(null);
                        }}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-[560px] overflow-y-auto">
            {store.state.savedExplanations.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Bookmark any explanation in the chat to keep it here for quick pre-exam revision.
              </p>
            ) : (
              store.state.savedExplanations.map((saved) => (
                <div key={saved.id} className="rounded-xl bg-[#080B18] border border-slate-800 p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-white">{safeStr(saved.topic, 'Saved Note')}</p>
                    <button
                      type="button"
                      onClick={() => store.deleteSavedExplanation(saved.id)}
                      className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      aria-label="Delete saved note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-indigo-300">{safeStr(saved.subject, 'General')}</p>
                  <p className="text-xs text-slate-300 line-clamp-3">{safeStr(saved.content)}</p>
                </div>
              ))
            )}
          </div>
        )}
      </aside>

      {/* Main Three-Way Tutor Workspace */}
      <div className="xl:col-span-9 space-y-5">
        {/* Controls Toolbar */}
        <div className="rounded-2xl aryash-surface-solid p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {subjectOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Topic Focus</label>
            <input
              type="text"
              value={topic ?? ''}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Newton's First Law"
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => {
                const next = e.target.value as LanguageMode;
                setLanguage(next);
                store.updateProfile({ preferredLanguage: next });
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi (हिन्दी)</option>
              <option value="Hinglish">Hinglish (Conversational)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">Learning Level</label>
            <select
              value={level}
              onChange={(e) => {
                const next = e.target.value as LearningLevel;
                setLevel(next);
                store.updateProfile({ learningLevel: next });
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Exam Prep">Exam Prep</option>
            </select>
          </div>
        </div>

        {/* Conversation Canvas */}
        <div className="rounded-2xl aryash-surface-solid p-5 sm:p-6 min-h-[460px] flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {activeSession && (
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">
                    {safeStr(activeSession.title, 'AI Tutor Session')}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {safeStr(activeSession.subject, 'General')} · {activeSession.language || language} ·{' '}
                    {activeSession.level || level}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    store.deleteTutorSession(activeSession.id);
                    setActiveSessionId(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-rose-500/40 text-xs text-slate-400 hover:text-rose-300 cursor-pointer"
                >
                  Clear Conversation
                </button>
              </div>
            )}

            {error && (
              <AiErrorBanner
                message={error.message}
                code={error.code}
                onRetry={
                  lastRequest
                    ? () => runTutorQuery(lastRequest.prompt, lastRequest.mode)
                    : undefined
                }
              />
            )}

            {(!activeSession || activeSession.messages.length === 0) && !pendingQuestion ? (
              <div className="py-10 space-y-6 text-center max-w-2xl mx-auto">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-indigo-300">Signature Three-Way Explanation Engine</p>
                  <h3 className="font-display text-2xl font-bold text-white">
                    Ask any concept—understand it four distinct ways.
                  </h3>
                  <p className="text-sm text-slate-400">
                    Every response generates live Simple Mode, Real-Life Mode, Technical Mode, and Step-by-Step Mode explanations in {language} ({level}).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                  {[
                    {
                      s: 'Biology',
                      t: 'Photosynthesis',
                      q: 'Explain photosynthesis in simple English.',
                    },
                    {
                      s: 'Physics',
                      t: "Newton's First Law",
                      q: "Explain Newton's first law of motion clearly with everyday examples.",
                    },
                    {
                      s: 'Computer Science',
                      t: 'Artificial Intelligence',
                      q: 'Explain artificial intelligence with a real-life example.',
                    },
                    {
                      s: 'Mathematics',
                      t: 'Bayes Theorem',
                      q: 'Explain Bayes Theorem with an intuitive medical test example and step-by-step derivation.',
                    },
                  ].map((starter) => (
                    <button
                      key={starter.t}
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setSubject(starter.s);
                        setTopic(starter.t);
                        runTutorQuery(starter.q, 'three-way', { subject: starter.s, topic: starter.t });
                      }}
                      className="p-4 rounded-xl bg-[#080B18] border border-slate-800 hover:border-indigo-500/45 transition-colors cursor-pointer space-y-1 disabled:opacity-50"
                    >
                      <p className="text-xs text-indigo-300 font-medium">{starter.s}</p>
                      <p className="text-sm font-semibold text-white">{starter.t}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{starter.q}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(activeSession?.messages ?? []).map((msg, idx) => {
                  const prevUserMsg =
                    idx > 0
                      ? safeStr(activeSession?.messages[idx - 1]?.content, safeStr(msg.topic))
                      : safeStr(msg.topic);

                  if (msg.role === 'user') {
                    const userText = safeStr(msg.content);
                    if (!userText) return null;
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-2xl rounded-2xl bg-indigo-600/20 border border-indigo-400/30 px-4 py-3 text-sm text-white space-y-1">
                          <p className="leading-relaxed">{userText}</p>
                          {msg.attachmentName && (
                            <p className="text-[11px] text-indigo-200">Attached file: {msg.attachmentName}</p>
                          )}
                        </div>
                      </div>
                    );
                  }

                  const activeAngle = selectedAngles[msg.id] ?? 'simple';
                  const isSaved = savedIds.has(msg.id);
                  const angleMarkdown = msg.threeWay
                    ? resolveAngleContent(msg.threeWay, activeAngle, msg.content)
                    : safeStr(msg.content);

                  if (!angleMarkdown) return null;

                  const takeaways = Array.isArray(msg.threeWay?.keyTakeaways)
                    ? msg.threeWay.keyTakeaways.filter((t) => safeStr(t).length > 0)
                    : [];
                  const followUps = Array.isArray(msg.threeWay?.followUpQuestions)
                    ? msg.threeWay.followUpQuestions.filter((q) => safeStr(q).length > 0)
                    : [];

                  return (
                    <div key={msg.id} className="rounded-2xl bg-[#080B18] border border-slate-800/90 p-5 sm:p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/70">
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <span className="font-semibold text-indigo-300">ARYASH AI Tutor</span>
                          <span>·</span>
                          <span>{safeStr(msg.subject, 'General')}</span>
                          <span>·</span>
                          <span>{safeStr(msg.topic, 'Explanation')}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyMessage(msg)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            {copiedId?.startsWith(msg.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedId?.startsWith(msg.id) ? 'Copied' : 'Copy'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveExplanation(msg, prevUserMsg)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            {isSaved ? (
                              <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Bookmark className="w-3.5 h-3.5" />
                            )}
                            {isSaved ? 'Saved' : 'Save'}
                          </button>
                          <button
                            type="button"
                            disabled={loading || !prevUserMsg}
                            onClick={() =>
                              runTutorQuery(prevUserMsg, 'three-way', {
                                subject: msg.subject,
                                topic: msg.topic,
                                replaceAssistantId: msg.id,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            title="Regenerate this response"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Regenerate
                          </button>
                          <button
                            type="button"
                            disabled={loading || !prevUserMsg}
                            onClick={() =>
                              runTutorQuery(prevUserMsg, 'alternative', {
                                subject: msg.subject,
                                topic: msg.topic,
                              })
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 inline-flex items-center gap-1 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                            title="Ask for another explanation"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Another Way
                          </button>
                        </div>
                      </div>

                      {msg.threeWay ? (
                        <div className="space-y-4">
                          {safeStr(msg.threeWay.summary) && (
                            <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                              {safeStr(msg.threeWay.summary)}
                            </p>
                          )}

                          {/* Four-Angle Interactive Tabs */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {ANGLE_META.map((tab) => {
                              const active = activeAngle === tab.id;
                              return (
                                <button
                                  key={tab.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAngles((prev) => ({ ...prev, [msg.id]: tab.id }));
                                    store.recordAngleClick(tab.id);
                                  }}
                                  className={`px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                    active
                                      ? 'bg-indigo-600/20 border-indigo-400/50 text-white'
                                      : 'bg-[#0D1226] border-slate-800 text-slate-400 hover:text-slate-200'
                                  }`}
                                >
                                  <p className="text-xs font-semibold whitespace-nowrap">{tab.label}</p>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{tab.subtitle}</p>
                                </button>
                              );
                            })}
                          </div>

                          <div className="rounded-xl bg-[#0D1226] border border-slate-800/80 p-5">
                            <MarkdownRenderer content={angleMarkdown} />
                          </div>

                          {takeaways.length > 0 && (
                            <div className="pt-2 space-y-1.5">
                              <p className="text-xs font-semibold text-slate-300">Key Takeaways</p>
                              <ul className="space-y-1 text-xs text-slate-300 list-disc pl-5">
                                {takeaways.map((tk, i) => (
                                  <li key={i}>{tk}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {followUps.length > 0 && (
                            <div className="pt-2 space-y-2">
                              <p className="text-xs font-semibold text-slate-400">Follow-Up Questions</p>
                              <div className="flex flex-wrap gap-2">
                                {followUps.map((fq, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    disabled={loading}
                                    onClick={() => runTutorQuery(fq, 'three-way')}
                                    className="px-3 py-1.5 rounded-lg bg-[#0D1226] border border-slate-700/80 hover:border-indigo-400/50 text-xs text-slate-200 text-left transition-colors cursor-pointer disabled:opacity-50"
                                  >
                                    {fq}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <MarkdownRenderer content={angleMarkdown} />
                      )}
                    </div>
                  );
                })}

                {pendingQuestion && (
                  <div className="flex justify-end">
                    <div className="max-w-2xl rounded-2xl bg-indigo-600/20 border border-indigo-400/30 px-4 py-3 text-sm text-white">
                      <p className="leading-relaxed">{pendingQuestion}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="rounded-2xl bg-[#080B18] border border-indigo-500/30 p-5 flex items-center gap-3 text-sm text-indigo-200">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>
                  Generating live explanation in {language} (Simple, Real-Life, Technical & Step-by-Step modes)...
                </span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer Bar */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-800/80 space-y-3">
            {attachment && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-xs text-indigo-200">
                <span className="truncate">Attached document: {attachment.name}</span>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  className="text-slate-300 hover:text-white cursor-pointer"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {fileError && <p className="text-xs text-rose-400">{fileError}</p>}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
              <label
                title="Upload PDF or Image"
                className="px-3.5 py-2.5 rounded-xl bg-[#080B18] border border-slate-800 hover:border-indigo-500/60 text-xs text-slate-300 inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <FileUp className="w-4 h-4 text-indigo-400" />
                <span className="sm:hidden lg:inline">PDF / Image</span>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileAttach}
                  className="hidden"
                />
              </label>

              <textarea
                rows={2}
                value={input ?? ''}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading && safeStr(input)) runTutorQuery(input, 'three-way');
                  }
                }}
                placeholder={`Ask any concept in ${language} (Press Enter to send, Shift+Enter for new line)...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#080B18] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />

              <button
                type="submit"
                disabled={loading || !safeStr(input)}
                className="aryash-primary-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {loading ? 'Thinking...' : 'Explain'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
