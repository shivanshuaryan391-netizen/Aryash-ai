import type { AryashStoreState, StudentProfile } from '../types';

export const STORAGE_KEY = 'aryash_ai_student_state_v1';

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysOffsetIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function daysOffsetDateOnly(offsetDays: number): string {
  return daysOffsetIso(offsetDays).slice(0, 10);
}

export const DEFAULT_PROFILE: StudentProfile = {
  name: 'Student',
  targetExam: 'University & Competitive Exams',
  gradeOrProgram: 'Undergraduate / Senior Secondary',
  preferredLanguage: 'English',
  learningLevel: 'Intermediate',
  dailyGoalMinutes: 60,
  dailyGoalQuestions: 10,
  createdAt: new Date().toISOString(),
};

export function createEmptyState(profileOverrides?: Partial<StudentProfile>): AryashStoreState {
  return {
    version: 1,
    isDemoData: false,
    profile: {
      ...DEFAULT_PROFILE,
      ...profileOverrides,
    },
    tutorSessions: [],
    savedExplanations: [],
    quizAttempts: [],
    mistakes: [],
    tasks: [],
    exams: [],
    studySessions: [],
    habits: [
      {
        id: 'habit-daily-revision',
        name: 'Review Mistake Vault (15 min)',
        targetDaysPerWeek: 5,
        completedDates: [],
      },
      {
        id: 'habit-active-recall',
        name: 'Complete 1 Adaptive Practice Quiz',
        targetDaysPerWeek: 5,
        completedDates: [],
      },
    ],
    favoriteTools: ['ai-notes', 'maths-solver', 'pomodoro-timer', 'flashcard-generator'],
    recentTools: [],
    activities: [],
    angleClicks: {
      simple: 0,
      realLife: 0,
      technical: 0,
      stepByStep: 0,
    },
  };
}

/**
 * Sample student dataset — strictly opt-in and explicitly labeled as Sample Demo Data
 * across Dashboard, Learning DNA, and Analytics whenever loaded.
 */
