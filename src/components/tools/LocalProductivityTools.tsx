import { useEffect, useRef, useState } from 'react';
import { Check, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import type { LearningStoreApi } from '../../hooks/useLearningStore';

// TOOL 32: POMODORO STUDY TIMER (Works 100% offline, logs real sessions)
export function PomodoroTimerTool({ store }: { store: LearningStoreApi }) {
  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [phase, setPhase] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('Deep Focus Block');
  const [completedCycles, setCompletedCycles] = useState(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (phase === 'focus') {
            setCompletedCycles((c) => c + 1);
            store.logStudySession({
              subject: subject.trim() || 'General',
              topic: topic.trim() || 'Pomodoro Focus Session',
              minutes: focusMins,
              source: 'pomodoro',
            });
            store.logActivity({
              type: 'pomodoro',
              title: `Completed ${focusMins}-min Focus Cycle`,
              subject: subject.trim() || 'General',
              detail: topic.trim() || 'Pomodoro Timer',
              xpEarned: Math.max(20, Math.round(focusMins * 1.2)),
            });
            setPhase('break');
            return breakMins * 60;
          } else {
            setPhase('focus');
            return focusMins * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, phase, focusMins, breakMins, subject, topic, store]);

  const applyPreset = (f: number, b: number) => {
    setRunning(false);
    setFocusMins(f);
    setBreakMins(b);
    setPhase('focus');
    setSecondsLeft(f * 60);
  };

  const resetTimer = () => {
    setRunning(false);
    setSecondsLeft((phase === 'focus' ? focusMins : breakMins) * 60);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const totalSec = (phase === 'focus' ? focusMins : breakMins) * 60;
  const progressPct = Math.round(((totalSec - secondsLeft) / Math.max(1, totalSec)) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl aryash-surface-solid p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-[#080B18] border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setPhase('focus');
              setSecondsLeft(focusMins * 60);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              phase === 'focus' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Focus Session
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setPhase('break');
              setSecondsLeft(breakMins * 60);
            }}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
              phase === 'break' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Short Break
          </button>
        </div>

        <div className="font-mono text-6xl sm:text-7xl font-semibold tracking-tight tabular-nums text-white">
          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
        </div>

        <div className="w-full max-w-sm h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              phase === 'focus' ? 'bg-gradient-to-r from-indigo-500 to-blue-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="aryash-primary-btn px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer"
          >
            {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {running ? 'Pause' : 'Start Timer'}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sm text-slate-200 inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Completed cycles this sitting: <span className="font-mono text-slate-100 tabular-nums">{completedCycles}</span> · Every completed focus block automatically logs study minutes to Progress Analytics.
        </p>
      </div>

      <div className="lg:col-span-5 rounded-2xl aryash-surface-solid p-6 space-y-5">
        <h3 className="font-display text-base font-semibold text-white">Session Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Current Study Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-slate-400">Quick Interval Presets</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: '25 / 5', f: 25, b: 5 },
              { label: '50 / 10', f: 50, b: 10 },
              { label: '15 / 3', f: 15, b: 3 },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p.f, p.b)}
                className={`py-2 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                  focusMins === p.f
                    ? 'border-indigo-500 bg-indigo-500/15 text-white'
                    : 'border-slate-800 bg-[#080B18] text-slate-300 hover:border-slate-700'
                }`}
              >
                {p.label} min
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            store.logStudySession({
              subject: subject.trim() || 'General',
              topic: topic.trim() || 'Logged Study Sprint',
              minutes: focusMins,
              source: 'pomodoro',
            });
            setCompletedCycles((c) => c + 1);
          }}
          className="w-full py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800/70 text-xs font-medium text-slate-200 cursor-pointer"
        >
          Log Manual {focusMins}-Min Session Now
        </button>
      </div>
    </div>
  );
}

