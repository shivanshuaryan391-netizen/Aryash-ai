import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearStoreState,
  createEmptyState,
  createSampleDemoState,
  loadStoreState,
  saveStoreState,
} from '../storage/localStore';
import type {
  AryashStoreState,
  ExamCountdown,
  ExplanationAngle,
  HabitItem,
  LearningActivityEvent,
  MistakeRecord,
  QuizAttempt,
  SavedExplanation,
  StudentProfile,
  StudySessionLog,
  StudyTask,
  TutorSession,
} from '../types';
import { computeLearningDNA } from '../utils/intelligence';

export function useLearningStore() {
  const [state, setState] = useState<AryashStoreState>(() => loadStoreState());

  useEffect(() => {
    saveStoreState(state);
  }, [state]);

  const dna = useMemo(() => computeLearningDNA(state), [state]);

  const updateProfile = useCallback((patch: Partial<StudentProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  }, []);

  const loadDemoData = useCallback(() => {
    setState(createSampleDemoState());
  }, []);

  const resetToFreshWorkspace = useCallback(() => {
    clearStoreState();
    setState(createEmptyState());
  }, []);

  const logActivity = useCallback((event: Omit<LearningActivityEvent, 'id' | 'timestamp'>) => {
    const full: LearningActivityEvent = {
      ...event,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      activities: [full, ...prev.activities].slice(0, 100),
    }));
  }, []);

  const logStudySession = useCallback((session: Omit<StudySessionLog, 'id' | 'completedAt'>) => {
    const entry: StudySessionLog = {
      ...session,
      id: `sess-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      completedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      studySessions: [entry, ...prev.studySessions].slice(0, 200),
    }));
  }, []);

  const upsertTutorSession = useCallback((session: TutorSession) => {
    setState((prev) => {
      const exists = prev.tutorSessions.some((s) => s.id === session.id);
      const nextSessions = exists
        ? prev.tutorSessions.map((s) => (s.id === session.id ? session : s))
        : [session, ...prev.tutorSessions];
      return {
        ...prev,
        tutorSessions: nextSessions.slice(0, 40),
      };
    });
  }, []);

  const deleteTutorSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      tutorSessions: prev.tutorSessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const recordAngleClick = useCallback((angle: ExplanationAngle) => {
    setState((prev) => ({
      ...prev,
      angleClicks: {
        ...prev.angleClicks,
        [angle]: (prev.angleClicks[angle] || 0) + 1,
      },
    }));
  }, []);

  const saveExplanation = useCallback((item: Omit<SavedExplanation, 'id' | 'savedAt'>) => {
    const saved: SavedExplanation = {
      ...item,
      id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      savedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      savedExplanations: [saved, ...prev.savedExplanations].slice(0, 100),
    }));
  }, []);

  const deleteSavedExplanation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savedExplanations: prev.savedExplanations.filter((s) => s.id !== id),
    }));
  }, []);

  const addQuizAttempt = useCallback((attempt: QuizAttempt) => {
    setState((prev) => {
      const newMistakes: MistakeRecord[] = [...prev.mistakes];
      const now = new Date().toISOString();

      for (const ans of attempt.answers) {
        if (!ans.isCorrect) {
          const existingIdx = newMistakes.findIndex(
            (m) =>
              m.subject.toLowerCase() === attempt.subject.toLowerCase() &&
              m.question.trim().toLowerCase() === ans.question.trim().toLowerCase()
          );
          if (existingIdx >= 0) {
            const existing = newMistakes[existingIdx];
            newMistakes[existingIdx] = {
              ...existing,
              occurrences: existing.occurrences + 1,
              resolved: false,
              lastReviewedAt: now,
            };
          } else {
            newMistakes.unshift({
              id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              subject: attempt.subject,
              topic: ans.subtopic || attempt.topic,
              question: ans.question,
              wrongAnswer: ans.options[ans.selectedIndex] ?? 'Unanswered',
              correctAnswer: ans.options[ans.correctIndex] ?? '',
              whyWrong: ans.explanation,
              misconceptionTag: ans.misconceptionNote || `${attempt.topic} concept gap`,
              occurrences: 1,
              resolved: false,
              createdAt: now,
              source: 'quiz',
            });
          }
        }
      }

      const xpEarned = Math.max(25, attempt.correctCount * 20 + 20);
      const activity: LearningActivityEvent = {
        id: `act-${Date.now()}-quiz`,
        type: 'quiz',
        title: `Completed ${attempt.title}`,
        subject: attempt.subject,
        detail: `Scored ${attempt.correctCount}/${attempt.totalQuestions} (${attempt.scorePercent}%) at ${attempt.difficulty} level`,
        xpEarned,
        timestamp: now,
      };

      const studySession: StudySessionLog = {
        id: `sess-${Date.now()}-quiz`,
        subject: attempt.subject,
        topic: attempt.topic,
        minutes: Math.max(5, Math.round(attempt.durationSeconds / 60)),
        source: 'quiz',
        completedAt: now,
      };

      return {
        ...prev,
        quizAttempts: [attempt, ...prev.quizAttempts].slice(0, 60),
        mistakes: newMistakes.slice(0, 150),
        activities: [activity, ...prev.activities].slice(0, 100),
        studySessions: [studySession, ...prev.studySessions].slice(0, 200),
      };
    });
  }, []);

  const addManualMistake = useCallback((mistake: Omit<MistakeRecord, 'id' | 'createdAt' | 'occurrences' | 'resolved'>) => {
    const now = new Date().toISOString();
    const record: MistakeRecord = {
      ...mistake,
      id: `mistake-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      occurrences: 1,
      resolved: false,
      createdAt: now,
    };
    setState((prev) => ({
      ...prev,
      mistakes: [record, ...prev.mistakes],
    }));
  }, []);

  const toggleMistakeResolved = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((prev) => {
      let newlyResolved: MistakeRecord | null = null;
      const updated = prev.mistakes.map((m) => {
        if (m.id !== id) return m;
        const nextResolved = !m.resolved;
        if (nextResolved) newlyResolved = m;
        return {
          ...m,
          resolved: nextResolved,
          resolvedAt: nextResolved ? now : undefined,
          lastReviewedAt: now,
        };
      });

      const nextActivities = newlyResolved
        ? [
            {
              id: `act-${Date.now()}-mistake`,
              type: 'mistake-resolved' as const,
              title: `Resolved mistake in ${(newlyResolved as MistakeRecord).topic}`,
              subject: (newlyResolved as MistakeRecord).subject,
              detail: (newlyResolved as MistakeRecord).misconceptionTag,
              xpEarned: 60,
              timestamp: now,
            },
            ...prev.activities,
          ].slice(0, 100)
        : prev.activities;

      return {
        ...prev,
        mistakes: updated,
        activities: nextActivities,
      };
    });
  }, []);

  const deleteMistake = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      mistakes: prev.mistakes.filter((m) => m.id !== id),
    }));
  }, []);

  const addTask = useCallback((task: Omit<StudyTask, 'id' | 'createdAt' | 'completed'>) => {
    const item: StudyTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      tasks: [item, ...prev.tasks],
    }));
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<StudyTask>) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }));
  }, []);

  const toggleTaskComplete = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((prev) => {
      let completedTask: StudyTask | null = null;
      const tasks = prev.tasks.map((t) => {
        if (t.id !== id) return t;
        const next = !t.completed;
        if (next) completedTask = t;
        return { ...t, completed: next, completedAt: next ? now : undefined };
      });
      const activities = completedTask
        ? [
            {
              id: `act-${Date.now()}-task`,
              type: 'task-completed' as const,
              title: `Completed: ${(completedTask as StudyTask).title}`,
              subject: (completedTask as StudyTask).subject,
              detail: `${(completedTask as StudyTask).durationMinutes} min study block`,
              xpEarned: 35,
              timestamp: now,
            },
            ...prev.activities,
          ].slice(0, 100)
        : prev.activities;
      const studySessions = completedTask
        ? [
            {
              id: `sess-${Date.now()}-task`,
              subject: (completedTask as StudyTask).subject,
              topic: (completedTask as StudyTask).topic || (completedTask as StudyTask).title,
              minutes: (completedTask as StudyTask).durationMinutes,
              source: 'planner' as const,
              completedAt: now,
            },
            ...prev.studySessions,
          ].slice(0, 200)
        : prev.studySessions;
      return { ...prev, tasks, activities, studySessions };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const addExam = useCallback((exam: Omit<ExamCountdown, 'id'>) => {
    setState((prev) => ({
      ...prev,
      exams: [
        ...prev.exams,
        { ...exam, id: `exam-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` },
      ].sort((a, b) => a.examDate.localeCompare(b.examDate)),
    }));
  }, []);

  const deleteExam = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      exams: prev.exams.filter((e) => e.id !== id),
    }));
  }, []);

  const toggleHabitDate = useCallback((habitId: string, dateStr: string) => {
    setState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        return {
          ...h,
          completedDates: exists
            ? h.completedDates.filter((d) => d !== dateStr)
            : [...h.completedDates, dateStr],
        };
      }),
    }));
  }, []);

  const addHabit = useCallback((name: string, targetDaysPerWeek: number) => {
    const habit: HabitItem = {
      id: `habit-${Date.now()}`,
      name,
      targetDaysPerWeek,
      completedDates: [],
    };
    setState((prev) => ({ ...prev, habits: [...prev.habits, habit] }));
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setState((prev) => ({ ...prev, habits: prev.habits.filter((h) => h.id !== id) }));
  }, []);

  const toggleFavoriteTool = useCallback((toolId: string) => {
    setState((prev) => {
      const exists = prev.favoriteTools.includes(toolId);
      return {
        ...prev,
        favoriteTools: exists
          ? prev.favoriteTools.filter((id) => id !== toolId)
          : [toolId, ...prev.favoriteTools],
      };
    });
  }, []);

  const recordToolUsed = useCallback((toolId: string) => {
    const now = new Date().toISOString();
    setState((prev) => {
      const filtered = prev.recentTools.filter((r) => r.toolId !== toolId);
      return {
        ...prev,
        recentTools: [{ toolId, usedAt: now }, ...filtered].slice(0, 12),
      };
    });
  }, []);

  return {
    state,
    dna,
    updateProfile,
    loadDemoData,
    resetToFreshWorkspace,
    logActivity,
    logStudySession,
    upsertTutorSession,
    deleteTutorSession,
    recordAngleClick,
    saveExplanation,
    deleteSavedExplanation,
    addQuizAttempt,
    addManualMistake,
    toggleMistakeResolved,
    deleteMistake,
    addTask,
    updateTask,
    toggleTaskComplete,
    deleteTask,
    addExam,
    deleteExam,
    toggleHabitDate,
    addHabit,
    deleteHabit,
    toggleFavoriteTool,
    recordToolUsed,
  };
}

export type LearningStoreApi = ReturnType<typeof useLearningStore>;
