import type { LanguageMode, LearningLevel, QuizQuestion, ThreeWayExplanation } from '../types';

export interface ApiErrorShape {
  code: string;
  error: string;
}

export class AiServiceError extends Error {
  code: string;
  status: number;

  constructor(message: string, code = 'UPSTREAM_ERROR', status = 500) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.status = status;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiServiceError(
      'Unable to reach the ARYASH AI server. Make sure the local server is running and try again.',
      'NETWORK_ERROR',
      0
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    // Non-JSON response
  }

  if (!response.ok) {
    const msg =
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}.`;
    const code = typeof payload.code === 'string' ? payload.code : 'UPSTREAM_ERROR';
    throw new AiServiceError(msg, code, response.status);
  }

  return payload as T;
}

export async function checkServerHealth(): Promise<{ status: string; geminiConfigured: boolean; model: string }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { status: 'error', geminiConfigured: false, model: 'gemini-4-hydrogen' };
    }
    return (await res.json()) as { status: string; geminiConfigured: boolean; model: string };
  } catch {
    return { status: 'offline', geminiConfigured: false, model: 'gemini-4-hydrogen' };
  }
}

export interface FileAttachmentPayload {
  name: string;
  mimeType: string;
  data: string; // raw base64 without data: prefix
}

export function fileToBase64Attachment(file: File): Promise<FileAttachmentPayload> {
  return new Promise((resolve, reject) => {
    const maxBytes = 8 * 1024 * 1024; // 8 MB safe limit
    if (file.size > maxBytes) {
      reject(new Error('File exceeds the 8 MB upload limit. Please choose a smaller PDF or image.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIdx = result.indexOf(',');
      const base64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
      resolve({
        name: file.name,
        mimeType: file.type || 'application/pdf',
        data: base64,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read the selected file.'));
    reader.readAsDataURL(file);
  });
}

export async function requestTutorResponse(params: {
  question: string;
  subject: string;
  topic: string;
  language: LanguageMode;
  level: LearningLevel;
  mode: 'three-way' | 'simple' | 'realLife' | 'technical' | 'stepByStep' | 'alternative';
  history?: { role: 'user' | 'assistant'; content: string }[];
  weakTopics?: string[];
  attachment?: FileAttachmentPayload;
}): Promise<
  | { mode: 'three-way'; data: ThreeWayExplanation; model: string }
  | { mode: 'single'; markdown: string; model: string }
> {
  return postJson('/api/ai/tutor', params);
}

export async function requestAdaptiveQuiz(params: {
  subject: string;
  topic: string;
  difficulty: LearningLevel;
  questionType: string;
  count: number;
  language: LanguageMode;
  weakConcepts?: string[];
}): Promise<{ data: { quizTitle: string; questions: QuizQuestion[] }; model: string }> {
  return postJson('/api/ai/quiz', params);
}

export interface MistakeDrillResponse {
  data: {
    rootCause: string;
    mentalModelFix: string;
    practiceQuestions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  };
  model: string;
}

export async function requestMistakeDrill(params: {
  subject: string;
  topic: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  misconception: string;
}): Promise<MistakeDrillResponse> {
  return postJson('/api/ai/mistake-drill', params);
}

export interface FlashcardDeckData {
  deckTitle: string;
  cards: { front: string; back: string; hint: string }[];
}

export interface MindMapData {
  centralTopic: string;
  overview: string;
  branches: {
    title: string;
    summary: string;
    nodes: { label: string; detail: string }[];
  }[];
}

export interface ToolMcqData {
  title: string;
  durationMinutes: number;
  questions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export async function requestToolExecution(params: {
  toolId: string;
  outputFormat: 'markdown' | 'flashcards' | 'mindmap' | 'mcq';
  systemPrompt: string;
  userPrompt: string;
  attachment?: FileAttachmentPayload;
}): Promise<{
  toolId: string;
  outputFormat: string;
  markdown?: string;
  data?: FlashcardDeckData | MindMapData | ToolMcqData;
  model: string;
}> {
  return postJson('/api/ai/tool', params);
}