export function createSampleDemoState(): AryashStoreState {
  return {
    version: 1,
    isDemoData: true,
    profile: {
      name: 'Aarav Sharma (Sample Profile)',
      targetExam: 'JEE Advanced & B.Tech Sem 3',
      gradeOrProgram: 'Engineering Sophomore',
      preferredLanguage: 'English',
      learningLevel: 'Intermediate',
      dailyGoalMinutes: 90,
      dailyGoalQuestions: 15,
      createdAt: daysOffsetIso(-14),
    },
    tutorSessions: [
      {
        id: 'demo-session-1',
        title: 'Eigenvalues & Linear Transformations',
        subject: 'Mathematics',
        topic: 'Eigenvalues & Eigenvectors',
        language: 'English',
        level: 'Intermediate',
        updatedAt: daysOffsetIso(-1),
        messages: [
          {
            id: 'demo-msg-1',
            role: 'user',
            content: 'Explain eigenvalues and eigenvectors intuitively and mathematically.',
            timestamp: daysOffsetIso(-1),
            subject: 'Mathematics',
            topic: 'Eigenvalues & Eigenvectors',
            language: 'English',
            level: 'Intermediate',
          },
          {
            id: 'demo-msg-2',
            role: 'assistant',
            content: 'Eigenvalues measure how much special invariant directions stretch under a matrix transformation.',
            timestamp: daysOffsetIso(-1),
            subject: 'Mathematics',
            topic: 'Eigenvalues & Eigenvectors',
            language: 'English',
            level: 'Intermediate',
            preferredAngleViewed: 'realLife',
            threeWay: {
              detectedSubject: 'Mathematics',
              detectedTopic: 'Eigenvalues & Eigenvectors',
              summary: 'An eigenvector keeps its direction when a matrix transforms space; its eigenvalue is the scaling factor.',
              simple:
                'Imagine stretching a rubber sheet in one direction. Most arrows drawn on the sheet tilt to a new angle, but arrows pointing straight along the stretch axis only get longer or shorter—never rotated. Those steady arrows are **eigenvectors**, and the stretch multiplier is the **eigenvalue**.',
              realLife:
                'In **image compression (PCA)** and **Google PageRank**, matrices describe complex networks or pixel correlations. Finding the largest eigenvectors reveals the most important structural axes of the data without losing core meaning.',
              technical:
                'For a square matrix $A \\in \\mathbb{R}^{n \\times n}$, a non-zero vector $v$ is an eigenvector with eigenvalue $\\lambda$ if $Av = \\lambda v$, equivalently $(A - \\lambda I)v = 0$. Non-trivial solutions exist iff the characteristic polynomial satisfies $\\det(A - \\lambda I) = 0$.',
              stepByStep:
                '1. Form the matrix $A - \\lambda I$.\n2. Compute the determinant $\\det(A - \\lambda I) = 0$ to obtain the characteristic polynomial.\n3. Solve for all roots $\\lambda_i$ (the eigenvalues).\n4. Substitute each $\\lambda_i$ back into $(A - \\lambda_i I)v = 0$ to find the nullspace basis (the eigenvectors).',
              keyTakeaways: [
                'Eigenvectors must be non-zero vectors whose direction stays invariant under matrix multiplication.',
                'Eigenvalues satisfy det(A - λI) = 0.',
                'Symmetric matrices always have real eigenvalues and orthogonal eigenvectors.',
              ],
              followUpQuestions: [
                'How do repeated eigenvalues affect diagonalization?',
                'Walk me through a 2x2 numerical example step by step.',
                'Why does det(A - λI) have to equal zero?',
              ],
            },
          },
        ],
      },
      {
        id: 'demo-session-2',
        title: 'Electrochemical Cells & Nernst Equation',
        subject: 'Chemistry',
        topic: 'Electrochemistry',
        language: 'English',
        level: 'Exam Prep',
        updatedAt: daysOffsetIso(-2),
        messages: [
          {
            id: 'demo-msg-3',
            role: 'user',
            content: 'How does the Nernst equation predict cell potential when concentration changes?',
            timestamp: daysOffsetIso(-2),
            subject: 'Chemistry',
            topic: 'Electrochemistry',
            language: 'English',
            level: 'Exam Prep',
          },
          {
            id: 'demo-msg-4',
            role: 'assistant',
            content: 'The Nernst equation adjusts standard cell potential E° based on reaction quotient Q and temperature.',
            timestamp: daysOffsetIso(-2),
            subject: 'Chemistry',
            topic: 'Electrochemistry',
            language: 'English',
            level: 'Exam Prep',
            preferredAngleViewed: 'stepByStep',
          },
        ],
      },
    ],
    savedExplanations: [
      {
        id: 'demo-saved-1',
        subject: 'Mathematics',
        topic: 'Eigenvalues & Eigenvectors',
        question: 'Explain eigenvalues and eigenvectors intuitively and mathematically.',
        angle: 'full',
        content:
          'An eigenvector keeps its direction when a matrix transforms space; its eigenvalue λ is the scaling factor satisfying det(A - λI) = 0.',
        savedAt: daysOffsetIso(-1),
      },
    ],
    quizAttempts: [
      {
        id: 'demo-quiz-1',
        title: 'Thermodynamics Core Laws Check',
        subject: 'Physics',
        topic: 'Thermodynamics',
        difficulty: 'Intermediate',
        questionType: 'Conceptual',
        totalQuestions: 5,
        correctCount: 2,
        scorePercent: 40,
        durationSeconds: 310,
        completedAt: daysOffsetIso(-5),
        answers: [
          {
            questionId: 'dq1',
            question: 'In a cyclic process for an ideal gas, what is the net change in internal energy ΔU?',
            subtopic: 'First Law of Thermodynamics',
            selectedIndex: 1,
            correctIndex: 0,
            isCorrect: false,
            explanation: 'Internal energy U is a state function, so returning to the initial state always gives ΔU = 0.',
            misconceptionNote: 'Confusing path functions (Q, W) with state functions (U).',
            options: ['Zero', 'Equal to work done W', 'Equal to heat absorbed Q', 'Always positive'],
          },
          {
            questionId: 'dq2',
            question: 'During an isothermal expansion of an ideal gas, heat absorbed Q equals:',
            subtopic: 'Isothermal Processes',
            selectedIndex: 0,
            correctIndex: 0,
            isCorrect: true,
            explanation: 'For an ideal gas at constant T, ΔU = 0, so Q = W.',
            misconceptionNote: 'Assuming ΔT = 0 implies Q = 0.',
            options: ['Work done by the gas W', 'Zero', 'Negative work -W', 'Change in enthalpy'],
          },
          {
            questionId: 'dq3',
            question: 'Which process has the steepest slope on a P-V indicator diagram?',
            subtopic: 'Adiabatic vs Isothermal',
            selectedIndex: 2,
            correctIndex: 1,
            isCorrect: false,
            explanation: 'Adiabatic slope is -γ(P/V), which is steeper than isothermal slope -(P/V) because γ > 1.',
            misconceptionNote: 'Forgetting the adiabatic index γ > 1 multiplies the slope magnitude.',
            options: ['Isobaric', 'Adiabatic', 'Isothermal', 'Isochoric'],
          },
          {
            questionId: 'dq4',
            question: 'Carnot engine efficiency depends exclusively on:',
            subtopic: 'Second Law & Carnot Cycle',
            selectedIndex: 1,
            correctIndex: 1,
            isCorrect: true,
            explanation: 'η = 1 - T_cold / T_hot in Kelvin; independent of working substance.',
            misconceptionNote: 'Using Celsius instead of Kelvin temperatures.',
            options: ['Working gas molar mass', 'Source and sink absolute temperatures', 'Cylinder volume', 'Piston mass'],
          },
          {
            questionId: 'dq5',
            question: 'In an adiabatic compression of an ideal gas, the temperature of the gas:',
            subtopic: 'Adiabatic Processes',
            selectedIndex: 2,
            correctIndex: 0,
            isCorrect: false,
            explanation: 'Q = 0 and work is done on the gas, so ΔU > 0 and temperature rises.',
            misconceptionNote: 'Equating Q = 0 (no heat transfer) with ΔT = 0 (no temperature change).',
            options: ['Increases', 'Decreases', 'Remains constant', 'Becomes zero'],
          },
        ],
      },
      {
        id: 'demo-quiz-2',
        title: 'Linear Algebra Foundations',
        subject: 'Mathematics',
        topic: 'Eigenvalues & Eigenvectors',
        difficulty: 'Intermediate',
        questionType: 'Mixed',
        totalQuestions: 5,
        correctCount: 4,
        scorePercent: 80,
        durationSeconds: 265,
        completedAt: daysOffsetIso(-3),
        answers: [
          {
            questionId: 'dq2-1',
            question: 'The sum of all eigenvalues of a square matrix equals its:',
            subtopic: 'Matrix Trace',
            selectedIndex: 0,
            correctIndex: 0,
            isCorrect: true,
            explanation: 'Trace(A) equals the sum of eigenvalues counted with algebraic multiplicity.',
            misconceptionNote: 'Confusing trace (sum) with determinant (product).',
            options: ['Trace', 'Determinant', 'Rank', 'Norm'],
          },
          {
            questionId: 'dq2-2',
            question: 'The product of all eigenvalues of a square matrix equals its:',
            subtopic: 'Matrix Determinant',
            selectedIndex: 1,
            correctIndex: 1,
            isCorrect: true,
            explanation: 'det(A) = Π λ_i.',
            misconceptionNote: 'Swapping trace and determinant identities.',
            options: ['Trace', 'Determinant', 'Inverse', 'Nullity'],
          },
          {
            questionId: 'dq2-3',
            question: 'If λ = 0 is an eigenvalue of A, then A is:',
            subtopic: 'Invertibility',
            selectedIndex: 2,
            correctIndex: 2,
            isCorrect: true,
            explanation: 'Zero eigenvalue implies det(A) = 0, meaning A is singular (non-invertible).',
            misconceptionNote: 'Thinking zero eigenvalue means the zero matrix.',
            options: ['Orthogonal', 'Identity', 'Singular', 'Positive definite'],
          },
          {
            questionId: 'dq2-4',
            question: 'Eigenvectors of a real symmetric matrix corresponding to distinct eigenvalues are:',
            subtopic: 'Spectral Theorem',
            selectedIndex: 0,
            correctIndex: 0,
            isCorrect: true,
            explanation: 'By the spectral theorem, distinct eigenspaces of symmetric matrices are mutually orthogonal.',
            misconceptionNote: 'Assuming any matrix has orthogonal eigenvectors.',
            options: ['Orthogonal', 'Parallel', 'Unit length only', 'Imaginary'],
          },
          {
            questionId: 'dq2-5',
            question: 'What are the eigenvalues of A² if A has eigenvalue λ?',
            subtopic: 'Powers of Matrices',
            selectedIndex: 1,
            correctIndex: 0,
            isCorrect: false,
            explanation: 'A²v = A(Av) = A(λv) = λ²v, so eigenvalues are squared.',
            misconceptionNote: 'Doubling the eigenvalue (2λ) instead of squaring it (λ²).',
            options: ['λ²', '2λ', 'λ + 2', '√λ'],
          },
        ],
      },
      {
        id: 'demo-quiz-3',
        title: 'Data Structures: Trees & Graphs',
        subject: 'Computer Science',
        topic: 'Graph Algorithms',
        difficulty: 'Advanced',
        questionType: 'Application',
        totalQuestions: 5,
        correctCount: 5,
        scorePercent: 100,
        durationSeconds: 290,
        completedAt: daysOffsetIso(-1),
        answers: [
          {
            questionId: 'dq3-1',
            question: 'Which data structure guarantees shortest path in an unweighted graph?',
            subtopic: 'BFS Traversal',
            selectedIndex: 0,
            correctIndex: 0,
            isCorrect: true,
            explanation: 'BFS explores nodes level by level using a FIFO queue.',
            misconceptionNote: 'Using DFS for shortest path in unweighted graphs.',
            options: ['Queue (BFS)', 'Stack (DFS)', 'Union-Find', 'Hash Set only'],
          },
          {
            questionId: 'dq3-2',
            question: 'Dijkstra algorithm fails when a graph contains:',
            subtopic: 'Shortest Paths',
            selectedIndex: 2,
            correctIndex: 2,
            isCorrect: true,
            explanation: 'Greedy relaxation assumes adding edges never reduces a finalized path distance.',
            misconceptionNote: 'Thinking cycles break Dijkstra instead of negative edge weights.',
            options: ['Positive cycles', 'Disconnected nodes', 'Negative edge weights', 'Sparse edges'],
          },
          {
            questionId: 'dq3-3',
            question: 'Time complexity of BFS on adjacency list with V vertices and E edges:',
            subtopic: 'Complexity Analysis',
            selectedIndex: 1,
            correctIndex: 1,
            isCorrect: true,
            explanation: 'Each vertex and edge is visited at most once.',
            misconceptionNote: 'Reporting O(V²) for adjacency list instead of matrix.',
            options: ['O(V²)', 'O(V + E)', 'O(E log V)', 'O(V log E)'],
          },
          {
            questionId: 'dq3-4',
            question: 'Topological sorting is possible only on:',
            subtopic: 'DAGs',
            selectedIndex: 0,
            correctIndex: 0,
            isCorrect: true,
            explanation: 'Directed Acyclic Graphs (DAGs) have no circular dependencies.',
            misconceptionNote: 'Applying topological sort to undirected trees without orientation.',
            options: ['Directed Acyclic Graphs', 'Complete graphs', 'Undirected cyclic graphs', 'Weighted meshes'],
          },
          {
            questionId: 'dq3-5',
            question: 'Inorder traversal of a Binary Search Tree yields keys in:',
            subtopic: 'BST Properties',
            selectedIndex: 1,
            correctIndex: 1,
            isCorrect: true,
            explanation: 'Left < Root < Right recursively prints ascending order.',
            misconceptionNote: 'Confusing preorder with sorted order.',
            options: ['Reverse level order', 'Sorted ascending order', 'Insertion order', 'Breadth-first order'],
          },
        ],
      },
    ],
    mistakes: [
      {
        id: 'demo-mistake-1',
        subject: 'Physics',
        topic: 'Thermodynamics',
        question: 'In an adiabatic compression of an ideal gas, what happens to temperature?',
        wrongAnswer: 'Remains constant',
        correctAnswer: 'Increases',
        whyWrong: 'Adiabatic means zero heat exchange (Q = 0), NOT constant temperature (ΔT = 0). Compression work raises internal energy.',
        misconceptionTag: 'Equating Q = 0 with ΔT = 0',
        occurrences: 3,
        resolved: false,
        createdAt: daysOffsetIso(-5),
        source: 'quiz',
      },
      {
        id: 'demo-mistake-2',
        subject: 'Physics',
        topic: 'Thermodynamics',
        question: 'In a cyclic process, what is net ΔU?',
        wrongAnswer: 'Equal to work done W',
        correctAnswer: 'Zero',
        whyWrong: 'Internal energy is a state function, so returning to the exact initial P-V-T state yields ΔU = 0.',
        misconceptionTag: 'Confusing State vs Path Functions',
        occurrences: 2,
        resolved: false,
        createdAt: daysOffsetIso(-4),
        source: 'quiz',
      },
      {
        id: 'demo-mistake-3',
        subject: 'Mathematics',
        topic: 'Eigenvalues & Eigenvectors',
        question: 'Eigenvalues of A² when A has eigenvalue λ',
        wrongAnswer: '2λ',
        correctAnswer: 'λ²',
        whyWrong: 'Applying A twice multiplies v by λ twice: A(Av) = A(λv) = λ²v.',
        misconceptionTag: 'Linear vs Power Scaling of Eigenvalues',
        occurrences: 1,
        resolved: true,
        createdAt: daysOffsetIso(-3),
        resolvedAt: daysOffsetIso(-1),
        source: 'quiz',
      },
    ],
    tasks: [
      {
        id: 'demo-task-1',
        title: 'Revise Adiabatic vs Isothermal P-V Curves',
        subject: 'Physics',
        topic: 'Thermodynamics',
        dayOfWeek: 'Thu',
        dueDate: daysOffsetDateOnly(0),
        durationMinutes: 40,
        priority: 'High',
        completed: false,
        createdAt: daysOffsetIso(-1),
      },
      {
        id: 'demo-task-2',
        title: 'Solve 10 Diagonalization Problems',
        subject: 'Mathematics',
        topic: 'Eigenvalues & Eigenvectors',
        dayOfWeek: 'Thu',
        dueDate: daysOffsetDateOnly(0),
        durationMinutes: 45,
        priority: 'Medium',
        completed: true,
        completedAt: daysOffsetIso(0),
        createdAt: daysOffsetIso(-2),
      },
      {
        id: 'demo-task-3',
        title: 'Practice Nernst Equation Numericals',
        subject: 'Chemistry',
        topic: 'Electrochemistry',
        dayOfWeek: 'Fri',
        dueDate: daysOffsetDateOnly(1),
        durationMinutes: 35,
        priority: 'High',
        completed: false,
        createdAt: daysOffsetIso(-1),
      },
    ],
    exams: [
      {
        id: 'demo-exam-1',
        name: 'Physics Mid-Semester Exam',
        subject: 'Physics',
        examDate: daysOffsetDateOnly(12),
        targetScore: '90%+',
      },
      {
        id: 'demo-exam-2',
        name: 'Linear Algebra Assessment',
        subject: 'Mathematics',
        examDate: daysOffsetDateOnly(21),
        targetScore: '95%+',
      },
    ],
    studySessions: [
      { id: 'ds-1', subject: 'Physics', topic: 'Thermodynamics', minutes: 45, source: 'quiz', completedAt: daysOffsetIso(-5) },
      { id: 'ds-2', subject: 'Mathematics', topic: 'Eigenvalues', minutes: 55, source: 'tutor', completedAt: daysOffsetIso(-4) },
      { id: 'ds-3', subject: 'Chemistry', topic: 'Electrochemistry', minutes: 40, source: 'pomodoro', completedAt: daysOffsetIso(-3) },
      { id: 'ds-4', subject: 'Computer Science', topic: 'Graph Algorithms', minutes: 65, source: 'quiz', completedAt: daysOffsetIso(-2) },
      { id: 'ds-5', subject: 'Mathematics', topic: 'Eigenvalues', minutes: 50, source: 'tutor', completedAt: daysOffsetIso(-1) },
      { id: 'ds-6', subject: 'Physics', topic: 'Thermodynamics', minutes: 30, source: 'pomodoro', completedAt: daysOffsetIso(0) },
    ],
    habits: [
      {
        id: 'habit-daily-revision',
        name: 'Review Mistake Vault (15 min)',
        targetDaysPerWeek: 5,
        completedDates: [daysOffsetDateOnly(-4), daysOffsetDateOnly(-3), daysOffsetDateOnly(-1), daysOffsetDateOnly(0)],
      },
      {
        id: 'habit-active-recall',
        name: 'Complete 1 Adaptive Practice Quiz',
        targetDaysPerWeek: 5,
        completedDates: [daysOffsetDateOnly(-5), daysOffsetDateOnly(-3), daysOffsetDateOnly(-1)],
      },
      {
        id: 'habit-pomodoro',
        name: 'Two Deep-Focus Pomodoro Cycles',
        targetDaysPerWeek: 6,
        completedDates: [daysOffsetDateOnly(-3), daysOffsetDateOnly(-2), daysOffsetDateOnly(-1), daysOffsetDateOnly(0)],
      },
    ],
    favoriteTools: ['ai-notes', 'maths-solver', 'pomodoro-timer', 'flashcard-generator', 'code-debugger'],
    recentTools: [
      { toolId: 'ai-notes', usedAt: daysOffsetIso(-1) },
      { toolId: 'pomodoro-timer', usedAt: daysOffsetIso(0) },
    ],
    activities: [
      {
        id: 'act-1',
        type: 'quiz',
        title: 'Completed Graph Algorithms Quiz',
        subject: 'Computer Science',
        detail: 'Scored 5/5 (100%) on Advanced difficulty',
        xpEarned: 120,
        timestamp: daysOffsetIso(-1),
      },
      {
        id: 'act-2',
        type: 'tutor',
        title: 'Three-Way Lesson: Eigenvalues & Eigenvectors',
        subject: 'Mathematics',
        detail: 'Explored Simple, Real-Life, Technical & Step-by-Step modes',
        xpEarned: 45,
        timestamp: daysOffsetIso(-1),
      },
      {
        id: 'act-3',
        type: 'mistake-resolved',
        title: 'Resolved Eigenvalue Scaling Misconception',
        subject: 'Mathematics',
        detail: 'Marked mistake as mastered after review',
        xpEarned: 60,
        timestamp: daysOffsetIso(-1),
      },
      {
        id: 'act-4',
        type: 'task-completed',
        title: 'Solved 10 Diagonalization Problems',
        subject: 'Mathematics',
        detail: 'Completed scheduled 45 min study block',
        xpEarned: 40,
        timestamp: daysOffsetIso(0),
      },
    ],
    angleClicks: {
      simple: 4,
      realLife: 9,
      technical: 5,
      stepByStep: 7,
    },
  };
}

