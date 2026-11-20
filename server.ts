import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, type GenerateContentParameters, type GenerateContentResponse } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

function getGeminiClient(): { ai: GoogleGenAI | null; model: string } {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'YOUR_GEMINI_API_KEY') {
    return { ai: null, model: DEFAULT_MODEL };
  }
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  return { ai, model: DEFAULT_MODEL };
}

interface ParsedApiError {
  status: number;
  code:
    | 'MISSING_API_KEY'
    | 'RATE_LIMITED'
    | 'PERMISSION_DENIED'
    | 'MODEL_UNAVAILABLE'
    | 'INVALID_RESPONSE'
    | 'UPSTREAM_ERROR';
  message: string;
}

function unwrapErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: string } };
    if (parsed?.error?.message) return parsed.error.message;
  } catch {
    // Raw message is plain text or prefixed JSON
    const jsonStart = raw.indexOf('{');
    if (jsonStart >= 0) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart)) as { error?: { message?: string } };
        if (parsed?.error?.message) return parsed.error.message;
      } catch {
        // Ignore parse failure
      }
    }
  }
  return raw;
}

function classifyGeminiError(err: unknown): ParsedApiError {
  const raw = err instanceof Error ? err.message : String(err ?? '');
  const unwrapped = unwrapErrorMessage(err);
  const lower = `${raw} ${unwrapped}`.toLowerCase();

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota') || lower.includes('rate limit')) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      message:
        'Gemini API rate limit reached. Please wait a few seconds and try again, or verify your quota in Settings > Secrets.',
    };
  }
  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid') || lower.includes('invalid api key')) {
    return {
      status: 403,
      code: 'PERMISSION_DENIED',
      message:
        'The configured Gemini API key was rejected or lacks permission for this model. Check your key in Settings > Secrets.',
    };
  }
  if (lower.includes('503') || lower.includes('unavailable') || lower.includes('high demand') || lower.includes('overloaded')) {
    return {
      status: 503,
      code: 'MODEL_UNAVAILABLE',
      message: 'The AI model is temporarily experiencing high demand. Please retry in a few seconds.',
    };
  }
  return {
    status: 502,
    code: 'UPSTREAM_ERROR',
    message: unwrapped.length > 260 ? `${unwrapped.slice(0, 260)}...` : unwrapped || 'Unable to complete AI request right now.',
  };
}

function isTransientCapacityError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('500') ||
    msg.includes('unavailable') ||
    msg.includes('high demand') ||
    msg.includes('overloaded') ||
    msg.includes('timeout') ||
    msg.includes('econnreset')
  );
}

/**
 * Calls Gemini with exponential backoff on transient failures and seamlessly
 * falls back to an eligible free-tier model if the primary model is experiencing
 * a temporary 503 high-demand spike.
 */
async function generateContentResilient(
  ai: GoogleGenAI,
  primaryModel: string,
  params: Omit<GenerateContentParameters, 'model'>
): Promise<{ response: GenerateContentResponse; modelUsed: string }> {
  const modelsToTry = primaryModel === FALLBACK_MODEL ? [primaryModel] : [primaryModel, FALLBACK_MODEL];
  let lastError: unknown;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...params,
          model: modelName,
        });
        return { response, modelUsed: modelName };
      } catch (err) {
        lastError = err;
        if (!isTransientCapacityError(err)) {
          throw err;
        }
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 650 * attempt));
        }
      }
    }
  }

  throw lastError;
}

/**
 * Extracts genuine generated text from a Gemini GenerateContentResponse,
 * inspecting candidates[].content.parts (excluding internal thought parts)
 * as well as response.text. Never returns "undefined" or "null".
 */
