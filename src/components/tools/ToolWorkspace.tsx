import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileUp,
  Loader2,
  RotateCw,
  Star,
  X,
} from 'lucide-react';
import type { LearningStoreApi } from '../../hooks/useLearningStore';
import {
  AiServiceError,
  fileToBase64Attachment,
  requestToolExecution,
  type FileAttachmentPayload,
  type FlashcardDeckData,
  type MindMapData,
  type ToolMcqData,
} from '../../services/aiClient';
import type { ToolDefinition } from '../../types';
import { AiErrorBanner } from '../AiErrorBanner';
import { MarkdownRenderer } from '../MarkdownRenderer';
import {
  AttendanceCalculatorTool,
  CgpaCalculatorTool,
  DailyTaskManagerTool,
  PomodoroTimerTool,
  StudyHabitTrackerTool,
} from './LocalProductivityTools';

interface ToolWorkspaceProps {
  tool: ToolDefinition;
  store: LearningStoreApi;
  onBack: () => void;
}

export function ToolWorkspace({ tool, store, onBack }: ToolWorkspaceProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [attachment, setAttachment] = useState<FileAttachmentPayload | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [markdownResult, setMarkdownResult] = useState<string>('');
  const [flashcards, setFlashcards] = useState<FlashcardDeckData | null>(null);
  const [mindMap, setMindMap] = useState<MindMapData | null>(null);
  const [mcqData, setMcqData] = useState<ToolMcqData | null>(null);
  const [copied, setCopied] = useState(false);

  // Interactive Flashcard state
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Interactive MCQ state
  const [mcqSelections, setMcqSelections] = useState<Record<number, number>>({});
  const [mcqSubmitted, setMcqSubmitted] = useState(false);

  const isFavorite = store.state.favoriteTools.includes(tool.id);

  useEffect(() => {
    const defaults: Record<string, string> = {};
    for (const f of tool.fields ?? []) {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    }
    setValues(defaults);
    setAttachment(null);
    setFileError(null);
    setError(null);
    setMarkdownResult('');
    setFlashcards(null);
    setMindMap(null);
    setMcqData(null);
    setCardIdx(0);
    setFlipped(false);
    setShowHint(false);
    setMcqSelections({});
    setMcqSubmitted(false);
    store.recordToolUsed(tool.id);
  }, [tool.id, tool.fields, store.recordToolUsed]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const encoded = await fileToBase64Attachment(file);
      setAttachment(encoded);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Unable to process file.');
    }
  };

  const handleRunTool = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    for (const f of tool.fields ?? []) {
      if (f.required && f.type !== 'file' && !(values[f.key] || '').trim()) {
        setError({ message: `Please fill in "${f.label}" before running ${tool.name}.`, code: 'INVALID_INPUT' });
        return;
      }
    }

    if (tool.executionMode === 'ai-document' && !attachment && !(values.text || '').trim()) {
      setError({
        message: 'Upload a PDF/image file or paste study text so ARYASH AI has source material to process.',
        code: 'INVALID_INPUT',
      });
      return;
    }

    const outputFormat: 'markdown' | 'flashcards' | 'mindmap' | 'mcq' =
      tool.executionMode === 'ai-flashcards'
        ? 'flashcards'
        : tool.executionMode === 'ai-mindmap'
          ? 'mindmap'
          : tool.executionMode === 'ai-mcq'
            ? 'mcq'
            : 'markdown';

    setLoading(true);
    try {
      const userPrompt = tool.buildPrompt ? tool.buildPrompt(values) : JSON.stringify(values);
      const res = await requestToolExecution({
        toolId: tool.id,
        outputFormat,
        systemPrompt: tool.systemPrompt || '',
        userPrompt,
        attachment: attachment ?? undefined,
      });

      if (outputFormat === 'flashcards' && res.data) {
        setFlashcards(res.data as FlashcardDeckData);
        setCardIdx(0);
        setFlipped(false);
        setShowHint(false);
      } else if (outputFormat === 'mindmap' && res.data) {
        setMindMap(res.data as MindMapData);
      } else if (outputFormat === 'mcq' && res.data) {
        setMcqData(res.data as ToolMcqData);
        setMcqSelections({});
        setMcqSubmitted(false);
      } else if (res.markdown) {
        setMarkdownResult(res.markdown);
      }

      store.logActivity({
        type: 'tool',
        title: `Used ${tool.name}`,
        subject: values.subject || tool.categoryLabel,
        detail: (values.topic || values.exam || values.equation || 'Completed tool run').slice(0, 80),
        xpEarned: 15,
      });
    } catch (err) {
      if (err instanceof AiServiceError) {
        setError({ message: err.message, code: err.code });
      } else {
        setError({ message: err instanceof Error ? err.message : 'Tool execution failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getExportableText = (): string => {
    if (markdownResult) return markdownResult;
    if (flashcards) {
      return `# ${flashcards.deckTitle}\n\n${flashcards.cards
        .map((c, i) => `## Card ${i + 1}\n**Q:** ${c.front}\n**A:** ${c.back}\n*Hint:* ${c.hint}`)
        .join('\n\n')}`;
    }
    if (mindMap) {
      return `# ${mindMap.centralTopic}\n\n${mindMap.overview}\n\n${mindMap.branches
        .map(
          (b) =>
            `## ${b.title}\n${b.summary}\n${b.nodes.map((n) => `- **${n.label}:** ${n.detail}`).join('\n')}`
        )
        .join('\n\n')}`;
    }
    if (mcqData) {
      return `# ${mcqData.title}\n\n${mcqData.questions
        .map(
          (q, i) =>
            `### Q${i + 1}. ${q.question}\n${q.options
              .map((o, oi) => `- ${String.fromCharCode(65 + oi)}. ${o}`)
              .join('\n')}\n**Answer:** ${q.options[q.correctIndex]}\n**Explanation:** ${q.explanation}`
        )
        .join('\n\n')}`;
    }
    return '';
  };

  const handleCopy = async () => {
    const text = getExportableText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleDownload = () => {
    const text = getExportableText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aryash-${tool.id}-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const hasOutput = Boolean(markdownResult || flashcards || mindMap || mcqData);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All 36 Tools
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold text-white">
              {String(tool.number).padStart(2, '0')}. {tool.name}
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            {tool.shortDesc} · {tool.categoryLabel} · {tool.requiresAI ? 'Gemini AI Engine' : 'Instant Local Tool (No API Needed)'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => store.toggleFavoriteTool(tool.id)}
          className={`px-3.5 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            isFavorite
              ? 'border-amber-400/40 bg-amber-500/15 text-amber-200'
              : 'border-slate-700 bg-[#0D1226] text-slate-300 hover:text-white'
          }`}
        >
          <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-300 text-amber-300' : ''}`} />
          {isFavorite ? 'Favorited' : 'Add to Favorites'}
        </button>
      </div>

      {/* Offline / Local Tools */}
      {tool.executionMode === 'local-pomodoro' && <PomodoroTimerTool store={store} />}
      {tool.executionMode === 'local-tasks' && <DailyTaskManagerTool store={store} />}
      {tool.executionMode === 'local-habits' && <StudyHabitTrackerTool store={store} />}
      {tool.executionMode === 'local-attendance' && <AttendanceCalculatorTool />}
      {tool.executionMode === 'local-cgpa' && <CgpaCalculatorTool />}

      {/* AI-Powered Tools */}
      {tool.requiresAI && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel */}
          <form onSubmit={handleRunTool} className="lg:col-span-5 rounded-2xl aryash-surface-solid p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-white">Input Parameters</h3>
            {(tool.fields ?? []).map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-indigo-400 ml-1">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                )}

                {field.type === 'number' && (
                  <input
                    type="number"
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={4}
                    value={values[field.key] ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-y"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    value={values[field.key] ?? field.defaultValue ?? ''}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {field.type === 'file' && (
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-dashed border-slate-700 bg-[#080B18] hover:border-indigo-500/70 text-xs text-slate-300 cursor-pointer transition-colors">
                      <FileUp className="w-4 h-4 text-indigo-400" />
                      <span>{attachment ? attachment.name : 'Choose PDF or Image (max 8 MB)'}</span>
                      <input type="file" accept={field.accept} onChange={handleFileChange} className="hidden" />
                    </label>
                    {attachment && (
                      <div className="flex items-center justify-between text-xs text-indigo-300">
                        <span className="truncate">Attached: {attachment.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="text-slate-400 hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    )}
                    {field.helperText && <p className="text-[11px] text-slate-500">{field.helperText}</p>}
                    {fileError && <p className="text-xs text-rose-400">{fileError}</p>}
                  </div>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full aryash-primary-btn py-2.5 px-4 rounded-xl text-sm font-semibold text-white inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Generating with ARYASH AI...' : `Run ${tool.name}`}
            </button>
          </form>

          {/* Output Panel */}
          <div className="lg:col-span-7 rounded-2xl aryash-surface-solid p-6 min-h-[380px] flex flex-col">
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
              <h3 className="font-display text-base font-semibold text-white">Output Workspace</h3>
              {hasOutput && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .md
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4">
                <AiErrorBanner message={error.message} code={error.code} onRetry={() => handleRunTool()} />
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-3">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <p className="text-sm text-slate-300">Processing your request through ARYASH AI...</p>
                <p className="text-xs text-slate-500">Structuring output cleanly for revision and export.</p>
              </div>
            )}

            {!loading && !hasOutput && !error && (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center space-y-2">
                <p className="text-sm font-medium text-slate-300">Ready when you are</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Complete the parameters on the left and click Run to generate study-ready results you can copy or download.
                </p>
              </div>
            )}

            {/* Markdown Output */}
            {!loading && markdownResult && <MarkdownRenderer content={markdownResult} />}

            {/* Interactive Flashcard Deck */}
            {!loading && flashcards && flashcards.cards.length > 0 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-slate-200">{flashcards.deckTitle}</span>
                  <span className="font-mono tabular-nums">
                    Card {cardIdx + 1} / {flashcards.cards.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setFlipped((f) => !f)}
                  className="w-full min-h-[220px] rounded-2xl bg-[#080B18] border border-indigo-500/30 p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-4 hover:border-indigo-400/60 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-medium text-indigo-300">
                    {flipped ? 'Answer / Explanation' : 'Prompt (Click to Flip)'}
                  </span>
                  <p className="text-base sm:text-lg font-medium text-white leading-relaxed max-w-lg">
                    {flipped ? flashcards.cards[cardIdx].back : flashcards.cards[cardIdx].front}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                    <RotateCw className="w-3.5 h-3.5" />
                    Tap card to flip
                  </span>
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowHint((h) => !h)}
                    className="text-xs text-indigo-300 hover:text-indigo-200 underline underline-offset-2 cursor-pointer"
                  >
                    {showHint ? 'Hide Recall Hint' : 'Show Recall Hint'}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={cardIdx === 0}
                      onClick={() => {
                        setCardIdx((i) => Math.max(0, i - 1));
                        setFlipped(false);
                        setShowHint(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <button
                      type="button"
                      disabled={cardIdx >= flashcards.cards.length - 1}
                      onClick={() => {
                        setCardIdx((i) => Math.min(flashcards.cards.length - 1, i + 1));
                        setFlipped(false);
                        setShowHint(false);
                      }}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-xs text-white inline-flex items-center gap-1 cursor-pointer"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {showHint && (
                  <p className="text-xs text-slate-300 rounded-lg bg-slate-900/80 border border-slate-800 px-3.5 py-2.5">
                    Hint: {flashcards.cards[cardIdx].hint}
                  </p>
                )}
              </div>
            )}

            {/* Interactive Mind Map Hierarchy */}
            {!loading && mindMap && (
              <div className="space-y-5">
                <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/30 p-4 text-center">
                  <p className="text-xs text-indigo-300">Central Concept</p>
                  <h4 className="font-display text-lg font-bold text-white mt-0.5">{mindMap.centralTopic}</h4>
                  <p className="text-xs text-slate-300 mt-1">{mindMap.overview}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mindMap.branches.map((branch, idx) => (
                    <div key={branch.title + idx} className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-3">
                      <div>
                        <h5 className="font-display text-sm font-semibold text-indigo-200">
                          {idx + 1}. {branch.title}
                        </h5>
                        <p className="text-xs text-slate-400 mt-0.5">{branch.summary}</p>
                      </div>
                      <ul className="space-y-2">
                        {branch.nodes.map((node, ni) => (
                          <li key={node.label + ni} className="text-xs text-slate-200 border-t border-slate-800/70 pt-2">
                            <span className="font-semibold text-white">{node.label}: </span>
                            <span className="text-slate-300">{node.detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive MCQ / Mock Test Runner */}
            {!loading && mcqData && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-100 text-sm">{mcqData.title}</span>
                  <span className="font-mono tabular-nums">
                    {mcqData.questions.length} Questions · Est. {mcqData.durationMinutes} min
                  </span>
                </div>

                <div className="space-y-4">
                  {mcqData.questions.map((q, qi) => {
                    const picked = mcqSelections[qi];
                    return (
                      <div key={qi} className="rounded-xl bg-[#080B18] border border-slate-800 p-4 space-y-3">
                        <p className="text-sm font-medium text-white">
                          {qi + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => {
                            const isSelected = picked === oi;
                            const isCorrect = q.correctIndex === oi;
                            let style = 'border-slate-800 bg-[#0D1226] text-slate-300 hover:border-slate-600';
                            if (mcqSubmitted) {
                              if (isCorrect) style = 'border-emerald-500/70 bg-emerald-500/15 text-emerald-100';
                              else if (isSelected) style = 'border-rose-500/70 bg-rose-500/15 text-rose-100';
                            } else if (isSelected) {
                              style = 'border-indigo-500 bg-indigo-500/15 text-white';
                            }
                            return (
                              <button
                                key={oi}
                                type="button"
                                disabled={mcqSubmitted}
                                onClick={() => setMcqSelections((prev) => ({ ...prev, [qi]: oi }))}
                                className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${style}`}
                              >
                                <span className="font-mono mr-2 text-slate-400">{String.fromCharCode(65 + oi)}.</span>
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {mcqSubmitted && (
                          <p className="text-xs text-slate-300 pt-1">
                            <span className="font-semibold text-indigo-300">Explanation: </span>
                            {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {!mcqSubmitted ? (
                  <button
                    type="button"
                    onClick={() => setMcqSubmitted(true)}
                    className="aryash-primary-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                  >
                    Submit & Grade Answers
                  </button>
                ) : (
                  <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/30 p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      Score:{' '}
                      <span className="font-mono tabular-nums text-indigo-300">
                        {
                          mcqData.questions.filter((q, idx) => mcqSelections[idx] === q.correctIndex).length
                        }{' '}
                        / {mcqData.questions.length}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMcqSelections({});
                        setMcqSubmitted(false);
                      }}
                      className="text-xs text-indigo-300 hover:text-white underline cursor-pointer"
                    >
                      Retake Set
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