function sanitizeText(val: unknown, fallback = ''): string {
  if (typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null') return fallback;
  return val;
}

export function loadStoreState(): AryashStoreState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyState();
    }
    const parsed = JSON.parse(raw) as Partial<AryashStoreState>;
    const empty = createEmptyState();

    const sanitizedSessions = Array.isArray(parsed.tutorSessions)
      ? parsed.tutorSessions
          .filter((s) => s && typeof s === 'object' && Array.isArray(s.messages))
          .map((s) => ({
            ...s,
            title: sanitizeText(s.title, 'Tutor Session'),
            subject: sanitizeText(s.subject, 'General'),
            topic: sanitizeText(s.topic, ''),
            language: s.language || 'English',
            level: s.level || 'Intermediate',
            messages: s.messages
              .filter((m) => m && typeof m === 'object')
              .map((m) => ({
                ...m,
                content: sanitizeText(m.content, ''),
                subject: sanitizeText(m.subject, sanitizeText(s.subject, 'General')),
                topic: sanitizeText(m.topic, sanitizeText(s.topic, 'Concept')),
                threeWay:
                  m.threeWay &&
                  typeof m.threeWay === 'object' &&
                  (sanitizeText(m.threeWay.simple) ||
                    sanitizeText(m.threeWay.realLife) ||
                    sanitizeText(m.threeWay.technical) ||
                    sanitizeText(m.threeWay.stepByStep))
                    ? {
                        detectedSubject: sanitizeText(m.threeWay.detectedSubject, sanitizeText(m.subject, 'General')),
                        detectedTopic: sanitizeText(m.threeWay.detectedTopic, sanitizeText(m.topic, 'Concept')),
                        summary: sanitizeText(m.threeWay.summary, sanitizeText(m.content, '')),
                        simple: sanitizeText(m.threeWay.simple, ''),
                        realLife: sanitizeText(m.threeWay.realLife, ''),
                        technical: sanitizeText(m.threeWay.technical, ''),
                        stepByStep: sanitizeText(m.threeWay.stepByStep, ''),
                        keyTakeaways: Array.isArray(m.threeWay.keyTakeaways)
                          ? m.threeWay.keyTakeaways.map((k) => sanitizeText(k)).filter(Boolean)
                          : [],
                        followUpQuestions: Array.isArray(m.threeWay.followUpQuestions)
                          ? m.threeWay.followUpQuestions.map((q) => sanitizeText(q)).filter(Boolean)
                          : [],
                      }
                    : undefined,
              }))
              .filter((m) => Boolean(m.content || m.threeWay)),
          }))
          .filter((s) => s.messages.length > 0)
      : [];

    const sanitizedSaved = Array.isArray(parsed.savedExplanations)
      ? parsed.savedExplanations
          .filter((item) => item && typeof item === 'object' && sanitizeText(item.content))
          .map((item) => ({
            ...item,
            subject: sanitizeText(item.subject, 'General'),
            topic: sanitizeText(item.topic, 'Saved Note'),
            question: sanitizeText(item.question, ''),
            content: sanitizeText(item.content, ''),
          }))
      : [];

    return {
      ...empty,
      ...parsed,
      tutorSessions: sanitizedSessions,
      savedExplanations: sanitizedSaved,
      profile: {
        ...empty.profile,
        ...(parsed.profile ?? {}),
      },
      angleClicks: {
        ...empty.angleClicks,
        ...(parsed.angleClicks ?? {}),
      },
    };
  } catch {
    return createEmptyState();
  }
}

export function saveStoreState(state: AryashStoreState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota exceeded or unavailable; fail gracefully without crashing UI
  }
}

export function clearStoreState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}