function extractGeminiText(response: GenerateContentResponse | null | undefined): string {
  if (!response) return '';

  const candidates = response.candidates;
  if (Array.isArray(candidates) && candidates.length > 0) {
    for (const candidate of candidates) {
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts) && parts.length > 0) {
        const nonThoughtTexts = parts
          .filter((part) => {
            const p = part as { text?: unknown; thought?: boolean };
            return typeof p?.text === 'string' && p.thought !== true && p.text.trim().length > 0;
          })
          .map((part) => String((part as { text: string }).text));
        if (nonThoughtTexts.length > 0) {
          const joined = nonThoughtTexts.join('\n').trim();
          if (joined && joined !== 'undefined' && joined !== 'null') {
            return joined;
          }
        }
      }
    }
  }

  const directText = typeof response.text === 'string' ? response.text.trim() : '';
  if (directText && directText !== 'undefined' && directText !== 'null') {
    return directText;
  }

  return '';
}

function buildContentParts(promptText: string, attachment?: { mimeType?: string; data?: string; name?: string }) {
  if (attachment?.data && attachment?.mimeType) {
    const allowedMime = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'text/plain',
    ];
    const safeMime = allowedMime.includes(attachment.mimeType) ? attachment.mimeType : 'application/pdf';
    return {
      parts: [
        {
          inlineData: {
            mimeType: safeMime,
            data: attachment.data,
          },
        },
        { text: promptText },
      ],
    };
  }
  return promptText;
}

function safeJsonParse<T>(raw: string | undefined): T | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Attempt extracting outermost JSON object or array if wrapped in prose
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // Fall through
      }
    }
    return null;
  }
}

function cleanStringField(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
    return '';
  }
  return trimmed;
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanStringField(item)).filter((item) => item.length > 0);
}

interface NormalizedThreeWay {
  detectedSubject: string;
  detectedTopic: string;
  summary: string;
  simple: string;
  realLife: string;
  technical: string;
  stepByStep: string;
  keyTakeaways: string[];
  followUpQuestions: string[];
}

