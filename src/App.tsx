import { useCallback, useState } from 'react';
import { AppShell } from './components/AppShell';
import { useLearningStore } from './hooks/useLearningStore';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LearningDNAPage } from './pages/LearningDNAPage';
import { MistakeVaultPage } from './pages/MistakeVaultPage';
import { QuizArenaPage } from './pages/QuizArenaPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { ToolsHubPage } from './pages/ToolsHubPage';
import { TutorStudioPage } from './pages/TutorStudioPage';
import type { AppRoute } from './types';

interface NavContext {
  toolId?: string;
  subject?: string;
  topic?: string;
}

export default function App() {
  const store = useLearningStore();
  const [route, setRoute] = useState<AppRoute>('landing');
  const [navContext, setNavContext] = useState<NavContext>({});

  const handleNavigate = useCallback((nextRoute: AppRoute, context?: NavContext) => {
    setNavContext(context ?? {});
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (route === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <AppShell activeRoute={route} onNavigate={handleNavigate} store={store}>
      {route === 'dashboard' && <DashboardPage store={store} onNavigate={handleNavigate} />}
      {route === 'tutor' && (
        <TutorStudioPage
          store={store}
          initialSubject={navContext.subject}
          initialTopic={navContext.topic}
        />
      )}
      {route === 'learning-dna' && <LearningDNAPage store={store} onNavigate={handleNavigate} />}
      {route === 'quiz' && (
        <QuizArenaPage
          store={store}
          onNavigate={handleNavigate}
          initialSubject={navContext.subject}
          initialTopic={navContext.topic}
        />
      )}
      {route === 'mistakes' && <MistakeVaultPage store={store} />}
      {route === 'planner' && <StudyPlannerPage store={store} />}
      {route === 'analytics' && <AnalyticsPage store={store} />}
      {route === 'tools' && <ToolsHubPage store={store} initialToolId={navContext.toolId} />}
    </AppShell>
  );
}
