
# FOM-Focus-On-Missionimport React, { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Flame, Play, Plus, Save, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const weekDays = [
  { key: 1, label: "Seg" },
  { key: 2, label: "Ter" },
  { key: 3, label: "Qua" },
  { key: 4, label: "Qui" },
  { key: 5, label: "Sex" },
  { key: 6, label: "Sáb" },
  { key: 0, label: "Dom" },
];

const defaultTasks = [
  { id: crypto.randomUUID(), day: 1, time: "07:30", title: "Estudar inglês", points: 20, doneDates: [] },
  { id: crypto.randomUUID(), day: 1, time: "20:00", title: "Revisar projetos", points: 20, doneDates: [] },
  { id: crypto.randomUUID(), day: 2, time: "07:30", title: "Estudar inglês", points: 20, doneDates: [] },
];

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDateOffset(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return todayKey(d);
}

export default function AgendaOfensivaApp() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("agenda-ofensiva-tasks");
    return saved ? JSON.parse(saved) : defaultTasks;
  });
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [newTask, setNewTask] = useState({ time: "08:00", title: "", points: 20 });
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [notification, setNotification] = useState("Sua ofensiva depende da próxima ação. Não quebra a sequência!");

  const today = todayKey();
  const nowDay = new Date().getDay();

  useEffect(() => {
    localStorage.setItem("agenda-ofensiva-tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const dueTask = tasks.find(
        (task) => task.day === now.getDay() && task.time === currentTime && !task.doneDates.includes(todayKey(now))
      );

      if (dueTask) {
        setNotification(`Hora de começar: ${dueTask.title}. Mantém sua ofensiva viva!`);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Agenda Ofensiva", { body: `Hora de começar: ${dueTask.title}` });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [tasks]);

  const selectedTasks = useMemo(
    () => tasks.filter((task) => task.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time)),
    [tasks, selectedDay]
  );

  const todayTasks = useMemo(() => tasks.filter((task) => task.day === nowDay), [tasks, nowDay]);
  const todayDone = todayTasks.filter((task) => task.doneDates.includes(today)).length;
  const todayPercent = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  const weekProgress = weekDays.map((day) => {
    const dayTasks = tasks.filter((task) => task.day === day.key);
    const baseDateOffset = day.key - nowDay;
    const date = formatDateOffset(baseDateOffset);
    const done = dayTasks.filter((task) => task.doneDates.includes(date)).length;
    return { ...day, percent: dayTasks.length ? Math.round((done / dayTasks.length) * 100) : 0 };
  });

  function calculateStreak() {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const date = formatDateOffset(-i);
      const d = new Date(date + "T12:00:00");
      const dayTasks = tasks.filter((task) => task.day === d.getDay());
      if (!dayTasks.length) break;
      const done = dayTasks.every((task) => task.doneDates.includes(date));
      if (done) streak += 1;
      else break;
    }
    return streak;
  }

  const streak = calculateStreak();

  function addTask() {
    if (!newTask.title.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), day: selectedDay, time: newTask.time, title: newTask.title.trim(), points: Number(newTask.points), doneDates: [] },
    ]);
    setNewTask({ time: "08:00", title: "", points: 20 });
  }

  function completeTask(id) {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const alreadyDone = task.doneDates.includes(today);
        return { ...task, doneDates: alreadyDone ? task.doneDates.filter((d) => d !== today) : [...task.doneDates, today] };
      })
    );
    setActiveTaskId(null);
  }

  function deleteTask(id) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-emerald-300 font-medium">Agenda Ofensiva</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Seu dia em modo missão</h1>
          </div>
          <div className="bg-orange-500/15 border border-orange-400/30 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-xl">
            <Flame className="text-orange-300" />
            <div>
              <p className="text-sm text-orange-100">Ofensiva atual</p>
              <p className="text-2xl font-bold">{streak} dias 100%</p>
            </div>
          </div>
        </header>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white/10 rounded-3xl p-6 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-slate-300">Progresso de hoje</p>
                <h2 className="text-4xl font-bold">{todayPercent}% concluído</h2>
              </div>
              <CheckCircle2 className="text-emerald-300" size={42} />
            </div>
            <div className="h-5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div className="h-full bg-emerald-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${todayPercent}%` }} />
            </div>
            <p className="text-slate-300 mt-3">{todayDone} de {todayTasks.length} atividades concluídas hoje.</p>
          </div>

          <div className="bg-amber-400 text-slate-950 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 font-bold mb-2"><Bell /> Aviso de ofensiva</div>
            <p className="text-lg leading-snug">{notification}</p>
          </div>
        </motion.section>

        <section className="bg-white/10 rounded-3xl p-6 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="text-sky-300" />
            <h2 className="text-2xl font-bold">Timeline da semana</h2>
          </div>
          <div className="relative grid grid-cols-7 gap-2">
            <div className="absolute top-7 left-8 right-8 h-1 bg-slate-700 rounded-full" />
            {weekProgress.map((day) => (
              <button key={day.key} onClick={() => setSelectedDay(day.key)} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-14 h-14 rounded-full grid place-items-center border-4 transition ${day.percent === 100 ? "bg-emerald-400 border-emerald-200 text-slate-950" : selectedDay === day.key ? "bg-sky-400 border-sky-200 text-slate-950" : "bg-slate-800 border-slate-600"}`}>
                  <span className="font-bold">{day.percent}%</span>
                </div>
                <span className="text-sm text-slate-300">{day.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 bg-white/10 rounded-3xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Agenda de {weekDays.find((d) => d.key === selectedDay)?.label}</h2>
            <div className="space-y-3">
              {selectedTasks.map((task) => {
                const done = task.doneDates.includes(today);
                return (
                  <div key={task.id} className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${done ? "bg-emerald-400/20 border border-emerald-300/40" : "bg-slate-900 border border-white/10"}`}>
                    <div>
                      <p className="text-sm text-slate-300">{task.time} • {task.points} pts</p>
                      <p className="text-lg font-semibold">{task.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setActiveTaskId(task.id)} className="p-3 rounded-xl bg-sky-500 hover:bg-sky-400"><Play size={18} /></button>
                      <button onClick={() => completeTask(task.id)} className="p-3 rounded-xl bg-emerald-500 hover:bg-emerald-400"><CheckCircle2 size={18} /></button>
                      <button onClick={() => deleteTask(task.id)} className="p-3 rounded-xl bg-rose-500 hover:bg-rose-400"><Trash2 size={18} /></button>
                    </div>
                  </div>
                );
              })}
              {!selectedTasks.length && <p className="text-slate-300">Nenhuma atividade cadastrada neste dia.</p>}
            </div>
          </div>

          <div className="bg-white/10 rounded-3xl p-6 border border-white/10">
            <h2 className="text-2xl font-bold mb-4">Nova atividade</h2>
            <div className="space-y-3">
              <input type="time" value={newTask.time} onChange={(e) => setNewTask({ ...newTask, time: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-white/10 p-3" />
              <input placeholder="Ex: estudar inglês" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-white/10 p-3" />
              <input type="number" value={newTask.points} onChange={(e) => setNewTask({ ...newTask, points: e.target.value })} className="w-full rounded-xl bg-slate-900 border border-white/10 p-3" />
              <button onClick={addTask} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-3 flex items-center justify-center gap-2"><Plus size={18} /> Adicionar</button>
            </div>
          </div>
        </section>

        {activeTaskId && (
          <div className="fixed inset-0 bg-black/70 grid place-items-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <Flame className="mx-auto text-orange-300 mb-3" size={54} />
              <h2 className="text-3xl font-bold mb-2">Missão iniciada</h2>
              <p className="text-slate-300 mb-6">Finalize a atividade para somar no percentual do dia e manter a ofensiva.</p>
              <button onClick={() => completeTask(activeTaskId)} className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 flex items-center justify-center gap-2"><Save size={18} /> Concluir missão</button>
              <button onClick={() => setActiveTaskId(null)} className="mt-3 text-slate-300">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
