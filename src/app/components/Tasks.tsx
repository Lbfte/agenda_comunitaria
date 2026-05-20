import { useState, useMemo } from "react";
import { PageHeader } from "./PageHeader";
import { ChevronDown, Triangle, Check, Trash2, Plus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { TaskCreateModal, type TaskFormData } from "./TaskCreateModal";

const weekDays = (() => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      day: d.getDate(),
      label: labels[i],
      date: d.toISOString().split("T")[0],
      isToday: d.toDateString() === today.toDateString(),
    };
  });
})();

export function Tasks() {
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  const { tasks, loading, isOnline, pendingCount, createTask, completeTask, deleteTask } =
    useTasks(tab);

  // Agrupar tarefas por período
  const grouped = useMemo(() => {
    const dayTasks = tasks.filter((t) => t.due_date === selectedDate && !t.completed);
    return {
      manha: dayTasks.filter((t) => t.period === "manha"),
      tarde: dayTasks.filter((t) => t.period === "tarde"),
      noite: dayTasks.filter((t) => t.period === "noite"),
      semPeriodo: dayTasks.filter((t) => !t.period),
    };
  }, [tasks, selectedDate]);

  const handleCreate = async (form: TaskFormData) => {
    await createTask({
      title: form.title,
      description: form.description || undefined,
      due_date: form.due_date || undefined,
      due_time: form.due_time || undefined,
      period: (form.period as 'manha' | 'tarde' | 'noite') || undefined,
      shape: form.shape,
      shape_color: form.shape_color,
    });
    setShowCreateModal(false);
  };

  const TaskItem = ({ task }: { task: typeof tasks[0] }) => {
    const highlighted = task.shape === "invTriangle" || task.shape_color === "#7A8F6B";
    return (
      <div
        className="flex items-center gap-3 h-[48px] rounded-[8px] px-4 mb-2 transition-all group"
        style={{
          background: highlighted
            ? "rgba(122,143,107,0.25)"
            : "rgba(42,42,42,0.6)",
          border: highlighted ? "1px solid rgba(122,143,107,0.3)" : "none",
        }}
      >
        <div className="shrink-0">
          {task.shape === "invTriangle" ? (
            <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
              <path d="M7 12L0 0H14L7 12Z" fill={task.shape_color} />
            </svg>
          ) : (
            <Triangle size={12} fill={task.shape_color} color={task.shape_color} />
          )}
        </div>
        <span className={`flex-1 text-[14px] ${highlighted ? "text-white" : "text-[rgba(255,255,255,0.5)]"}`}>
          {task.title}
        </span>
        <SyncStatusBadge isOnline={isOnline} pendingCount={0} syncStatus={task.sync_status} />
        <span className="text-[12px] text-[rgba(255,255,255,0.4)] shrink-0">
          {task.due_time || ""}
        </span>
        {/* Actions — visible on hover */}
        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          <button
            onClick={() => completeTask(task.id)}
            className="w-[28px] h-[28px] rounded-lg flex items-center justify-center bg-[rgba(122,143,107,0.2)] hover:bg-[rgba(122,143,107,0.4)] transition-colors"
          >
            <Check size={14} className="text-[#7A8F6B]" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            className="w-[28px] h-[28px] rounded-lg flex items-center justify-center bg-[rgba(232,93,93,0.1)] hover:bg-[rgba(232,93,93,0.3)] transition-colors"
          >
            <Trash2 size={14} className="text-[#E85D5D]" />
          </button>
        </div>
      </div>
    );
  };

  const renderSection = (title: string, items: typeof tasks) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] text-white">{title}</h3>
          <span className="text-[12px] text-[#555]">{items.length} tarefa{items.length > 1 ? "s" : ""}</span>
        </div>
        {items.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} />

      {/* Greeting + Sync Status */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] lg:text-[20px] text-white">Olá, {firstName}!</h2>
            <p className="text-[14px] text-[#707070]">
              você está em "Listas: Ciencias da Comp"
            </p>
          </div>
          <SyncStatusBadge isOnline={isOnline} pendingCount={pendingCount} />
        </div>
      </div>

      {/* Desktop: week selector + tasks side by side */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-6 lg:px-7">
        {/* Week Selector */}
        <div className="px-7 lg:px-0 mb-6">
          <div className="flex lg:flex-col items-center lg:items-stretch gap-1">
            {weekDays.map((wd) => {
              const sel = wd.date === selectedDate;
              return (
                <button
                  key={wd.date}
                  onClick={() => setSelectedDate(wd.date)}
                  className="flex-1 lg:flex-none flex flex-col lg:flex-row items-center lg:gap-3 py-2 lg:py-3 lg:px-4 rounded-lg transition-all"
                  style={sel ? { background: "rgba(122,143,107,0.1)" } : undefined}
                >
                  <span className="text-[16px] text-[rgba(255,255,255,0.6)]">{wd.day}</span>
                  <span className={`text-[13px] ${sel ? "text-white" : "text-[rgba(255,255,255,0.35)]"}`}>
                    {wd.label}
                  </span>
                  <div
                    className="w-[20px] lg:w-[30px] h-[3px] rounded-full mt-1 lg:mt-0 lg:ml-auto"
                    style={{ background: sel ? "#7A8F6B" : wd.isToday ? "#424C3B" : "#444" }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Tasks Lists */}
        <div className="px-7 lg:px-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#333] border-t-[#7A8F6B] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {renderSection("Manhã", grouped.manha)}
              {renderSection("Tarde", grouped.tarde)}
              {renderSection("Noite", grouped.noite)}
              {renderSection("Sem período", grouped.semPeriodo)}

              {grouped.manha.length === 0 &&
                grouped.tarde.length === 0 &&
                grouped.noite.length === 0 &&
                grouped.semPeriodo.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-[14px] text-[#555] mb-4">
                      Nenhuma tarefa para este dia
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="h-[36px] px-5 rounded-2xl bg-[#7A8F6B] text-[13px] text-white active:scale-95 transition-transform"
                    >
                      Criar primeira tarefa
                    </button>
                  </div>
                )}
            </>
          )}

          {/* FAB — Create Task */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="fixed bottom-28 md:bottom-8 right-6 lg:right-auto lg:relative lg:bottom-auto lg:mt-4 w-[52px] h-[52px] lg:w-full lg:h-[44px] rounded-full lg:rounded-2xl bg-[#7A8F6B] flex items-center justify-center lg:gap-2 shadow-lg active:scale-95 transition-transform z-40"
          >
            <Plus size={22} className="text-white lg:hidden" />
            <Plus size={18} className="text-white hidden lg:block" />
            <span className="text-[14px] text-white hidden lg:block">Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <TaskCreateModal
          channel={tab}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}
