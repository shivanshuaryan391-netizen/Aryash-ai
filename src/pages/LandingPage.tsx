import { useState } from 'react';
import { ArrowRight, BookOpenCheck, Brain, ChevronDown, Dna, ShieldAlert, Wrench } from 'lucide-react';
import { MEDIA_ASSETS } from '../assets/media';
import { BrandMark } from '../components/BrandMark';
import { TOOL_CATEGORIES, TOOLS_CATALOG } from '../data/toolsCatalog';
import type { AppRoute, ExplanationAngle } from '../types';

interface LandingPageProps {
  onNavigate: (route: AppRoute, context?: { toolId?: string; subject?: string; topic?: string }) => void;
}

const DEMO_CONCEPTS: Record<
  string,
  {
    subject: string;
    topic: string;
    angles: Record<ExplanationAngle, { label: string; text: string }>;
  }
> = {
  eigenvalues: {
    subject: 'Linear Algebra',
    topic: 'Eigenvalues & Eigenvectors',
    angles: {
      simple: {
        label: 'Simple Mode',
        text: 'When you stretch or shear a grid, almost every arrow rotates to a new direction. Eigenvectors are the rare special arrows that stay pointing along their original line—they only grow or shrink. The stretch factor is the eigenvalue.',
      },
      realLife: {
        label: 'Real-Life Mode',
        text: 'Bridges vibrate at specific natural frequencies; principal component analysis (PCA) compresses high-resolution satellite photos by keeping only the strongest eigenvectors of pixel variance. Finding them reveals the true structural spine of any system.',
      },
      technical: {
        label: 'Technical Mode',
        text: 'For linear operator A ∈ R^(n×n), non-zero vector v satisfies Av = λv iff (A − λI)v = 0. Non-trivial nullspace solutions exist precisely when the characteristic polynomial vanishes: det(A − λI) = 0.',
      },
      stepByStep: {
        label: 'Step-by-Step Mode',
        text: '1) Subtract λ along the main diagonal to build A − λI. 2) Set det(A − λI) = 0 and solve for roots λ. 3) Plug each λ back into (A − λI)v = 0 to solve for eigenvector basis v.',
      },
    },
  },
  thermodynamics: {
    subject: 'Physics',
    topic: 'Adiabatic vs Isothermal Processes',
    angles: {
      simple: {
        label: 'Simple Mode',
        text: 'Isothermal means temperature stays steady while heat slowly enters or leaves. Adiabatic means the process happens so fast or inside such good insulation that zero heat enters or leaves—so compressing the gas heats it up directly.',
      },
      realLife: {
        label: 'Real-Life Mode',
        text: 'Pump a bicycle tire rapidly and the nozzle turns warm—that is near-adiabatic compression turning mechanical work straight into internal energy. Slowly melting ice in a bath stays at 0°C—an isothermal exchange.',
      },
      technical: {
        label: 'Technical Mode',
        text: 'Isothermal ideal gas follows PV = constant with ΔU = 0 ⇒ Q = W. Reversible adiabatic follows PV^γ = constant with Q = 0 ⇒ ΔU = −W, giving a steeper P–V slope −γ(P/V) because γ = Cp/Cv > 1.',
      },
      stepByStep: {
        label: 'Step-by-Step Mode',
        text: '1) Write First Law: ΔU = Q − W. 2) Check thermal boundary: constant T gives ΔU = 0; insulated gives Q = 0. 3) Compare P–V slopes: adiabatic is γ times steeper than isothermal at the same (P, V).',
      },
    },
  },
  recursion: {
    subject: 'Computer Science',
    topic: 'Dynamic Programming & Memoization',
    angles: {
      simple: {
        label: 'Simple Mode',
        text: 'Plain recursion solves the exact same small puzzle over and over again. Dynamic programming writes each solved sub-answer in a notebook so you never waste effort solving it twice.',
      },
      realLife: {
        label: 'Real-Life Mode',
        text: 'GPS route planning avoids recalculating the fastest route from an intermediate highway junction to your destination every time it tests a new starting street—it caches the shortest remaining distance once.',
      },
      technical: {
        label: 'Technical Mode',
        text: 'Applicable when a problem exhibits Optimal Substructure and Overlapping Subproblems. Memoization (top-down cache) or tabulation (bottom-up DAG order) reduces exponential O(2^n) recursion trees to polynomial O(n·k) state transitions.',
      },
      stepByStep: {
        label: 'Step-by-Step Mode',
        text: '1) Define state dp[i]. 2) Write recurrence relation linking dp[i] to smaller states. 3) Establish base cases. 4) Store computed states in a table or dictionary to guarantee each state runs once.',
      },
    },
  },
};

