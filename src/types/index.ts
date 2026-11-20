export type AppRoute =
  | 'landing'
  | 'dashboard'
  | 'tutor'
  | 'learning-dna'
  | 'quiz'
  | 'mistakes'
  | 'planner'
  | 'analytics'
  | 'tools';

export type LanguageMode = 'English' | 'Hindi' | 'Hinglish';
export type LearningLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Exam Prep';
export type ExplanationAngle = 'simple' | 'realLife' | 'technical' | 'stepByStep';

export interface StudentProfile {
  name: string;
  targetExam: string;
  gradeOrProgram: string;
  preferredLanguage: LanguageMode;
  learningLevel: LearningLevel;
  dailyGoalMinutes: number;
  dailyGoalQuestions: number;
  createdAt: string;
}

export interface ThreeWayExplanation {
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

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  subject: string;
  topic: string;
  language: LanguageMode;
  level: LearningLevel;
  attachmentName?: string;
  threeWay?: ThreeWayExplanation;
  preferredAngleViewed?: ExplanationAngle;
}

export interface TutorSession {
  id: string;
  title: string;
  subject: string;
  topic: string;
  language: LanguageMode;
  level: LearningLevel;
  updatedAt: string;
  messages: TutorMessage[];
}

export interface SavedExplanation {
  id: string;
  subject: string;
  topic: string;
  question: string;
  angle: ExplanationAngle | 'full';
  content: string;
  threeWay?: ThreeWayExplanation;
  savedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  category: string;
  subtopic: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptionNote: string;
}

export interface QuizAnswerRecord {
  questionId: string;
  question: string;
  subtopic: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  misconceptionNote: string;
  options: string[];
}

export interface QuizAttempt {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: LearningLevel;
  questionType: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  durationSeconds: number;
  completedAt: string;
  answers: QuizAnswerRecord[];
}

export interface MistakeRecord {
  id: string;
  subject: string;
  topic: string;
  question: string;
  wrongAnswer: string;
  correctAnswer: string;
  whyWrong: string;
  misconceptionTag: string;
  occurrences: number;
  resolved: boolean;
  createdAt: string;
  lastReviewedAt?: string;
  resolvedAt?: string;
  source: 'quiz' | 'manual' | 'tutor';
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  topic: string;
  dayOfWeek: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dueDate: string;
  durationMinutes: number;
  priority: 'Low' | 'Medium' | 'High';
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface ExamCountdown {
  id: string;
  name: string;
  subject: string;
  examDate: string;
  targetScore: string;
}

export interface StudySessionLog {
  id: string;
  subject: string;
  topic: string;
  minutes: number;
  source: 'tutor' | 'quiz' | 'pomodoro' | 'mistake-drill' | 'tool' | 'planner';
  completedAt: string;
}

export interface HabitItem {
  id: string;
  name: string;
  targetDaysPerWeek: number;
  completedDates: string[]; // YYYY-MM-DD
}

export interface ToolUsageRecord {
  toolId: string;
  usedAt: string;
}

export interface LearningActivityEvent {
  id: string;
  type: 'tutor' | 'quiz' | 'mistake-resolved' | 'task-completed' | 'pomodoro' | 'tool';
  title: string;
  subject: string;
  detail: string;
  xpEarned: number;
  timestamp: string;
}

export interface AryashStoreState {
  version: number;
  isDemoData: boolean;
  profile: StudentProfile;
  tutorSessions: TutorSession[];
  savedExplanations: SavedExplanation[];
  quizAttempts: QuizAttempt[];
  mistakes: MistakeRecord[];
  tasks: StudyTask[];
  exams: ExamCountdown[];
  studySessions: StudySessionLog[];
  habits: HabitItem[];
  favoriteTools: string[];
  recentTools: ToolUsageRecord[];
  activities: LearningActivityEvent[];
  angleClicks: Record<ExplanationAngle, number>;
}

export interface TopicMasteryMetric {
  subject: string;
  topic: string;
  masteryScore: number; // 0-100
  confidenceScore: number; // 0-100
  quizQuestionsAnswered: number;
  quizCorrect: number;
  tutorInteractions: number;
  unresolvedMistakes: number;
  status: 'Mastered' | 'Developing' | 'Needs Focus';
}

export interface SubjectSummary {
  subject: string;
  averageMastery: number;
  quizAccuracy: number | null;
  sessionsCount: number;
  unresolvedMistakes: number;
  totalMinutes: number;
}

export interface AdaptiveRecommendation {
  id: string;
  priority: 'High' | 'Medium' | 'Next';
  actionType: 'mistake-drill' | 'tutor' | 'quiz' | 'planner';
  title: string;
  reason: string;
  subject: string;
  topic: string;
  ctaLabel: string;
}

export interface LearningDNAProfile {
  hasSufficientData: boolean;
  totalInteractions: number;
  minimumRequiredInteractions: number;
  overallMastery: number;
  overallConfidence: number;
  quizAverage: number | null;
  streakDays: number;
  totalXP: number;
  levelNumber: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  dominantAngle: ExplanationAngle | null;
  recommendedDifficulty: LearningLevel;
  topicMetrics: TopicMasteryMetric[];
  subjectSummaries: SubjectSummary[];
  strongSubjects: SubjectSummary[];
  weakSubjects: SubjectSummary[];
  knowledgeGaps: TopicMasteryMetric[];
  recurringMisconceptions: { tag: string; subject: string; count: number; resolvedCount: number }[];
  recommendations: AdaptiveRecommendation[];
  achievements: { id: string; title: string; detail: string; unlocked: boolean }[];
}

export type ToolCategoryId =
  | 'study-notes'
  | 'exam-prep'
  | 'math-science'
  | 'writing-comm'
  | 'coding-cs'
  | 'productivity';

export type ToolExecutionMode =
  | 'ai-markdown'
  | 'ai-flashcards'
  | 'ai-mindmap'
  | 'ai-mcq'
  | 'ai-document'
  | 'local-pomodoro'
  | 'local-tasks'
  | 'local-habits'
  | 'local-attendance'
  | 'local-cgpa';

export interface ToolField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'file';
  placeholder?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string;
  accept?: string;
  helperText?: string;
}

export interface ToolDefinition {
  id: string;
  number: number;
  name: string;
  shortDesc: string;
  category: ToolCategoryId;
  categoryLabel: string;
  executionMode: ToolExecutionMode;
  requiresAI: boolean;
  fields?: ToolField[];
  systemPrompt?: string;
  buildPrompt?: (values: Record<string, string>) => string;
}
