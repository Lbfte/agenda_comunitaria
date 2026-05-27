"use client";

import React, { useMemo } from "react";
import { CheckCircle2, Circle, Clock, Trash2, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import type { Task } from "@/lib/database.types";
import { motion, AnimatePresence } from "motion/react";
import { SyncStatusBadge } from "./SyncStatusBadge";

interface KanbanBoardProps {
  tasks: Task[];
  onComplete: (taskId: string) => Promise<any>;
  onDelete: (taskId: string) => Promise<any>;
}

// Mapeamento de prioridades baseado em cores de categorias
const getColorWeight = (color: string | null): number => {
  if (!color) return 1;
  const c = color.toUpperCase();
  if (c === "#E85D5D") return 4; // Vermelho (Provas)
  if (c === "#E8C84A") return 3; // Amarelo (Trabalhos)
  if (c === "#7A8F6B") return 2; // Verde (Atividades)
  return 1; // Outros (Avisos / Cinza / Roxo)
};

const getCategoryLabel = (color: string | null): string => {
  if (!color) return "Geral";
  const c = color.toUpperCase();
  if (c === "#E85D5D") return "Prova";
  if (c === "#E8C84A") return "Trabalho";
  if (c === "#7A8F6B") return "Atividade";
  return "Aviso";
};

// Formatação do título das colunas cronológicas
const formatColumnTitle = (dateStr: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const taskDate = new Date(dateStr + "T00:00:00");
  const taskDateMidnight = new Date(taskDate);
  taskDateMidnight.setHours(0, 0, 0, 0);

  if (taskDateMidnight.getTime() === today.getTime()) {
    return "Hoje";
  }
  if (taskDateMidnight.getTime() === tomorrow.getTime()) {
    return "Amanhã";
  }

  // Segunda-feira, 26/05
  const weekday = taskDate.toLocaleDateString("pt-BR", { weekday: "long" });
  const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  const formattedDate = taskDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  
  return `${capitalizedWeekday}, ${formattedDate}`;
};

export function KanbanBoard({ tasks, onComplete, onDelete }: KanbanBoardProps) {
  // Classificar e agrupar tarefas em colunas
  const columns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: Record<string, Task[]> = {
      atrasadas: [],
      semData: []
    };

    tasks.forEach((task) => {
      // 1. Sem data de vencimento
      if (!task.due_date) {
        groups.semData.push(task);
        return;
      }

      const taskDate = new Date(task.due_date + "T00:00:00");
      taskDate.setHours(0, 0, 0, 0);

      // 2. Atrasadas (não concluídas e vencidas antes de hoje)
      if (taskDate.getTime() < today.getTime() && !task.completed) {
        groups.atrasadas.push(task);
      } else {
        // 3. Futuras ou concluídas de hoje/futuro
        const dateStr = task.due_date;
        if (!groups[dateStr]) {
          groups[dateStr] = [];
        }
        groups[dateStr].push(task);
      }
    });

    // Ordenar tarefas dentro de cada coluna por prioridade de cor, e depois por hora
    const sortTasks = (taskList: Task[]) => {
      return [...taskList].sort((a, b) => {
        // Primeiro por status (não concluídas primeiro)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        // Segundo por peso da cor
        const weightA = getColorWeight(a.shape_color);
        const weightB = getColorWeight(b.shape_color);
        if (weightA !== weightB) {
          return weightB - weightA;
        }
        // Terceiro por horário
        if (a.due_time && b.due_time) {
          return a.due_time.localeCompare(b.due_time);
        }
        return (a.due_time ? -1 : 1);
      });
    };

    // Obter todas as chaves de data futuras e ordená-las cronologicamente
    const dateKeys = Object.keys(groups)
      .filter((key) => key !== "atrasadas" && key !== "semData" && groups[key].length > 0)
      .sort((a, b) => a.localeCompare(b));

    const finalColumns: { id: string; title: string; tasks: Task[]; type: "atrasadas" | "data" | "semData" }[] = [];

    // Coluna 1: Atrasadas (se houver tarefas)
    if (groups.atrasadas.length > 0) {
      finalColumns.push({
        id: "atrasadas",
        title: "Atrasadas",
        tasks: sortTasks(groups.atrasadas),
        type: "atrasadas"
      });
    }

    // Colunas de data ordenadas
    dateKeys.forEach((dateStr) => {
      finalColumns.push({
        id: dateStr,
        title: formatColumnTitle(dateStr),
        tasks: sortTasks(groups[dateStr]),
        type: "data"
      });
    });

    // Coluna final: Sem Data (se houver tarefas)
    if (groups.semData.length > 0) {
      finalColumns.push({
        id: "semData",
        title: "Sem Data",
        tasks: sortTasks(groups.semData),
        type: "semData"
      });
    }

    return finalColumns;
  }, [tasks]);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden select-none pb-4 px-2 custom-scrollbar">
      <div className="flex gap-5 min-h-[calc(100vh-180px)] items-start pb-2">
        <AnimatePresence mode="popLayout">
          {columns.map((column) => (
            <motion.div
              key={column.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-[290px] md:w-[320px] rounded-3xl border border-white/[0.04] bg-zinc-900/35 backdrop-blur-md p-4 shrink-0 flex flex-col max-h-[calc(100vh-200px)] shadow-lg shadow-black/20"
            >
              {/* Header da Coluna */}
              <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      column.type === "atrasadas"
                        ? "bg-[#E85D5D] shadow-lg shadow-[#E85D5D]/40"
                        : column.type === "semData"
                        ? "bg-zinc-500"
                        : "bg-[#7A8F6B] shadow-lg shadow-[#7A8F6B]/40"
                    }`}
                  />
                  <h3 className="text-[14px] font-semibold text-white tracking-wide truncate max-w-[210px]">
                    {column.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-zinc-500 bg-white/[0.03] border border-white/[0.04] px-2 py-0.5 rounded-full shrink-0">
                  {column.tasks.length}
                </span>
              </div>

              {/* Lista de Cartões Rolável */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-3 pr-1 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {column.tasks.map((task) => {
                    const category = getCategoryLabel(task.shape_color);
                    
                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ y: -3, scale: 1.01, transition: { duration: 0.15 } }}
                        className={`p-4 rounded-2xl border transition-all cursor-grab active:cursor-grabbing relative group ${
                          task.completed
                            ? "bg-zinc-950/20 border-white/[0.02] opacity-55"
                            : "bg-zinc-900/80 border-white/[0.06] hover:border-white/[0.1] hover:bg-zinc-900 shadow-sm shadow-black/25"
                        }`}
                      >
                        {/* Indicador de prioridade na borda lateral esquerda */}
                        {!task.completed && task.shape_color && (
                          <div
                            className="absolute left-0 top-4 bottom-4 w-[3.5px] rounded-r-full"
                            style={{ backgroundColor: task.shape_color }}
                          />
                        )}

                        {/* Top Row: Categoria e SyncStatus */}
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-md font-semibold tracking-wide uppercase"
                            style={{
                              background: task.completed 
                                ? "rgba(255, 255, 255, 0.03)" 
                                : `${task.shape_color || "#666"}15`,
                              color: task.completed ? "#666" : task.shape_color || "#999"
                            }}
                          >
                            {category}
                          </span>
                          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {task.sync_status && <SyncStatusBadge status={task.sync_status} />}
                          </div>
                        </div>

                        {/* Título e Botão Check */}
                        <div className="flex items-start justify-between gap-2.5 mb-2.5">
                          <h4
                            className={`text-[13.5px] font-semibold tracking-wide leading-snug break-words flex-1 pl-0.5 ${
                              task.completed ? "text-zinc-500 line-through font-normal" : "text-white"
                            }`}
                          >
                            {task.title}
                          </h4>
                          <button
                            onClick={() => onComplete(task.id)}
                            className="text-zinc-500 hover:text-[#9EBF8A] cursor-pointer shrink-0 mt-0.5 transition-colors focus:outline-none"
                          >
                            {task.completed ? (
                              <CheckCircle2 size={17} className="text-[#7A8F6B]" />
                            ) : (
                              <Circle size={17} className="text-zinc-600 hover:scale-105 transition-transform" />
                            )}
                          </button>
                        </div>

                        {/* Descrição Truncada */}
                        {task.description && (
                          <p className="text-[11.5px] text-zinc-400 font-light mb-3 leading-relaxed break-words pl-0.5 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Footer: Hora/Período e Ações rápidas */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/[0.03] pl-0.5 text-zinc-500">
                          <div className="flex items-center gap-1 text-[11px]">
                            {task.due_time ? (
                              <>
                                <Clock size={11} className="text-zinc-600" />
                                <span className={task.completed ? "text-zinc-600" : "text-zinc-400"}>
                                  {task.due_time.slice(0, 5)}
                                </span>
                              </>
                            ) : task.period ? (
                              <>
                                <Clock size={11} className="text-zinc-600" />
                                <span className="capitalize text-zinc-400">{task.period}</span>
                              </>
                            ) : (
                              <span className="text-[10px] text-zinc-600 italic">Sem horário</span>
                            )}
                          </div>

                          {/* Botão de Excluir visível no hover */}
                          <button
                            onClick={() => onDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 cursor-pointer transition-all p-1 -m-1 focus:outline-none rounded-lg hover:bg-white/[0.02]"
                          >
                            <Trash2 size={13.5} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