const FAQS = [
  {
    q: 'How is ARYASH AI different from a generic AI chatbot?',
    a: 'Generic chatbots forget your weak areas the moment you close a tab. ARYASH AI combines a Three-Way Explanation Engine with a Learning DNA profile, an Adaptive Quiz Arena, and a Mistake Memory Vault that remembers recurring misconceptions and recommends targeted revision.',
  },
  {
    q: 'Do I need a paid account or credit card to start learning?',
    a: 'No. Your study profile, Learning DNA, mistakes, tasks, exam countdowns, and analytics run completely free using private local browser storage, with zero mandatory account creation.',
  },
  {
    q: 'Does ARYASH AI invent fake mastery scores before I study?',
    a: 'Never. Your Learning DNA and Progress Analytics calculate mastery strictly from your recorded quizzes, tutor sessions, and mistakes—and explicitly tell you when there is insufficient data yet.',
  },
  {
    q: 'Which tools work even without an internet AI call?',
    a: 'The Pomodoro Study Timer, Daily Task Manager, Study Habit Tracker, Attendance Calculator, and CGPA & Percentage Calculator run instantaneously in your browser with zero external API calls.',
  },
];

const SAMPLE_TESTIMONIALS = [
  {
    name: 'Priya Nair',
    role: 'B.Tech Computer Science, 3rd Year',
    org: 'Sample Student Profile',
    avatar: MEDIA_ASSETS.avatarPriya,
    quote:
      'Switching from plain answers to Real-Life + Step-by-Step mode finally made Dynamic Programming click. Logging my recurring recurrence mistakes cut repeat errors in half before mid-sems.',
  },
  {
    name: 'Rohan Deshmukh',
    role: 'Mechanical Engineering & GATE Aspirant',
    org: 'Sample Student Profile',
    avatar: MEDIA_ASSETS.avatarRohan,
    quote:
      'Having the Mistake Memory Vault pull every wrong Thermodynamics MCQ into one place saved hours of aimless re-reading. I now revise only what I actually get wrong.',
  },
  {
    name: 'Ananya Verma',
    role: 'Class 12 Science · Pre-Med Track',
    org: 'Sample Student Profile',
    avatar: MEDIA_ASSETS.avatarAnanya,
    quote:
      'Hinglish explanations in the AI Tutor paired with instant Flashcards and the Attendance Calculator made ARYASH AI my daily study desk from morning revision to night mock tests.',
  },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [selectedConcept, setSelectedConcept] = useState<'eigenvalues' | 'thermodynamics' | 'recursion'>('eigenvalues');
  const [selectedAngle, setSelectedAngle] = useState<ExplanationAngle>('simple');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [dnaImgFailed, setDnaImgFailed] = useState(false);

  const activeDemo = DEMO_CONCEPTS[selectedConcept];

  return (
    <div className="min-h-screen bg-[#080B18] text-slate-100">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 h-16 bg-[#080B18]/85 backdrop-blur-md border-b border-slate-800/70">
        <div className="max-w-[1280px] mx-auto h-full px-5 sm:px-8 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight text-white whitespace-nowrap shrink-0"
          >
            <BrandMark size={28} />
            <span>ARYASH AI</span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              How It Works
            </a>
            <a href="#learning-dna" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Learning DNA
            </a>
            <a href="#toolkit" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              36 Tools
            </a>
            <a href="#faq" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              FAQ
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="aryash-primary-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Learning Free
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-slate-800/60">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[960px] h-[420px] rounded-full bg-indigo-600/15 blur-[130px]"
          />

          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Left Proposition */}
              <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
                <p className="text-sm font-medium text-indigo-300">
                  Adaptive AI Learning Intelligence · Learn Your Way. Master Your Future.
                </p>
                <h1 className="font-display font-bold tracking-tight text-white leading-[1.08] text-[clamp(2.25rem,4.1vw,3.75rem)]">
                  Your AI. Your Learning Style.{' '}
                  <span className="aryash-gradient-text">Your Future.</span>
                </h1>
                <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                  ARYASH AI maps how you understand concepts, remembers every recurring exam mistake, and adapts every explanation and practice test to close your exact knowledge gaps.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('dashboard')}
                    className="aryash-primary-btn px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    Start Learning Free
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('tutor')}
                    className="px-5 py-3 rounded-xl border border-slate-700/90 bg-[#0D1226] hover:bg-slate-800/80 text-sm font-medium text-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open AI Tutor Studio
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Zero mandatory sign-up · Free local persistence · English, Hindi & Hinglish tutoring
                </p>
              </div>

              {/* Right Focal Visual */}
              <div className="lg:col-span-6">
                <div className="relative h-full min-h-[300px] rounded-2xl overflow-hidden border border-slate-800/90 bg-[#0D1226]">
                  {!heroImgFailed ? (
                    <img
                      src={MEDIA_ASSETS.heroArchitecture}
                      alt="ARYASH AI adaptive cognitive knowledge lattice and prism architecture"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-[#0D1226] to-blue-950 flex items-center justify-center p-8">
                      <BrandMark size={64} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#080B18] via-[#080B18]/25 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-indigo-300 font-medium">Core Intelligence Architecture</p>
                      <p className="font-display text-lg font-semibold text-white">
                        Learning DNA · Three-Way Tutor · Mistake Vault
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate('learning-dna')}
                      className="px-3.5 py-2 rounded-lg bg-[#080B18]/85 border border-slate-700 text-xs font-medium text-slate-100 hover:border-indigo-400 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Inspect Learning DNA
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Three-Way AI Tutor Demonstration */}
            <div className="rounded-2xl aryash-surface-solid p-6 sm:p-8 space-y-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div>
                  <p className="text-xs font-medium text-indigo-300">Interactive Product Demonstration</p>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
                    Experience the Three-Way Explanation Engine
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#080B18] border border-slate-800">
                  {(
                    [
                      { id: 'eigenvalues', label: 'Eigenvalues' },
                      { id: 'thermodynamics', label: 'Thermodynamics' },
                      { id: 'recursion', label: 'Dynamic Programming' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedConcept(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        selectedConcept === item.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-4 space-y-2">
                  {(
                    [
                      { id: 'simple', num: '01', name: 'Simple Mode', desc: 'Zero-jargon intuition for first-time clarity' },
                      { id: 'realLife', num: '02', name: 'Real-Life Mode', desc: 'Everyday analogies and applied examples' },
                      { id: 'technical', num: '03', name: 'Technical Mode', desc: 'Formal academic definitions and notation' },
                      { id: 'stepByStep', num: '04', name: 'Step-by-Step Mode', desc: 'Sequential problem-solving derivation' },
                    ] as const
                  ).map((angle) => {
                    const active = selectedAngle === angle.id;
                    return (
                      <button
                        key={angle.id}
                        type="button"
                        onClick={() => setSelectedAngle(angle.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                          active
                            ? 'bg-indigo-500/12 border-indigo-400/40 text-white'
                            : 'bg-[#080B18] border-slate-800/80 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-sm font-semibold">
                            {angle.num}. {angle.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{angle.desc}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-8 rounded-xl bg-[#080B18] border border-slate-800/90 p-6 flex flex-col justify-between min-h-[268px] space-y-6">
                  <div className="space-y-3">
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="text-indigo-300 font-medium">{activeDemo.subject}</span>
                      <span>·</span>
                      <span>{activeDemo.topic}</span>
                      <span>·</span>
                      <span>{activeDemo.angles[selectedAngle].label}</span>
                    </div>
                    <p className="text-base text-slate-100 leading-8">{activeDemo.angles[selectedAngle].text}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800/70">
                    <span className="text-xs text-slate-400">
                      Try any concept in English, Hindi, or Hinglish—or upload a textbook PDF.
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('tutor', { subject: activeDemo.subject, topic: activeDemo.topic })
                      }
                      className="text-xs font-semibold text-indigo-300 hover:text-indigo-200 inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      Ask Live AI Tutor about {activeDemo.topic}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW ARYASH AI WORKS — Editorial Asymmetric Architecture */}
        <section id="how-it-works" className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20 space-y-12">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-medium text-indigo-300">How ARYASH AI Works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              A closed-loop intelligence cycle built around how memory actually strengthens.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Instead of disconnected chat threads, every lesson, quiz, and mistake feeds one unified model of your understanding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 rounded-2xl aryash-surface-solid p-7 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-300">01</span>
                <Brain className="w-5 h-5 text-indigo-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-white">Understand from Four Angles</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Every concept in AI Tutor Studio decomposes into Simple intuition, Real-Life analogy, Technical academic notation, and Step-by-Step derivation—with PDF & handwritten note image support.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tutor')}
                className="self-start text-xs font-semibold text-indigo-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                Explore Tutor Studio <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="md:col-span-5 rounded-2xl aryash-surface-solid p-7 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-blue-300">02</span>
                <BookOpenCheck className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-white">Calibrate via Adaptive Quizzes</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Difficulty adjusts automatically from your real quiz accuracy across conceptual, MCQ, and application questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('quiz')}
                className="self-start text-xs font-semibold text-blue-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                Enter Quiz Arena <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="md:col-span-5 rounded-2xl aryash-surface-solid p-7 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-amber-300">03</span>
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-white">Capture Every Misconception</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Incorrect answers automatically enter your Mistake Memory Vault with root-cause diagnostics and AI-generated 3-question cure drills.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('mistakes')}
                className="self-start text-xs font-semibold text-amber-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                Open Mistake Vault <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="md:col-span-7 rounded-2xl aryash-surface-solid p-7 flex flex-col justify-between space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-300">04</span>
                <Dna className="w-5 h-5 text-violet-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-xl font-bold text-white">Adapt Your Daily Study Plan</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Your Learning DNA synthesizes strong subjects, weak subtopics, and upcoming exam countdowns to surface the exact revision task with the highest exam-score leverage today.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('planner')}
                className="self-start text-xs font-semibold text-violet-300 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                View Smart Study Planner <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* LEARNING DNA ENGINE SPOTLIGHT */}
        <section id="learning-dna" className="border-y border-slate-800/70 bg-[#0A0E20]/70">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 rounded-2xl overflow-hidden border border-slate-800 bg-[#080B18] min-h-[300px]">
              {!dnaImgFailed ? (
                <img
                  src={MEDIA_ASSETS.learningDnaHelix}
                  alt="Learning DNA crystalline knowledge graph visualization"
                  referrerPolicy="no-referrer"
                  onError={() => setDnaImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-indigo-400">
                  <Dna className="w-16 h-16" />
                </div>
              )}
            </div>

            <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
              <p className="text-xs font-medium text-indigo-300">Signature Differentiator · Learning DNA Engine</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                Honest cognitive profiling built strictly from your real study data.
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                ARYASH AI never fabricates flattering progress bars. As you study, take quizzes, and resolve mistakes, the Learning DNA Engine continuously maps:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                {[
                  { title: 'Mastery vs. Confidence', desc: 'Distinguishes topics you read once from topics proven under timed exam recall.' },
                  { title: 'Knowledge Gap Detection', desc: 'Flags specific subtopics dragging down your overall subject accuracy.' },
                  { title: 'Explanation Style Affinity', desc: 'Tracks whether Simple, Real-Life, Technical, or Step-by-Step unlocks clarity fastest.' },
                  { title: 'Recurring Misconceptions', desc: 'Clusters repeat errors so you fix the underlying mental model once and for all.' },
                ].map((item) => (
                  <div key={item.title} className="space-y-1">
                    <h3 className="font-display text-sm font-semibold text-white">{item.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('learning-dna')}
                  className="aryash-primary-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
                >
                  Open Learning DNA Engine
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 36 STUDENT PRODUCTIVITY TOOLS PREVIEW */}
        <section id="toolkit" className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-indigo-300">Daily Academic Operating System</p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
                36 Essential Student Productivity Tools in One Hub.
              </h2>
              <p className="text-sm sm:text-base text-slate-400">
                From PDF Chat, OCR handwritten note scanning, and step-by-step STEM solvers to zero-API Pomodoro, Attendance, and CGPA calculators.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tools')}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-[#0D1226] hover:bg-slate-800 text-xs sm:text-sm font-medium text-white inline-flex items-center gap-2 self-start cursor-pointer whitespace-nowrap"
            >
              <Wrench className="w-4 h-4 text-indigo-400" />
              Browse All 36 Tools
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOL_CATEGORIES.map((cat) => {
              const toolsInCat = TOOLS_CATALOG.filter((t) => t.category === cat.id);
              return (
                <div key={cat.id} className="rounded-2xl aryash-surface-solid p-6 flex flex-col justify-between space-y-5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-medium text-indigo-300">{cat.label}</span>
                      <span className="font-mono tabular-nums">{toolsInCat.length} tools</span>
                    </div>
                    <p className="text-xs text-slate-400">{cat.description}</p>
                  </div>
                  <ul className="space-y-1.5 border-t border-slate-800/70 pt-4">
                    {toolsInCat.slice(0, 5).map((tool) => (
                      <li key={tool.id}>
                        <button
                          type="button"
                          onClick={() => onNavigate('tools', { toolId: tool.id })}
                          className="w-full text-left text-xs text-slate-300 hover:text-white flex items-center justify-between py-1 transition-colors cursor-pointer"
                        >
                          <span className="truncate">
                            {String(tool.number).padStart(2, '0')}. {tool.name}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>

        {/* SAMPLE TESTIMONIALS (EXPLICITLY LABELED AS SAMPLE CONTENT) */}
        <section className="border-y border-slate-800/70 bg-[#0A0E20]/60">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-20 space-y-10">
            <div className="space-y-2 max-w-2xl">
              <p className="text-xs font-medium text-amber-300">
                Sample Student Stories · Illustrative Sample Content
              </p>
              <h2 className="font-display text-3xl font-bold text-white">
                How students use ARYASH AI across engineering, boards, and competitive exams.
              </h2>
              <p className="text-xs text-slate-400">
                Note: The student quotes below are illustrative sample content demonstrating real study workflows inside ARYASH AI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SAMPLE_TESTIMONIALS.map((item) => (
                <article key={item.name} className="rounded-2xl aryash-surface-solid p-6 flex flex-col justify-between space-y-6">
                  <p className="text-sm text-slate-200 leading-relaxed">“{item.quote}”</p>
                  <div className="flex items-center gap-3.5 pt-4 border-t border-slate-800/70">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {item.role} · {item.org}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="max-w-[920px] mx-auto px-5 sm:px-8 py-20 space-y-8">
          <div className="space-y-2 text-center">
            <p className="text-xs font-medium text-indigo-300">Frequently Asked Questions</p>
            <h2 className="font-display text-3xl font-bold text-white">Clear answers before you begin.</h2>
          </div>

          <div className="divide-y divide-slate-800/80 border-y border-slate-800/80">
            {FAQS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={item.q} className="py-4">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left py-1 cursor-pointer"
                  >
                    <span className="font-display text-base font-semibold text-white">{item.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-300' : ''
                      }`}
                    />
                  </button>
                  {isOpen && <p className="text-sm text-slate-300 leading-relaxed pt-3 pr-8">{item.a}</p>}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl aryash-surface-solid p-8 text-center space-y-4">
            <h3 className="font-display text-2xl font-bold text-white">Ready to study with precision?</h3>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Launch your personal Student Dashboard, ask your first Three-Way question, or jump straight into any of the 36 tools.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="aryash-primary-btn px-6 py-3 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
            >
              Start Learning Free
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#060914]">
        <div className="max-w-[1280px] mx-auto px-5 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-12 gap-8 text-sm">
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5 font-display font-bold text-white">
              <BrandMark size={24} />
              <span>ARYASH AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Adaptive AI Learning Intelligence Platform. Learn Your Way. Master Your Future.
            </p>
            <p className="text-xs text-slate-500">Contact: support@aryash-ai.edu · Local-first privacy architecture</p>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <p className="text-xs font-semibold text-slate-200">Core Workspace</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button type="button" onClick={() => onNavigate('dashboard')} className="hover:text-white cursor-pointer">
                  Student Dashboard
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('tutor')} className="hover:text-white cursor-pointer">
                  AI Tutor Studio
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('learning-dna')} className="hover:text-white cursor-pointer">
                  Learning DNA Engine
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('quiz')} className="hover:text-white cursor-pointer">
                  Adaptive Quiz Arena
                </button>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <p className="text-xs font-semibold text-slate-200">Intelligence & Productivity</p>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button type="button" onClick={() => onNavigate('mistakes')} className="hover:text-white cursor-pointer">
                  Mistake Memory Vault
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('planner')} className="hover:text-white cursor-pointer">
                  Smart Study Planner
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('analytics')} className="hover:text-white cursor-pointer">
                  Progress Analytics
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onNavigate('tools')} className="hover:text-white cursor-pointer">
                  36-Tool Student Productivity Hub
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800/60 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} ARYASH AI. Built for adaptive student mastery.
        </div>
      </footer>
    </div>
  );
}
