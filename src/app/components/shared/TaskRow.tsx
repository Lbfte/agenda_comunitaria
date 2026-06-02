import { motion } from "motion/react";
import { Check, Trash2, AlertCircle } from "lucide-react";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { TASK_PERIODS } from "@/lib/constants";
import type { Task } from "@/lib/database.types";

interface TaskRowProps {
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

export function TaskRow({ task, isOnline, onComplete, onDelete }: TaskRowProps) {
  const isOverdue = task.due_date && !task.completed && new Date(task.due_date + "T00:00:00") < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-4 h-[58px] rounded-xl px-4 mb-2.5 border border-white/[0.04] bg-zinc-900/30 hover:bg-zinc-900/50 hover:border-white/[0.08] transition-all group"
    >
      {/* Marcador Categoria */}
      <div className="shrink-0 flex items-center justify-center">
        <span
          className="w-3.5 h-3.5 rounded-full block shadow-sm shadow-black/30"
          style={{
            backgroundColor: task.shape_color || "#666",
            border: `1px solid rgba(255,255,255,0.15)`
          }}
        />
      </div>

      {/* Título e Descrição Rápida */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <span className={`text-[14px] font-medium truncate ${task.completed ? "line-through text-zinc-600" : "text-white"}`}>
          {task.title}
        </span>
        {task.description && (
          <span className="text-[11px] text-zinc-500 truncate max-w-[400px]">
            {task.description}
          </span>
        )}
      </div>

      {/* Sync Status Badge */}
      <SyncStatusBadge isOnline={isOnline} pendingCount={0} syncStatus={task.sync_status} />

      {/* Badges de Turno e Data */}
      <div className="flex items-center gap-2 shrink-0">
        {task.period && TASK_PERIODS[task.period] && (
          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
            {TASK_PERIODS[task.period]}
          </span>
        )}
        {task.due_date && (
          <span className={`text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full ${
            task.completed
              ? "bg-zinc-800/40 text-zinc-600"
              : isOverdue
              ? "bg-red-500/10 text-red-400 border border-red-500/15"
              : "bg-[#7A8F6B]/10 text-[#9EBF8A] border border-[#7A8F6B]/15"
          }`}>
            {isOverdue && <AlertCircle size={10} />}
            {formatDateLabel(task.due_date)} {task.due_time || ""}
          </span>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-1.5 shrink-0 opacity-80 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
        {!task.completed && (
          <button
            onClick={() => onComplete(task.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/15 text-emerald-400 transition-colors cursor-pointer"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={() => onDelete(task.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/25 border border-red-500/15 text-red-400 transition-colors cursor-pointer"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  );
}
