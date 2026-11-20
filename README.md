# ARYASH AI

**Learn Your Way. Master Your Future.**

ARYASH AI is an **Adaptive AI Learning Intelligence Platform** built for students preparing for university coursework, board exams, and competitive entrance tests. Instead of acting like a stateless chatbot, ARYASH AI models how a student learns, tracks recurring misconceptions, calibrates quiz difficulty, and unifies 36 daily academic productivity tools in one workspace.

---

## Core Architecture & Features

### 1. Complete 8-Page Learning Ecosystem
1. **Landing Page** — Interactive Three-Way Explanation preview, Learning DNA overview, 36-tool hub showcase, clearly labeled sample testimonials, and FAQ.
2. **Student Dashboard** — Daily study goals, streak counter, XP & earned achievements, topic mastery bars, weak areas, adaptive recommendations, today's study plan, exam countdowns, and quick tool access. Starts honestly at zero with an optional, clearly labeled sample dataset loader.
3. **AI Tutor Studio (Three-Way Explanation Engine)** — Every concept generates four structured angles:
   - **Simple Mode** (beginner intuition)
   - **Real-Life Mode** (practical analogies and applications)
   - **Technical Mode** (academic terminology and formal notation)
   - **Step-by-Step Mode** (guided sequential breakdown)
   - Supports **English, Hindi, and Hinglish**, PDF & image uploads, saved explanations, conversation history, copy, regenerate, and follow-up suggestions.
4. **Learning DNA Engine** — Tracks understood topics, knowledge gaps, recurring misconceptions, confidence vs. mastery estimates, dominant explanation mode, and recommended difficulty. Explicitly reports *Insufficient Data* when fewer than 3 interactions exist.
5. **Adaptive Quiz Arena** — AI-generated MCQs, conceptual questions, and application problems calibrated to stored performance, with instant rationales, automatic Mistake Memory Vault capture, and downloadable Markdown score reports.
6. **Mistake Memory Vault** — Automatically captures wrong quiz answers and supports manual mistake logging, misconception clustering, AI-generated 3-question targeted cure drills, and mastery resolution tracking.
7. **Smart Study Planner** — Weekly Mon–Sun study scheduler with task create/edit/delete, exam countdowns, Mistake Vault revision reminders, and logged session history.
8. **Progress Analytics** — Interactive charts for weekly study time, quiz improvement trends, topic mastery, and subject-wise performance with transparent separation between real student data and sample demo data.

### 2. Student Productivity Toolkit (36 Working Tools)
- **Study & Notes (1–8):** AI Notes Generator, PDF Summarizer, PDF Chat, OCR Notes Scanner, Chapter Summarizer, Important Questions Generator, Interactive Flashcard Generator, Visual Mind Map Generator.
- **Exam Preparation (9–15):** MCQ Generator, Mock Test Generator, Previous Year Question Practice, Answer Writing Evaluator, Formula Sheet Generator, Last-Minute Revision Generator, Exam Preparation Planner.
- **Mathematics & Science (16–20):** AI Maths Solver, Physics Problem Solver, Chemistry Problem Solver, Numerical Problem Solver, Equation Explainer.
- **Writing & Communication (21–25):** AI Assignment Writer, Grammar Checker, Essay & Paragraph Writer, Presentation/PPT Outline Generator, Email Writer.
- **Coding & Computer Science (26–30):** AI Code Explainer, Code Debugger, Programming Practice Generator, Python & C Tutor, SQL Query Helper.
- **Personal Productivity (31–36):** Smart Timetable Generator, Pomodoro Study Timer (offline), Daily Task Manager (offline), Study Habit Tracker (offline), Attendance Calculator (offline), CGPA & Percentage Calculator (offline).

---

## Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Recharts, React Markdown (`remark-gfm`)
- **Backend:** Node.js + Express (`server.ts`) mounting Vite middleware in development and static builds in production
- **AI Engine:** `@google/genai` SDK (server-side only, configurable model defaulting to free-tier eligible `gemini-4-hydrogen`)
- **Persistence:** Free-tier browser `localStorage` repository architecture (no Cloud SQL, no billing required, Supabase-ready)

---

## Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your Gemini API key:
```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="your_actual_gemini_api_key"
GEMINI_MODEL="gemini-4-hydrogen"
APP_URL="http://localhost:3000"
```

> **Security Note:** `.env` is excluded via `.gitignore`. `GEMINI_API_KEY` is read exclusively by `server.ts` and is never bundled into frontend assets. If `GEMINI_API_KEY` is omitted, the app remains usable with clear configuration notices while all local calculators, timers, planners, and trackers work offline.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

### 4. Type Check & Production Build
```bash
npm run lint
npm run build
npm start
```

---

## Project Folder Structure

```text
├── server.ts                         # Express server + secure /api/ai/* Gemini routes
├── index.html                        # Fonts & SEO metadata
├── .env.example                      # Safe environment variable template
└── src/
    ├── App.tsx                       # Application routing shell
    ├── index.css                     # Design system tokens & dark-navy surfaces
    ├── assets/                       # Generated visuals & media registry
    ├── components/                   # AppShell, BrandMark, MarkdownRenderer, ToolWorkspace
    ├── data/                         # Complete 36-tool Student Productivity catalog
    ├── hooks/                        # useLearningStore reactive state hook
    ├── pages/                        # All 8 pages (Landing, Dashboard, Tutor, DNA, Quiz, Vault, Planner, Analytics, Tools)
    ├── services/                     # Frontend API client for /api/ai/*
    ├── storage/                      # LocalStorage persistence & opt-in sample dataset
    ├── types/                        # Domain TypeScript interfaces
    └── utils/                        # Adaptive Learning Engine & Learning DNA math
```

---

## Future Supabase Free-Tier Integration Guide

ARYASH AI isolates all persistence in `src/storage/localStore.ts` and `src/hooks/useLearningStore.ts` so upgrading to cloud sync requires zero UI rewrites:

1. Create a free Supabase project and add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`.
2. Create a `student_workspaces` table (`user_id uuid primary key`, `payload jsonb`, `updated_at timestamptz`) with Row Level Security (`auth.uid() = user_id`).
3. Swap `loadStoreState()` and `saveStoreState()` in `src/storage/localStore.ts` to hydrate from and debounce-upsert to `supabase.from('student_workspaces')` while keeping `localStorage` as an instant offline cache.