function normalizeThreeWayPayload(
  parsed: Record<string, unknown> | null,
  fallbackSubject: string,
  fallbackTopic: string
): NormalizedThreeWay | null {
  if (!parsed || typeof parsed !== 'object') return null;

  const detectedSubject =
    cleanStringField(parsed.detectedSubject ?? parsed.detected_subject ?? parsed.subject) || fallbackSubject || 'General';
  const detectedTopic =
    cleanStringField(parsed.detectedTopic ?? parsed.detected_topic ?? parsed.topic) || fallbackTopic || 'Concept Explanation';

  const simple = cleanStringField(parsed.simple ?? parsed.simpleMode ?? parsed.simple_mode);
  const realLife = cleanStringField(parsed.realLife ?? parsed.real_life ?? parsed.realLifeMode ?? parsed.real_life_mode);
  const technical = cleanStringField(parsed.technical ?? parsed.technicalMode ?? parsed.technical_mode);
  const stepByStep = cleanStringField(
    parsed.stepByStep ?? parsed.step_by_step ?? parsed.stepByStepMode ?? parsed.step_by_step_mode
  );
  const summary =
    cleanStringField(parsed.summary ?? parsed.overview) ||
    (simple ? simple.split(/(?<=[.!?।])\s+/)[0] : '');

  // Ensure at least all core explanation sections are genuinely populated
  const populatedCount = [simple, realLife, technical, stepByStep].filter(Boolean).length;
  if (populatedCount < 4 || !summary) {
    return null;
  }

  return {
    detectedSubject,
    detectedTopic,
    summary,
    simple,
    realLife,
    technical,
    stepByStep,
    keyTakeaways: cleanStringArray(parsed.keyTakeaways ?? parsed.key_takeaways),
    followUpQuestions: cleanStringArray(parsed.followUpQuestions ?? parsed.follow_up_questions),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const { ai, model } = getGeminiClient();
    res.json({
      status: 'ok',
      geminiConfigured: Boolean(ai),
      model,
      fallbackModel: FALLBACK_MODEL,
    });
  });

  // 1. AI TUTOR STUDIO (Three-Way Explanation Engine + Step-by-Step + Conversational Follow-up)
  app.post('/api/ai/tutor', async (req: Request, res: Response) => {
    const { ai, model } = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY in your environment (.env or Settings > Secrets) to enable live AI tutoring.',
      });
      return;
    }

    const {
      question,
      subject = 'General',
      topic = '',
      language = 'English',
      level = 'Intermediate',
      mode = 'three-way',
      history = [],
      weakTopics = [],
      attachment,
    } = req.body ?? {};

    const safeQuestion = cleanStringField(question);
    const safeSubject = cleanStringField(subject) || 'General';
    const safeTopic = cleanStringField(topic);

    if (!safeQuestion) {
      res.status(400).json({ code: 'INVALID_INPUT', error: 'Please enter a valid concept or question to explain.' });
      return;
    }

    const langDirective =
      language === 'Hindi'
        ? 'Respond completely in clear, natural Hindi (Devanagari script), keeping essential technical terms in English brackets for clarity. Every single JSON field (summary, simple, realLife, technical, stepByStep, keyTakeaways, followUpQuestions) MUST be written in Hindi.'
        : language === 'Hinglish'
          ? 'Respond in clear, student-friendly Hinglish (conversational Hindi written in Roman script mixed with standard English academic terms).'
          : 'Respond in clear, crisp, student-friendly English.';

    const weakContext =
      Array.isArray(weakTopics) && weakTopics.length > 0
        ? `The student currently needs extra clarity in: ${weakTopics.slice(0, 5).join(', ')}. Bridge concepts carefully if relevant.`
        : '';

    const historyText =
      Array.isArray(history) && history.length > 0
        ? `Recent conversation context:\n${history
            .slice(-6)
            .map((m: { role?: string; content?: string }) => {
              const content = cleanStringField(m?.content);
              return content ? `${m.role === 'user' ? 'Student' : 'Tutor'}: ${content.slice(0, 500)}` : '';
            })
            .filter(Boolean)
            .join('\n')}`
        : '';

    try {
      if (mode === 'three-way') {
        const prompt = `${historyText}\n\nStudent Question/Concept: "${safeQuestion}"\nSubject: ${safeSubject}\nTopic Hint: ${safeTopic || 'Auto-detect from the question'}\nStudent Level: ${level}\n${weakContext}\n\n${langDirective}\n\nGenerate a thorough, genuine Three-Way Explanation plus Step-by-Step teaching breakdown. Populate every required JSON field with rich, complete, non-empty markdown explanations.`;

        const { response, modelUsed } = await generateContentResilient(ai, model, {
          contents: buildContentParts(prompt, attachment),
          config: {
            systemInstruction:
              'You are ARYASH AI, a precision adaptive tutor. For every concept, deliver 4 complete, non-empty pedagogical explanations in JSON: (1) simple — intuitive beginner explanation without jargon; (2) realLife — vivid everyday analogy and practical real-world example; (3) technical — rigorous academic terminology, formulas, or formal definitions; (4) stepByStep — numbered progressive mastery walkthrough. Never leave any field empty or undefined.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                detectedSubject: { type: Type.STRING },
                detectedTopic: { type: Type.STRING },
                summary: { type: Type.STRING, description: 'A concise 1-2 sentence anchor takeaway.' },
                simple: { type: Type.STRING, description: 'Simple mode markdown explanation for a beginner.' },
                realLife: { type: Type.STRING, description: 'Real-life analogy and practical example markdown.' },
                technical: { type: Type.STRING, description: 'Rigorous academic and technical markdown explanation.' },
                stepByStep: { type: Type.STRING, description: 'Numbered step-by-step guided walkthrough in markdown.' },
                keyTakeaways: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 to 4 crisp bullet takeaways.',
                },
                followUpQuestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: '3 natural follow-up questions the student might ask next.',
                },
              },
              required: [
                'detectedSubject',
                'detectedTopic',
                'summary',
                'simple',
                'realLife',
                'technical',
                'stepByStep',
                'keyTakeaways',
                'followUpQuestions',
              ],
            },
          },
        });

        const rawText = extractGeminiText(response);
        const parsed = safeJsonParse<Record<string, unknown>>(rawText);
        const normalized = normalizeThreeWayPayload(parsed, safeSubject, safeTopic || safeQuestion.slice(0, 48));

        if (!normalized) {
          // If Gemini returned valid plain text instead of structured JSON, return it honestly as single-mode markdown rather than blank cards
          if (rawText && !rawText.startsWith('{')) {
            res.json({ mode: 'single', markdown: rawText, model: modelUsed });
            return;
          }
          res.status(502).json({
            code: 'INVALID_RESPONSE',
            error: 'Received an incomplete explanation format from Gemini. Please click Retry to generate again.',
          });
          return;
        }

        res.json({ mode: 'three-way', data: normalized, model: modelUsed });
        return;
      }

      // Single-angle or alternative explanation follow-up
      const modeInstructions: Record<string, string> = {
        simple: 'Explain in SIMPLE MODE for a complete beginner with zero heavy jargon.',
        realLife: 'Explain in REAL-LIFE MODE using relatable everyday analogies and concrete practical examples.',
        technical: 'Explain in TECHNICAL MODE using rigorous academic definitions, principles, and formulas.',
        stepByStep: 'Explain in STEP-BY-STEP MODE as a numbered sequential derivation or guided process.',
        alternative: 'Explain this concept again using a completely fresh analogy, mental model, and visual structure.',
      };

      const prompt = `${historyText}\n\nStudent request: "${safeQuestion}"\nSubject: ${safeSubject}\nTopic: ${safeTopic || 'General'}\nLevel: ${level}\n${weakContext}\n${modeInstructions[mode] || modeInstructions.alternative}\n${langDirective}`;

      const { response, modelUsed } = await generateContentResilient(ai, model, {
        contents: buildContentParts(prompt, attachment),
        config: {
          systemInstruction:
            'You are ARYASH AI, a supportive, rigorous personal tutor. Format responses cleanly with Markdown headings, lists, and code/formula blocks where appropriate. Do not fabricate citations.',
        },
      });

      const markdown = extractGeminiText(response);
      if (!markdown) {
        res.status(502).json({
          code: 'INVALID_RESPONSE',
          error: 'Gemini returned an empty explanation. Please try rephrasing or retrying.',
        });
        return;
      }

      res.json({ mode: 'single', markdown, model: modelUsed });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ code: classified.code, error: classified.message });
    }
  });

  // 2. ADAPTIVE QUIZ ARENA
  app.post('/api/ai/quiz', async (req: Request, res: Response) => {
    const { ai, model } = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'GEMINI_API_KEY is not configured on the server. Configure GEMINI_API_KEY in Settings > Secrets or .env to generate adaptive quizzes.',
      });
      return;
    }

    const {
      subject = 'Mathematics',
      topic = 'Core Concepts',
      difficulty = 'Intermediate',
      questionType = 'Mixed',
      count = 5,
      language = 'English',
      weakConcepts = [],
    } = req.body ?? {};

    const clampedCount = Math.min(Math.max(Number(count) || 5, 3), 10);
    const weakPrompt =
      Array.isArray(weakConcepts) && weakConcepts.length > 0
        ? `Focus especially on testing and reinforcing these weak concepts or past mistakes: ${weakConcepts.slice(0, 6).join('; ')}.`
        : '';

    try {
      const { response, modelUsed } = await generateContentResilient(ai, model, {
        contents: `Create ${clampedCount} ${difficulty}-level ${questionType} exam questions for Subject: "${subject}", Topic: "${topic}". Language: ${language}. ${weakPrompt} Each question must have 4 distinct, unambiguous options (only one correct), a clear conceptual explanation for why the correct answer is right and why distractors fail, a specific subtopic tag, and a common misconception note.`,
        config: {
          systemInstruction:
            'You are an adaptive academic examiner for ARYASH AI. Generate accurate, fair, curriculum-aligned multiple-choice questions that test true understanding rather than trivia. Ensure correctIndex is strictly 0, 1, 2, or 3 matching the options array.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quizTitle: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    question: { type: Type.STRING },
                    category: { type: Type.STRING, description: 'MCQ, Conceptual, or Application' },
                    subtopic: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                    misconceptionNote: { type: Type.STRING },
                  },
                  required: [
                    'id',
                    'question',
                    'category',
                    'subtopic',
                    'options',
                    'correctIndex',
                    'explanation',
                    'misconceptionNote',
                  ],
                },
              },
            },
            required: ['quizTitle', 'questions'],
          },
        },
      });

      const rawText = extractGeminiText(response);
      const parsed = safeJsonParse<{ quizTitle?: string; questions?: unknown[] }>(rawText);
      if (!parsed || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
        res.status(502).json({
          code: 'INVALID_RESPONSE',
          error: 'Could not parse valid quiz questions from the AI response. Please try again.',
        });
        return;
      }

      res.json({ data: parsed, model: modelUsed });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ code: classified.code, error: classified.message });
    }
  });

  // 3. MISTAKE MEMORY VAULT — TARGETED REVISION DRILL
  app.post('/api/ai/mistake-drill', async (req: Request, res: Response) => {
    const { ai, model } = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'GEMINI_API_KEY is not configured on the server. Add GEMINI_API_KEY to generate targeted mistake revision drills.',
      });
      return;
    }

    const { subject, topic, question, wrongAnswer, correctAnswer, misconception } = req.body ?? {};
    if (!topic && !question) {
      res.status(400).json({ code: 'INVALID_INPUT', error: 'Mistake details are required.' });
      return;
    }

    try {
      const { response, modelUsed } = await generateContentResilient(ai, model, {
        contents: `A student made a mistake in ${subject || 'General'} — ${topic || 'Concept'}.
Original question/concept: ${question}
Student's mistake/wrong answer: ${wrongAnswer || 'Not specified'}
Correct concept/answer: ${correctAnswer || 'Not specified'}
Suspected misconception: ${misconception || 'Analyze from the mistake'}

Provide:
1. rootCause: Clear diagnosis of why students make this exact mistake.
2. mentalModelFix: A concise memory hook or rule to prevent repeating it.
3. practiceQuestions: 3 targeted multiple-choice revision questions specifically designed to cure this misconception.`,
        config: {
          systemInstruction:
            'You are the ARYASH AI Mistake Memory Coach. Diagnose conceptual root causes with empathy and academic rigor, then create 3 targeted mastery-check MCQs.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCause: { type: Type.STRING },
              mentalModelFix: { type: Type.STRING },
              practiceQuestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    explanation: { type: Type.STRING },
                  },
                  required: ['question', 'options', 'correctIndex', 'explanation'],
                },
              },
            },
            required: ['rootCause', 'mentalModelFix', 'practiceQuestions'],
          },
        },
      });

      const parsed = safeJsonParse<Record<string, unknown>>(extractGeminiText(response));
      if (!parsed) {
        res.status(502).json({ code: 'INVALID_RESPONSE', error: 'Failed to parse revision drill. Please retry.' });
        return;
      }
      res.json({ data: parsed, model: modelUsed });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ code: classified.code, error: classified.message });
    }
  });

  // 4. STUDENT PRODUCTIVITY TOOLKIT (ALL AI-POWERED TOOLS)
  app.post('/api/ai/tool', async (req: Request, res: Response) => {
    const { ai, model } = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        code: 'MISSING_API_KEY',
        error:
          'GEMINI_API_KEY is not configured on the server. Configure GEMINI_API_KEY in Settings > Secrets or .env to run AI tools.',
      });
      return;
    }

    const { toolId, outputFormat = 'markdown', systemPrompt, userPrompt, attachment } = req.body ?? {};
    const safeUserPrompt = cleanStringField(userPrompt);
    if (!safeUserPrompt) {
      res.status(400).json({ code: 'INVALID_INPUT', error: 'Please provide input for this tool.' });
      return;
    }

    try {
      if (outputFormat === 'flashcards') {
        const { response, modelUsed } = await generateContentResilient(ai, model, {
          contents: buildContentParts(safeUserPrompt, attachment),
          config: {
            systemInstruction:
              systemPrompt || 'Generate high-retention revision flashcards with concise fronts, thorough backs, and memory hints.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                deckTitle: { type: Type.STRING },
                cards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      front: { type: Type.STRING },
                      back: { type: Type.STRING },
                      hint: { type: Type.STRING },
                    },
                    required: ['front', 'back', 'hint'],
                  },
                },
              },
              required: ['deckTitle', 'cards'],
            },
          },
        });
        const parsed = safeJsonParse<Record<string, unknown>>(extractGeminiText(response));
        if (!parsed) {
          res.status(502).json({ code: 'INVALID_RESPONSE', error: 'Could not parse generated flashcards.' });
          return;
        }
        res.json({ toolId, outputFormat, data: parsed, model: modelUsed });
        return;
      }

      if (outputFormat === 'mindmap') {
        const { response, modelUsed } = await generateContentResilient(ai, model, {
          contents: buildContentParts(safeUserPrompt, attachment),
          config: {
            systemInstruction:
              systemPrompt || 'Organize the topic into a clear hierarchical mind map with a central concept, 4 to 6 branches, and concrete child nodes with brief explanations.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                centralTopic: { type: Type.STRING },
                overview: { type: Type.STRING },
                branches: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      nodes: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            detail: { type: Type.STRING },
                          },
                          required: ['label', 'detail'],
                        },
                      },
                    },
                    required: ['title', 'summary', 'nodes'],
                  },
                },
              },
              required: ['centralTopic', 'overview', 'branches'],
            },
          },
        });
        const parsed = safeJsonParse<Record<string, unknown>>(extractGeminiText(response));
        if (!parsed) {
          res.status(502).json({ code: 'INVALID_RESPONSE', error: 'Could not parse mind map structure.' });
          return;
        }
        res.json({ toolId, outputFormat, data: parsed, model: modelUsed });
        return;
      }

      if (outputFormat === 'mcq') {
        const { response, modelUsed } = await generateContentResilient(ai, model, {
          contents: buildContentParts(safeUserPrompt, attachment),
          config: {
            systemInstruction:
              systemPrompt || 'Generate exam-grade multiple-choice questions with 4 options, exact correctIndex (0-3), and concise explanations.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                durationMinutes: { type: Type.INTEGER },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                    },
                    required: ['question', 'options', 'correctIndex', 'explanation'],
                  },
                },
              },
              required: ['title', 'durationMinutes', 'questions'],
            },
          },
        });
        const parsed = safeJsonParse<Record<string, unknown>>(extractGeminiText(response));
        if (!parsed) {
          res.status(502).json({ code: 'INVALID_RESPONSE', error: 'Could not parse generated test questions.' });
          return;
        }
        res.json({ toolId, outputFormat, data: parsed, model: modelUsed });
        return;
      }

      // Standard clean Markdown output for notes, solvers, writing, coding, OCR, PDF chat, etc.
      const { response, modelUsed } = await generateContentResilient(ai, model, {
        contents: buildContentParts(safeUserPrompt, attachment),
        config: {
          systemInstruction:
            systemPrompt ||
            'You are ARYASH AI, a precise academic productivity engine. Produce structured, accurate, exam-ready Markdown output with clear headings, formulas, tables, or code blocks as appropriate.',
        },
      });

      const markdown = extractGeminiText(response);
      if (!markdown) {
        res.status(502).json({ code: 'INVALID_RESPONSE', error: 'Empty AI response. Please try again.' });
        return;
      }

      res.json({ toolId, outputFormat: 'markdown', markdown, model: modelUsed });
    } catch (err) {
      const classified = classifyGeminiError(err);
      res.status(classified.status).json({ code: classified.code, error: classified.message });
    }
  });

  // Vite dev middleware or production static assets
  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARYASH AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ARYASH AI server:', err);
  process.exit(1);
});
