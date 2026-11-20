import type {
  AdaptiveRecommendation,
  AryashStoreState,
  ExplanationAngle,
  LearningDNAProfile,
  LearningLevel,
  SubjectSummary,
  TopicMasteryMetric,
} from '../types';

const MIN_REQUIRED_INTERACTIONS = 3;

function computeStreakDays(timestamps: string[]): number {
  if (timestamps.length === 0) return 0;
  const uniqueDates = new Set(timestamps.map((t) => t.slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  const todayStr = cursor.toISOString().slice(0, 10);

  // Allow streak to start today or yesterday if student hasn't logged today yet
  if (!uniqueDates.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!uniqueDates.has(cursor.toISOString().slice(0, 10))) {
      return 0;
    }
  }

  while (uniqueDates.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function computeLearningDNA(state: AryashStoreState): LearningDNAProfile {
  const tutorMessageCount = state.tutorSessions.reduce(
    (sum, s) => sum + s.messages.filter((m) => m.role === 'assistant').length,
    0
  );
  const totalInteractions =
    tutorMessageCount + state.quizAttempts.length + state.mistakes.length + state.studySessions.length;

  const hasSufficientData = totalInteractions >= MIN_REQUIRED_INTERACTIONS;

  // Compute XP strictly from real stored activities
  const totalXP = state.activities.reduce((sum, a) => sum + a.xpEarned, 0);
  const xpPerLevel = 250;
  const levelNumber = Math.floor(totalXP / xpPerLevel) + 1;
  const xpIntoLevel = totalXP % xpPerLevel;

  // Compute real streak from activity + study session timestamps
  const allTimestamps = [
    ...state.activities.map((a) => a.timestamp),
    ...state.studySessions.map((s) => s.completedAt),
    ...state.quizAttempts.map((q) => q.completedAt),
    ...state.tutorSessions.map((t) => t.updatedAt),
  ];
  const streakDays = computeStreakDays(allTimestamps);

  // Aggregate topic mastery from quizzes, tutor sessions, and mistakes
  const topicMap = new Map<
    string,
    {
      subject: string;
      topic: string;
      quizQuestionsAnswered: number;
      quizCorrect: number;
      tutorInteractions: number;
      unresolvedMistakes: number;
      resolvedMistakes: number;
    }
  >();

  const getOrCreateTopic = (subject: string, topic: string) => {
    const cleanSubject = (subject || 'General').trim();
    const cleanTopic = (topic || 'Core Concepts').trim();
    const key = `${cleanSubject.toLowerCase()}::${cleanTopic.toLowerCase()}`;
    let entry = topicMap.get(key);
    if (!entry) {
      entry = {
        subject: cleanSubject,
        topic: cleanTopic,
        quizQuestionsAnswered: 0,
        quizCorrect: 0,
        tutorInteractions: 0,
        unresolvedMistakes: 0,
        resolvedMistakes: 0,
      };
      topicMap.set(key, entry);
    }
    return entry;
  };

  for (const quiz of state.quizAttempts) {
    const entry = getOrCreateTopic(quiz.subject, quiz.topic);
    entry.quizQuestionsAnswered += quiz.totalQuestions;
    entry.quizCorrect += quiz.correctCount;
  }

  for (const session of state.tutorSessions) {
    const assistantTurns = session.messages.filter((m) => m.role === 'assistant').length;
    if (assistantTurns > 0) {
      const entry = getOrCreateTopic(session.subject, session.topic);
      entry.tutorInteractions += assistantTurns;
    }
  }

  for (const m of state.mistakes) {
    const entry = getOrCreateTopic(m.subject, m.topic);
    if (m.resolved) {
      entry.resolvedMistakes += 1;
    } else {
      entry.unresolvedMistakes += m.occurrences;
    }
  }

  const topicMetrics: TopicMasteryMetric[] = Array.from(topicMap.values()).map((t) => {
    let baseMastery: number;
    if (t.quizQuestionsAnswered > 0) {
      const quizRate = (t.quizCorrect / t.quizQuestionsAnswered) * 100;
      const tutorBoost = Math.min(t.tutorInteractions * 4, 12);
      const mistakePenalty = Math.min(t.unresolvedMistakes * 7, 28);
      const resolvedBoost = Math.min(t.resolvedMistakes * 5, 10);
      baseMastery = Math.round(Math.max(5, Math.min(100, quizRate + tutorBoost + resolvedBoost - mistakePenalty)));
    } else {
      // Only tutor / mistake activity so far — cap mastery conservatively until tested
      const tutorEstimate = Math.min(35 + t.tutorInteractions * 12, 68);
      const mistakePenalty = Math.min(t.unresolvedMistakes * 12, 35);
      baseMastery = Math.round(Math.max(10, Math.min(75, tutorEstimate - mistakePenalty)));
    }

    const evidencePoints = t.quizQuestionsAnswered * 12 + t.tutorInteractions * 10 + t.resolvedMistakes * 8;
    const confidenceScore = Math.round(Math.min(100, Math.max(15, evidencePoints)));

    const status: TopicMasteryMetric['status'] =
      baseMastery >= 78 && t.unresolvedMistakes === 0
        ? 'Mastered'
        : baseMastery >= 55
          ? 'Developing'
          : 'Needs Focus';

    return {
      subject: t.subject,
      topic: t.topic,
      masteryScore: baseMastery,
      confidenceScore,
      quizQuestionsAnswered: t.quizQuestionsAnswered,
      quizCorrect: t.quizCorrect,
      tutorInteractions: t.tutorInteractions,
      unresolvedMistakes: t.unresolvedMistakes,
      status,
    };
  });

  topicMetrics.sort((a, b) => a.masteryScore - b.masteryScore);

  // Subject-level summaries
  const subjectBuckets = new Map<
    string,
    {
      masteryScores: number[];
      quizCorrect: number;
      quizTotal: number;
      sessionsCount: number;
      unresolvedMistakes: number;
      totalMinutes: number;
    }
  >();

  const getSubjectBucket = (subject: string) => {
    const clean = (subject || 'General').trim();
    let bucket = subjectBuckets.get(clean);
    if (!bucket) {
      bucket = {
        masteryScores: [],
        quizCorrect: 0,
        quizTotal: 0,
        sessionsCount: 0,
        unresolvedMistakes: 0,
        totalMinutes: 0,
      };
      subjectBuckets.set(clean, bucket);
    }
    return bucket;
  };

  for (const tm of topicMetrics) {
    const b = getSubjectBucket(tm.subject);
    b.masteryScores.push(tm.masteryScore);
    b.quizCorrect += tm.quizCorrect;
    b.quizTotal += tm.quizQuestionsAnswered;
    b.unresolvedMistakes += tm.unresolvedMistakes;
  }

  for (const s of state.studySessions) {
    const b = getSubjectBucket(s.subject);
    b.sessionsCount += 1;
    b.totalMinutes += s.minutes;
  }

  const subjectSummaries: SubjectSummary[] = Array.from(subjectBuckets.entries()).map(([subject, b]) => {
    const averageMastery =
      b.masteryScores.length > 0
        ? Math.round(b.masteryScores.reduce((acc, v) => acc + v, 0) / b.masteryScores.length)
        : 0;
    const quizAccuracy = b.quizTotal > 0 ? Math.round((b.quizCorrect / b.quizTotal) * 100) : null;
    return {
      subject,
      averageMastery,
      quizAccuracy,
      sessionsCount: b.sessionsCount,
      unresolvedMistakes: b.unresolvedMistakes,
      totalMinutes: b.totalMinutes,
    };
  });

  subjectSummaries.sort((a, b) => b.averageMastery - a.averageMastery);

  const strongSubjects = subjectSummaries.filter((s) => s.averageMastery >= 72);
  const weakSubjects = subjectSummaries.filter((s) => s.averageMastery < 65 || s.unresolvedMistakes > 0);
  const knowledgeGaps = topicMetrics.filter((t) => t.status === 'Needs Focus' || t.unresolvedMistakes > 0);

  // Recurring misconceptions
  const misconceptionMap = new Map<string, { tag: string; subject: string; count: number; resolvedCount: number }>();
  for (const m of state.mistakes) {
    const key = `${m.subject.toLowerCase()}::${m.misconceptionTag.toLowerCase()}`;
    const existing = misconceptionMap.get(key);
    if (existing) {
      existing.count += m.occurrences;
      if (m.resolved) existing.resolvedCount += 1;
    } else {
      misconceptionMap.set(key, {
        tag: m.misconceptionTag,
        subject: m.subject,
        count: m.occurrences,
        resolvedCount: m.resolved ? 1 : 0,
      });
    }
  }
  const recurringMisconceptions = Array.from(misconceptionMap.values()).sort((a, b) => b.count - a.count);

  // Overall metrics
  const overallMastery =
    topicMetrics.length > 0
      ? Math.round(topicMetrics.reduce((sum, t) => sum + t.masteryScore, 0) / topicMetrics.length)
      : 0;
  const overallConfidence =
    topicMetrics.length > 0
      ? Math.round(topicMetrics.reduce((sum, t) => sum + t.confidenceScore, 0) / topicMetrics.length)
      : 0;

  const totalQuizQ = state.quizAttempts.reduce((sum, q) => sum + q.totalQuestions, 0);
  const totalQuizCorrect = state.quizAttempts.reduce((sum, q) => sum + q.correctCount, 0);
  const quizAverage = totalQuizQ > 0 ? Math.round((totalQuizCorrect / totalQuizQ) * 100) : null;

  // Dominant preferred explanation angle from actual clicks
  const angleEntries = Object.entries(state.angleClicks) as [ExplanationAngle, number][];
  const maxAngle = angleEntries.sort((a, b) => b[1] - a[1])[0];
  const dominantAngle = maxAngle && maxAngle[1] > 0 ? maxAngle[0] : null;

  // Adaptive difficulty recommendation based on actual recent quiz performance
  let recommendedDifficulty: LearningLevel = state.profile.learningLevel;
  if (state.quizAttempts.length > 0) {
    const recentQuizzes = state.quizAttempts.slice(0, 3);
    const recentAvg =
      recentQuizzes.reduce((sum, q) => sum + q.scorePercent, 0) / recentQuizzes.length;
    if (recentAvg >= 85) recommendedDifficulty = 'Advanced';
    else if (recentAvg >= 60) recommendedDifficulty = 'Intermediate';
    else recommendedDifficulty = 'Beginner';
  }

  // Personalized Recommendations strictly derived from real state
  const recommendations: AdaptiveRecommendation[] = [];

  const openMistakes = state.mistakes.filter((m) => !m.resolved).sort((a, b) => b.occurrences - a.occurrences);
  if (openMistakes.length > 0) {
    const topMistake = openMistakes[0];
    recommendations.push({
      id: `rec-mistake-${topMistake.id}`,
      priority: 'High',
      actionType: 'mistake-drill',
      title: `Fix misconception: ${topMistake.misconceptionTag}`,
      reason: `Logged ${topMistake.occurrences}x in ${topMistake.subject} (${topMistake.topic}). Run a targeted 3-question revision drill.`,
      subject: topMistake.subject,
      topic: topMistake.topic,
      ctaLabel: 'Start Revision Drill',
    });
  }

  const weakestTopic = knowledgeGaps[0];
  if (weakestTopic) {
    recommendations.push({
      id: `rec-gap-${weakestTopic.subject}-${weakestTopic.topic}`,
      priority: 'High',
      actionType: 'tutor',
      title: `Re-learn ${weakestTopic.topic} via Three-Way Tutor`,
      reason: `Current mastery is ${weakestTopic.masteryScore}% with ${weakestTopic.unresolvedMistakes} open mistake(s).`,
      subject: weakestTopic.subject,
      topic: weakestTopic.topic,
      ctaLabel: 'Open AI Tutor',
    });
  }

  const untestedTopic = topicMetrics.find((t) => t.tutorInteractions > 0 && t.quizQuestionsAnswered === 0);
  if (untestedTopic) {
    recommendations.push({
      id: `rec-test-${untestedTopic.topic}`,
      priority: 'Medium',
      actionType: 'quiz',
      title: `Verify mastery in ${untestedTopic.topic}`,
      reason: `You studied this topic in the AI Tutor (${untestedTopic.tutorInteractions} turn${untestedTopic.tutorInteractions > 1 ? 's' : ''}), but haven't tested recall yet.`,
      subject: untestedTopic.subject,
      topic: untestedTopic.topic,
      ctaLabel: 'Take Adaptive Quiz',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-start-tutor',
      priority: 'Next',
      actionType: 'tutor',
      title: 'Start your first Three-Way concept breakdown',
      reason: 'Ask the AI Tutor about a topic you are preparing for so ARYASH AI can begin calibrating your Learning DNA.',
      subject: 'Mathematics',
      topic: 'Foundations',
      ctaLabel: 'Launch Tutor Studio',
    });
    recommendations.push({
      id: 'rec-start-quiz',
      priority: 'Next',
      actionType: 'quiz',
      title: 'Take a 5-question diagnostic quiz',
      reason: 'Quiz results directly map your strong areas, weak concepts, and adaptive difficulty level.',
      subject: 'Physics',
      topic: 'Core Principles',
      ctaLabel: 'Enter Quiz Arena',
    });
  }

  // Earned Achievements based strictly on real actions
  const resolvedMistakeCount = state.mistakes.filter((m) => m.resolved).length;
  const completedTaskCount = state.tasks.filter((t) => t.completed).length;

  const achievements = [
    {
      id: 'ach-first-lesson',
      title: 'First Concept Unlocked',
      detail: 'Complete your first AI Tutor explanation.',
      unlocked: tutorMessageCount >= 1,
    },
    {
      id: 'ach-quiz-taker',
      title: 'Arena Challenger',
      detail: 'Finish an Adaptive Quiz with instant analysis.',
      unlocked: state.quizAttempts.length >= 1,
    },
    {
      id: 'ach-mistake-slayer',
      title: 'Misconception Cleared',
      detail: 'Resolve at least 1 recorded mistake in the Vault.',
      unlocked: resolvedMistakeCount >= 1,
    },
    {
      id: 'ach-high-scorer',
      title: 'Precision Mastery (80%+)',
      detail: 'Score 80% or higher on any Adaptive Quiz.',
      unlocked: state.quizAttempts.some((q) => q.scorePercent >= 80),
    },
    {
      id: 'ach-planner-pro',
      title: 'Disciplined Planner',
      detail: 'Complete 3 scheduled study tasks.',
      unlocked: completedTaskCount >= 3,
    },
    {
      id: 'ach-streak-3',
      title: '3-Day Momentum',
      detail: 'Maintain a 3-day active study streak.',
      unlocked: streakDays >= 3,
    },
  ];

  return {
    hasSufficientData,
    totalInteractions,
    minimumRequiredInteractions: MIN_REQUIRED_INTERACTIONS,
    overallMastery,
    overallConfidence,
    quizAverage,
    streakDays,
    totalXP,
    levelNumber,
    xpIntoLevel,
    xpForNextLevel: xpPerLevel,
    dominantAngle,
    recommendedDifficulty,
    topicMetrics,
    subjectSummaries,
    strongSubjects,
    weakSubjects,
    knowledgeGaps,
    recurringMisconceptions,
    recommendations,
    achievements,
  };
}

export function getTodayMinutes(state: AryashStoreState): number {
  const today = new Date().toISOString().slice(0, 10);
  return state.studySessions
    .filter((s) => s.completedAt.slice(0, 10) === today)
    .reduce((sum, s) => sum + s.minutes, 0);
}

export function getTodayQuestionsAnswered(state: AryashStoreState): number {
  const today = new Date().toISOString().slice(0, 10);
  return state.quizAttempts
    .filter((q) => q.completedAt.slice(0, 10) === today)
    .reduce((sum, q) => sum + q.totalQuestions, 0);
}

export function getWeeklyActivityChartData(state: AryashStoreState) {
  const days: { date: string; label: string; minutes: number; quizzes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString('en-US', { weekday: 'short' });
    const minutes = state.studySessions
      .filter((s) => s.completedAt.slice(0, 10) === iso)
      .reduce((sum, s) => sum + s.minutes, 0);
    const quizzes = state.quizAttempts.filter((q) => q.completedAt.slice(0, 10) === iso).length;
    days.push({ date: iso, label, minutes, quizzes });
  }
  return days;
}
