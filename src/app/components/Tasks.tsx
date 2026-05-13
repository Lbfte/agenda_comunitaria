import { useState } from "react";
import { AppLogo } from "./AppLogo";
import { ChevronDown, Triangle } from "lucide-react";

const weekDays = [
  { day: 21, label: "Sab" },
  { day: 22, label: "Dom" },
  { day: 23, label: "Seg", active: true },
  { day: 24, label: "Ter" },
  { day: 25, label: "Qua" },
];

type Task = {
  id: number;
  title: string;
  time: string;
  shape: "triangle" | "invTriangle";
  shapeColor: string;
  highlighted?: boolean;
};

const morningTasks: Task[] = [
  { id: 1, title: "Lorem Ipsum is simply", time: "8:30", shape: "triangle", shapeColor: "#666" },
  { id: 2, title: "Eraset sheets co", time: "9:05", shape: "invTriangle", shapeColor: "#7A8F6B", highlighted: true },
  { id: 3, title: "Lorem Ipsum is simply", time: "8:30", shape: "triangle", shapeColor: "#666" },
];

const afternoonTasks: Task[] = [
  { id: 4, title: "Eraset sheets co", time: "9:05", shape: "invTriangle", shapeColor: "#7A8F6B", highlighted: true },
  { id: 5, title: "Lorem Ipsum is simply", time: "8:30", shape: "triangle", shapeColor: "#666" },
  { id: 6, title: "Eraset sheets co", time: "9:05", shape: "triangle", shapeColor: "#666" },
];

export function Tasks() {
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const [selectedDay, setSelectedDay] = useState(23);

  const TaskItem = ({ task }: { task: Task }) => (
    <div
      className="flex items-center gap-3 h-[48px] rounded-[8px] px-4 mb-2 transition-all active:scale-[0.98]"
      style={{
        background: task.highlighted
          ? "rgba(122,143,107,0.25)"
          : "rgba(42,42,42,0.6)",
        border: task.highlighted ? "1px solid rgba(122,143,107,0.3)" : "none",
      }}
    >
      <div className="shrink-0">
        {task.shape === "invTriangle" ? (
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
            <path d="M7 12L0 0H14L7 12Z" fill={task.shapeColor} />
          </svg>
        ) : (
          <Triangle size={12} fill={task.shapeColor} color={task.shapeColor} />
        )}
      </div>
      <span className={`flex-1 text-[14px] ${task.highlighted ? "text-white" : "text-[rgba(255,255,255,0.5)]"}`}>
        {task.title}
      </span>
      <span className="text-[12px] text-[rgba(255,255,255,0.4)] shrink-0">{task.time}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        <AppLogo size={28} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("pessoal")}
            className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
              tab === "pessoal"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.14)]"
            }`}
          >
            Pessoal
          </button>
          <button
            onClick={() => setTab("geral")}
            className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
              tab === "geral"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-white"
            }`}
          >
            Geral
          </button>
        </div>
      </div>
      <div className="mx-4 h-[1px] bg-[#222] mb-6" />

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] text-white">Olá, Nome!</h2>
        <p className="text-[14px] text-[#707070]">
          você está em "Listas: Ciencias da Comp"
        </p>
      </div>

      {/* Week Selector */}
      <div className="px-7 mb-6">
        <div className="flex items-center gap-1">
          {weekDays.map((wd) => {
            const sel = wd.day === selectedDay;
            return (
              <button
                key={wd.day}
                onClick={() => setSelectedDay(wd.day)}
                className="flex-1 flex flex-col items-center py-2 rounded-lg transition-all"
                style={sel ? { background: "rgba(122,143,107,0.1)" } : undefined}
              >
                <span className="text-[16px] text-[rgba(255,255,255,0.6)]">{wd.day}</span>
                <span className={`text-[13px] ${sel ? "text-white" : "text-[rgba(255,255,255,0.35)]"}`}>
                  {wd.label}
                </span>
                <div
                  className="w-[20px] h-[3px] rounded-full mt-1"
                  style={{ background: sel ? "#7A8F6B" : "#444" }}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Morning Section */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] text-white">Manhã</h3>
          <button className="h-[26px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[11px] text-[rgba(255,255,255,0.6)] flex items-center gap-1">
            Adicionar <ChevronDown size={10} />
          </button>
        </div>
        {morningTasks.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </div>

      {/* Afternoon Section */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] text-white">Tarde</h3>
          <button className="h-[26px] px-3 rounded-2xl border border-[#3a3a3a] bg-[rgba(58,58,58,0.35)] text-[11px] text-[rgba(255,255,255,0.6)] flex items-center gap-1">
            Adicionar <ChevronDown size={10} />
          </button>
        </div>
        {afternoonTasks.map((t) => (
          <TaskItem key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}
