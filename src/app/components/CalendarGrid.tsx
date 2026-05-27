"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, CalendarRange, Plus } from "lucide-react";
import type { Task } from "@/lib/database.types";

export type CalendarGridProps = {
  month: number;
  year: number;
  selectedDay: number;
  setSelectedDay: (day: number) => void;
  onMonthChange: (month: number, year: number) => void;
  tasks: Task[];
};

const dayHeaders = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export function CalendarGrid({
  month,
  year,
  selectedDay,
  setSelectedDay,
  onMonthChange,
  tasks
}: CalendarGridProps) {
  const router = useRouter();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  const handlePrevMonth = () => {
    if (month === 0) {
      onMonthChange(11, year - 1);
    } else {
      onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onMonthChange(0, year + 1);
    } else {
      onMonthChange(month + 1, year);
    }
  };

  // Verificar se o dia renderizado é o dia de hoje real
  const today = new Date();
  const isCurrentMonthYear = today.getMonth() === month && today.getFullYear() === year;

  // Filtrar tarefas ativas (não concluídas) para cada dia
  const getTasksForDay = (day: number) => {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return tasks.filter(t => t.due_date === formattedDate && !t.completed);
  };

  return (
    <div className="px-4 lg:px-0 mb-6">
      {/* Container Principal Glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-4 backdrop-blur-md shadow-xl shadow-black/25">
        
        {/* Header com Navegação Dinâmica */}
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <CalendarRange className="text-[#7A8F6B] w-5 h-5" />
            <h3 className="text-[16px] font-semibold text-white tracking-wide">
              {monthNames[month]}, {year}
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevMonth}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNextMonth}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Cabeçalho dos Dias da Semana */}
        <div className="grid grid-cols-7 mb-2 text-center">
          {dayHeaders.map((day, i) => (
            <div key={i} className="py-1">
              <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-wider">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Grade de Dias */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {rows.map((row, ri) =>
            row.map((day, ci) => {
              if (day === null || day === undefined) {
                return <div key={`empty-${ri}-${ci}`} className="h-12" />;
              }

              const isSelected = day === selectedDay;
              const isToday = isCurrentMonthYear && today.getDate() === day;
              const dayTasks = getTasksForDay(day);
              const hasEvents = dayTasks.length > 0;

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => setSelectedDay(day)}
                  className="h-12 flex flex-col items-center justify-between py-1.5 rounded-xl relative focus:outline-none select-none active:scale-95 transition-all"
                >
                  {/* Fundo para dia selecionado */}
                  {isSelected && (
                    <motion.div
                      layoutId="selectedDayBackground"
                      className="absolute inset-0 bg-[#7A8F6B] rounded-xl shadow-lg shadow-[#7A8F6B]/20"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Número do Dia */}
                  <span
                    className={`text-[14px] font-medium z-10 ${
                      isSelected
                        ? "text-zinc-950 font-bold"
                        : isToday
                        ? "text-[#9EBF8A] font-bold underline decoration-2 underline-offset-4"
                        : "text-zinc-300"
                    }`}
                  >
                    {day}
                  </span>

                  {/* Pequenos pontinhos coloridos das tarefas */}
                  <div className="flex justify-center gap-0.5 w-full h-1.5 z-10 mt-auto px-1 overflow-hidden">
                    {hasEvents &&
                      dayTasks.slice(0, 3).map((t, idx) => (
                        <span
                          key={t.id || idx}
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{
                            backgroundColor: t.shape_color || "#7A8F6B",
                            boxShadow: isSelected ? "none" : `0 0 4px ${t.shape_color || "#7A8F6B"}`
                          }}
                        />
                      ))}
                    {dayTasks.length > 3 && (
                      <span className={`text-[6px] leading-none shrink-0 ${isSelected ? "text-zinc-900" : "text-zinc-400"}`}>
                        +
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Botão de Rodapé + Tarefas */}
        <div className="flex justify-end mt-4 pt-3 border-t border-white/[0.04]">
          <button
            onClick={() => router.push("/tasks")}
            className="h-8 px-4 rounded-xl bg-gradient-to-r from-[#7A8F6B] to-[#9EBF8A] text-zinc-950 text-[13px] font-semibold flex items-center gap-1.5 active:scale-95 shadow-lg shadow-[#7A8F6B]/15 transition-transform"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Ver Tarefas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
