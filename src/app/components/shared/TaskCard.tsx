import { motion } from "motion/react";
import { Check, Trash2, AlertCircle, Calendar } from "lucide-react";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { TASK_PERIODS } from "@/lib/constants";
import type { Task } from "@/lib/database.types";

interface TaskCardProps {
  task: Task;
  isOnline: boolean;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDateLabel = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
};

export function TaskCard({ task, isOnline, onComplete, onDelete }: TaskCardProps) {
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date + "T00:00:00") < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative flex flex-col justify-between overflow-hidden p-5 rounded-2xl border border-white/[0.05] bg-zinc-900/40 backdrop-blur-md hover:border-white/[0.09] hover:bg-zinc-900/60 shadow-lg shadow-black/15 transition-all duration-300 group"
    >
      {/* Faixa lateral decorativa de categoria */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: task.shape_color || "#666" }}
      />

      {/* Topo do Card: Título e Status */}
      <div className="pl-2">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h4 className={`text-[15px] font-semibold tracking-tight ${task.completed ? "line-through text-zinc-600" : "text-white"}`}>
            {task.title}
          </h4>
          <div className="shrink-0 flex items-center gap-1.5">
            <SyncStatusBadge isOnline={isOnline} pendingCount={0} syncStatus={task.sync_status} />
            {task.google_calendar_event_id && (
              <span>
                <Calendar size={12} className="text-[#9EBF8A]/70" />
              </span>
            )}
          </div>
        </div>
        
        {/* Descrição */}
        <p className={`text-[12px] font-light min-h-[36px] line-clamp-2 leading-relaxed mb-4 ${task.completed ? "text-zinc-700" : "text-zinc-400"}`}>
          {task.description || <span className="text-zinc-700 italic">Sem descrição.</span>}
        </p>
      </div>

      {/* Rodapé do Card: Tags e Botões de Ação */}
      <div className="pl-2 pt-3 border-t border-white/[0.03] flex items-center justify-between gap-2 mt-auto">
        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {task.period && TASK_PERIODS[task.period] && (
            <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">
              {TASK_PERIODS[task.period]}
            </span>
          )}
          {task.due_date && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
              task.completed
                ? "bg-zinc-800/40 text-zinc-600"
                : isOverdue
                ? "bg-red-500/10 text-red-400 border border-red-500/15"
                : "bg-[#7A8F6B]/10 text-[#9EBF8A] border border-[#7A8F6B]/15"
            }`}>
              {isOverdue && <AlertCircle size={9} />}
              {formatDateLabel(task.due_date)} {task.due_time || ""}
            </span>
          )}
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!task.completed && (
            <button
              onClick={() => onComplete(task.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/15 text-emerald-400 transition-all cursor-pointer active:scale-90"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/25 border border-red-500/15 text-red-400 transition-all cursor-pointer active:scale-90"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