// TOOL 33: DAILY TASK MANAGER (Synced with Study Planner)
export function DailyTaskManagerTool({ store }: { store: LearningStoreApi }) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [minutes, setMinutes] = useState('30');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'short' }) as
      | 'Mon'
      | 'Tue'
      | 'Wed'
      | 'Thu'
      | 'Fri'
      | 'Sat'
      | 'Sun';
    store.addTask({
      title: title.trim(),
      subject: subject.trim() || 'General',
      topic: title.trim(),
      dayOfWeek: todayName,
      dueDate: new Date().toISOString().slice(0, 10),
      durationMinutes: Math.max(5, Number(minutes) || 30),
      priority,
    });
    setTitle('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-2xl aryash-surface-solid p-5 grid grid-cols-1 md:grid-cols-12 gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a focused study task (e.g., Solve 12 integration exercises)..."
          className="md:col-span-5 px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="md:col-span-2 px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <input
          type="number"
          min={5}
          max={240}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="md:col-span-1 px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white tabular-nums focus:outline-none focus:border-indigo-500"
          title="Minutes"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
          className="md:col-span-2 px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <button
          type="submit"
          className="md:col-span-2 aryash-primary-btn px-4 py-2.5 rounded-lg text-sm font-semibold text-white inline-flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </form>

      <div className="rounded-2xl aryash-surface-solid divide-y divide-slate-800/70">
        {store.state.tasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">
            No study tasks yet. Add your first task above—tasks stay synchronized with your Smart Study Planner.
          </div>
        ) : (
          store.state.tasks.map((task) => (
            <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-900/40">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => store.toggleTaskComplete(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                      : 'border-slate-600 hover:border-indigo-400'
                  }`}
                  aria-label="Toggle task complete"
                >
                  {task.completed && <Check className="w-3.5 h-3.5" />}
                </button>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {task.subject} · <span className="font-mono tabular-nums">{task.durationMinutes} min</span> · {task.priority} priority
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => store.deleteTask(task.id)}
                className="p-2 text-slate-500 hover:text-rose-400 cursor-pointer"
                aria-label="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// TOOL 34: STUDY HABIT TRACKER (7-day interactive grid)
export function StudyHabitTrackerTool({ store }: { store: LearningStoreApi }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('5');

  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return {
      iso: d.toISOString().slice(0, 10),
      dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
    };
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    store.addHabit(name.trim(), Math.max(1, Math.min(7, Number(target) || 5)));
    setName('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="rounded-2xl aryash-surface-solid p-5 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New daily study habit (e.g., 20 mins spaced flashcards before sleep)..."
          className="flex-1 px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {[3, 4, 5, 6, 7].map((n) => (
            <option key={n} value={n}>
              Target: {n} days/wk
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="aryash-primary-btn px-4 py-2.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap cursor-pointer"
        >
          Add Habit
        </button>
      </form>

      <div className="rounded-2xl aryash-surface-solid overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-400">
              <th className="py-3.5 px-5 font-medium">Habit</th>
              {last7Days.map((d) => (
                <th key={d.iso} className="py-3.5 px-2 text-center font-medium">
                  <div>{d.dayLabel}</div>
                  <div className="font-mono text-[11px] text-slate-500">{d.dateNum}</div>
                </th>
              ))}
              <th className="py-3.5 px-4 text-right font-medium">Weekly Goal</th>
              <th className="py-3.5 px-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {store.state.habits.map((habit) => {
              const weekCount = last7Days.filter((d) => habit.completedDates.includes(d.iso)).length;
              return (
                <tr key={habit.id} className="hover:bg-slate-900/40">
                  <td className="py-3.5 px-5 text-sm font-medium text-slate-100">{habit.name}</td>
                  {last7Days.map((d) => {
                    const done = habit.completedDates.includes(d.iso);
                    return (
                      <td key={d.iso} className="py-3 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => store.toggleHabitDate(habit.id, d.iso)}
                          className={`w-8 h-8 rounded-lg border inline-flex items-center justify-center transition-colors cursor-pointer ${
                            done
                              ? 'bg-indigo-600 border-indigo-400 text-white'
                              : 'bg-[#080B18] border-slate-800 text-slate-600 hover:border-slate-600'
                          }`}
                          aria-label={`Toggle ${habit.name} for ${d.iso}`}
                        >
                          {done && <Check className="w-4 h-4" />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-3.5 px-4 text-right font-mono text-xs tabular-nums text-slate-300">
                    {weekCount}/{habit.targetDaysPerWeek}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => store.deleteHabit(habit.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                      aria-label="Delete habit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// TOOL 35: ATTENDANCE CALCULATOR (Zero-API mathematical precision)
export function AttendanceCalculatorTool() {
  const [attended, setAttended] = useState('34');
  const [total, setTotal] = useState('42');
  const [targetPct, setTargetPct] = useState('75');

  const a = Math.max(0, Number(attended) || 0);
  const t = Math.max(0, Number(total) || 0);
  const target = Math.max(1, Math.min(100, Number(targetPct) || 75));

  const valid = t > 0 && a <= t;
  const currentPct = valid ? (a / t) * 100 : 0;

  let classesNeeded = 0;
  let classesCanBunk = 0;

  if (valid) {
    if (currentPct < target) {
      // (a + x) / (t + x) >= target/100 => x >= (target*t - 100*a) / (100 - target)
      if (target >= 100) {
        classesNeeded = Infinity;
      } else {
        classesNeeded = Math.ceil((target * t - 100 * a) / (100 - target));
      }
    } else {
      // a / (t + y) >= target/100 => y <= (100*a / target) - t
      classesCanBunk = Math.max(0, Math.floor((100 * a) / target - t));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl aryash-surface-solid p-6 space-y-4">
        <h3 className="font-display text-base font-semibold text-white">Enter Attendance Numbers</h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Classes Attended</label>
          <input
            type="number"
            min={0}
            value={attended}
            onChange={(e) => setAttended(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Total Classes Conducted</label>
          <input
            type="number"
            min={0}
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5">Minimum Required Attendance (%)</label>
          <input
            type="number"
            min={1}
            max={100}
            value={targetPct}
            onChange={(e) => setTargetPct(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        {!valid && (
          <p className="text-xs text-rose-400">
            Attended classes cannot exceed total classes conducted, and total must be greater than 0.
          </p>
        )}
      </div>

      <div className="lg:col-span-7 rounded-2xl aryash-surface-solid p-6 flex flex-col justify-between space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#080B18] border border-slate-800">
            <p className="text-xs text-slate-400">Current Attendance</p>
            <p
              className={`mt-1 font-mono text-4xl font-semibold tabular-nums ${
                !valid ? 'text-slate-500' : currentPct >= target ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {valid ? `${currentPct.toFixed(2)}%` : '--'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {valid ? (currentPct >= target ? 'Safe — Meets requirement' : 'Below minimum threshold') : 'Enter valid values'}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#080B18] border border-slate-800">
            <p className="text-xs text-slate-400">
              {currentPct >= target ? 'Safe Skip Margin' : 'Consecutive Classes Needed'}
            </p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums text-indigo-300">
              {!valid
                ? '--'
                : currentPct >= target
                  ? classesCanBunk
                  : Number.isFinite(classesNeeded)
                    ? classesNeeded
                    : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {!valid
                ? ''
                : currentPct >= target
                  ? `You can miss up to ${classesCanBunk} upcoming class(es) and stay ≥ ${target}%.`
                  : `Attend the next ${classesNeeded} consecutive class(es) to reach ${target}%.`}
            </p>
          </div>
        </div>

        {valid && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>0%</span>
              <span>Target: {target}%</span>
              <span>100%</span>
            </div>
            <div className="relative h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full ${currentPct >= target ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, currentPct)}%` }}
              />
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{ left: `${target}%` }}
                title={`Target ${target}%`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// TOOL 36: CGPA & PERCENTAGE CALCULATOR
interface CourseRow {
  id: string;
  name: string;
  credits: string;
  gradePoint: string;
}

export function CgpaCalculatorTool() {
  const [courses, setCourses] = useState<CourseRow[]>([
    { id: 'c1', name: 'Data Structures', credits: '4', gradePoint: '9' },
    { id: 'c2', name: 'Linear Algebra', credits: '4', gradePoint: '8.5' },
    { id: 'c3', name: 'Operating Systems', credits: '3', gradePoint: '9.5' },
    { id: 'c4', name: 'Engineering Physics', credits: '3', gradePoint: '8' },
  ]);
  const [multiplier, setMultiplier] = useState('9.5');

  const updateRow = (id: string, field: keyof CourseRow, value: string) => {
    setCourses((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const addRow = () => {
    setCourses((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: `Course ${prev.length + 1}`, credits: '3', gradePoint: '8' },
    ]);
  };

  const removeRow = (id: string) => {
    setCourses((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const { totalCredits, cgpa10 } = courses.reduce(
    (acc, r) => {
      const cr = Math.max(0, Number(r.credits) || 0);
      const gp = Math.max(0, Math.min(10, Number(r.gradePoint) || 0));
      return {
        totalCredits: acc.totalCredits + cr,
        weighted: acc.weighted + cr * gp,
        cgpa10: 0,
      };
    },
    { totalCredits: 0, weighted: 0, cgpa10: 0 }
  );

  const weightedSum = courses.reduce((sum, r) => {
    const cr = Math.max(0, Number(r.credits) || 0);
    const gp = Math.max(0, Math.min(10, Number(r.gradePoint) || 0));
    return sum + cr * gp;
  }, 0);

  const computedCgpa = totalCredits > 0 ? weightedSum / totalCredits : 0;
  const mult = Math.max(5, Math.min(10, Number(multiplier) || 9.5));
  const equivalentPct = Math.min(100, computedCgpa * mult);
  const gpa4 = Math.min(4, (computedCgpa / 10) * 4);
  void cgpa10;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Weighted CGPA (10-pt)</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-white">{computedCgpa.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Total Credits: {totalCredits}</p>
        </div>
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">Equivalent Percentage</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-indigo-300">
            {equivalentPct.toFixed(2)}%
          </p>
          <p className="mt-1 text-xs text-slate-400">Formula: CGPA × {mult}</p>
        </div>
        <div className="rounded-2xl aryash-surface-solid p-5">
          <p className="text-xs text-slate-400">4.0 Scale Approximation</p>
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-blue-300">{gpa4.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-400">Direct proportional scale</p>
        </div>
      </div>

      <div className="rounded-2xl aryash-surface-solid p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-white">Courses & Credit Weights</h3>
          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 flex items-center gap-2">
              Conversion Factor:
              <select
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white"
              >
                <option value="9.5">9.5 (CBSE / Standard)</option>
                <option value="10">10.0 (Direct Scale)</option>
                <option value="8.9">8.9 (Anna / Regional)</option>
              </select>
            </label>
            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Course
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {courses.map((row) => (
            <div key={row.id} className="grid grid-cols-12 gap-2.5 items-center">
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                placeholder="Course name"
                className="col-span-6 sm:col-span-6 px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={row.credits}
                onChange={(e) => updateRow(row.id, 'credits', e.target.value)}
                placeholder="Credits"
                className="col-span-2 px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
                title="Credits"
              />
              <input
                type="number"
                min={0}
                max={10}
                step={0.1}
                value={row.gradePoint}
                onChange={(e) => updateRow(row.id, 'gradePoint', e.target.value)}
                placeholder="Grade (0-10)"
                className="col-span-3 px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
                title="Grade Point (0-10)"
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="col-span-1 p-2 text-slate-500 hover:text-rose-400 cursor-pointer justify-self-end"
                aria-label="Remove course"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
