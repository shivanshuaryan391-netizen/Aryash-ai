import { useState } from 'react';
import { CalendarDays, Check, Clock, Edit3, Plus, ShieldAlert, Trash2, X } from 'lucide-react';
import type { LearningStoreApi } from '../hooks/useLearningStore';
import type { StudyTask } from '../types';

interface StudyPlannerPageProps {
  store: LearningStoreApi;
}

const WEEK_DAYS: StudyTask['dayOfWeek'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function StudyPlannerPage({ store }: StudyPlannerPageProps) {
  const [selectedDay, setSelectedDay] = useState<StudyTask['dayOfWeek'] | 'All'>('All');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Task form
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<StudyTask['dayOfWeek']>('Thu');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [priority, setPriority] = useState<StudyTask['priority']>('High');

  // Exam countdown form
  const [examName, setExamName] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('90%+');

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingId) {
      store.updateTask(editingId, {
        title: title.trim(),
        subject: subject.trim() || 'General',
        topic: topic.trim() || title.trim(),
        dayOfWeek,
        dueDate,
        durationMinutes: Math.max(10, Number(durationMinutes) || 30),
        priority,
      });
      setEditingId(null);
    } else {
      store.addTask({
        title: title.trim(),
        subject: subject.trim() || 'General',
        topic: topic.trim() || title.trim(),
        dayOfWeek,
        dueDate,
        durationMinutes: Math.max(10, Number(durationMinutes) || 30),
        priority,
      });
    }

    setTitle('');
    setTopic('');
  };

  const startEditTask = (task: StudyTask) => {
    setEditingId(task.id);
    setTitle(task.title);
    setSubject(task.subject);
    setTopic(task.topic);
    setDayOfWeek(task.dayOfWeek);
    setDueDate(task.dueDate);
    setDurationMinutes(String(task.durationMinutes));
    setPriority(task.priority);
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim() || !examDate) return;
    store.addExam({
      name: examName.trim(),
      subject: examSubject.trim() || 'All Subjects',
      examDate,
      targetScore: targetScore.trim() || '90%+',
    });
    setExamName('');
    setExamSubject('');
    setExamDate('');
  };

  const visibleTasks =
    selectedDay === 'All'
      ? store.state.tasks
      : store.state.tasks.filter((t) => t.dayOfWeek === selectedDay);

  const completedTasks = store.state.tasks.filter((t) => t.completed).length;
  const totalScheduledMinutes = store.state.tasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + t.durationMinutes, 0);

  const openMistakes = store.state.mistakes.filter((m) => !m.resolved).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-indigo-300">
            Smart Study Planner · {completedTasks}/{store.state.tasks.length} Tasks Completed ·{' '}
            <span className="font-mono tabular-nums">{totalScheduledMinutes} min</span> remaining
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Weekly Study Schedule & Exam Countdowns
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 columns: Task Creator + Weekly Planner */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={handleSaveTask} className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-white">
                {editingId ? 'Edit Study Task' : 'Create Study Task'}
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setTopic('');
                  }}
                  className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" /> Cancel Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title (e.g. Practice 15 Thermodynamics problems)"
                required
                className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="px-3.5 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as StudyTask['dayOfWeek'])}
                className="px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                min={10}
                max={300}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="Minutes"
                className="px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs font-mono tabular-nums text-white focus:outline-none focus:border-indigo-500"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as StudyTask['priority'])}
                className="px-3 py-2.5 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="aryash-primary-btn px-5 py-2.5 rounded-xl text-xs font-semibold text-white inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {editingId ? 'Save Changes' : 'Add to Weekly Plan'}
              </button>
            </div>
          </form>

          {/* Day Filter Tabs */}
          <div className="rounded-2xl aryash-surface-solid p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-indigo-400" />
                Weekly Schedule
              </h3>
              <div className="flex flex-wrap gap-1 p-1 rounded-lg bg-[#080B18] border border-slate-800">
                {(['All', ...WEEK_DAYS] as const).map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      selectedDay === day ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {visibleTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No tasks scheduled for {selectedDay === 'All' ? 'this week yet' : selectedDay}. Add a task above or convert a Mistake Vault reminder on the right.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {visibleTasks.map((task) => (
                  <div key={task.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => store.toggleTaskComplete(task.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                            : 'border-slate-600 hover:border-indigo-400'
                        }`}
                        aria-label="Toggle task complete"
                      >
                        {task.completed && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : 'text-white'}`}>
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {task.subject} · {task.dayOfWeek} ({task.dueDate}) ·{' '}
                          <span className="font-mono tabular-nums">{task.durationMinutes} min</span> ·{' '}
                          <span
                            className={
                              task.priority === 'High'
                                ? 'text-amber-300'
                                : task.priority === 'Medium'
                                  ? 'text-blue-300'
                                  : 'text-slate-400'
                            }
                          >
                            {task.priority}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEditTask(task)}
                        className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                        aria-label="Edit task"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => store.deleteTask(task.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        aria-label="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 4 columns: Exam Countdown + Revision Reminders + Study Session History */}
        <div className="lg:col-span-4 space-y-6">
          {/* Exam Countdowns */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-4">
            <h3 className="font-display text-base font-semibold text-white">Exam Countdowns</h3>
            <form onSubmit={handleAddExam} className="space-y-2.5">
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Exam name (e.g. Mid-Sem Physics)"
                required
                className="w-full px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  placeholder="Subject"
                  className="px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="Target (e.g. 90%+)"
                  className="px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 rounded-lg bg-[#080B18] border border-slate-800 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white cursor-pointer"
                >
                  Add
                </button>
              </div>
            </form>

            {store.state.exams.length === 0 ? (
              <p className="text-xs text-slate-500">No exams tracked yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/70 pt-2">
                {store.state.exams.map((exam) => {
                  const daysLeft = Math.ceil(
                    (new Date(exam.examDate).getTime() - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={exam.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{exam.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {exam.subject} · {exam.examDate} · Target {exam.targetScore}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono text-xs font-semibold tabular-nums ${daysLeft <= 7 ? 'text-amber-300' : 'text-indigo-300'}`}>
                          {daysLeft >= 0 ? `${daysLeft}d` : 'Done'}
                        </span>
                        <button
                          type="button"
                          onClick={() => store.deleteExam(exam.id)}
                          className="text-slate-500 hover:text-rose-400 cursor-pointer"
                          aria-label="Delete exam"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Smart Revision Reminders from Mistake Vault */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Revision Reminders
            </h3>
            {openMistakes.length === 0 ? (
              <p className="text-xs text-slate-400">
                No pending mistake revisions. Open mistakes from your Mistake Vault automatically surface here.
              </p>
            ) : (
              <div className="space-y-2.5">
                {openMistakes.map((m) => (
                  <div key={m.id} className="rounded-xl bg-[#080B18] border border-slate-800 p-3 space-y-2">
                    <p className="text-xs font-medium text-white">{m.misconceptionTag}</p>
                    <p className="text-[11px] text-slate-400">
                      {m.subject} · {m.topic}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        store.addTask({
                          title: `Revise: ${m.misconceptionTag}`,
                          subject: m.subject,
                          topic: m.topic,
                          dayOfWeek,
                          dueDate: new Date().toISOString().slice(0, 10),
                          durationMinutes: 25,
                          priority: 'High',
                        })
                      }
                      className="text-[11px] font-medium text-indigo-300 hover:text-white underline cursor-pointer"
                    >
                      + Schedule 25-min Revision Block
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Study Session History */}
          <section className="rounded-2xl aryash-surface-solid p-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              Recent Study Sessions
            </h3>
            {store.state.studySessions.length === 0 ? (
              <p className="text-xs text-slate-400">Completed Pomodoro cycles, quizzes, and tutor blocks appear here.</p>
            ) : (
              <div className="divide-y divide-slate-800/70">
                {store.state.studySessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="text-slate-100 font-medium truncate">{s.topic}</p>
                      <p className="text-[11px] text-slate-500">
                        {s.subject} · {s.source}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-indigo-300 shrink-0">{s.minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
