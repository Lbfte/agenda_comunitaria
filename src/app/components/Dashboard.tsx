import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "./PageHeader";
import { Maximize2, X } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { getQueueSize } from "@/lib/local-storage";
import { useTasks } from "../hooks/useTasks";
import { checkDeadlineAlerts } from "@/lib/notifications";

const dayHeaders = ["D", "S", "T", "Q", "Q", "S", "S"];

type Reminder = {
  id: number;
  name: string;
  user: string;
  userColor: string;
  userInitials: string;
  date: string;
  desc: string;
};

const reminders: Reminder[] = [
  { id: 1, name: "Prova de Cálculo", user: "Laís Bembo", userColor: "#8F6B8A", userInitials: "LB", date: "20/03", desc: "Prova" },
];

type LogEntry = {
  user: string;
  initials: string;
  color: string;
  action: string;
  date: string;
  detail: string;
};

const recentLogs: LogEntry[] = [
  { user: "Laís Bembo", initials: "LB", color: "#8F6B8A", action: "add em", date: "20/03", detail: "Prova" },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const [month] = useState(2); // March
  const [year] = useState(2026);
  const [selectedDay, setSelectedDay] = useState(17);
  const [calView, setCalView] = useState<"month" | "week">("month");
  const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState("");
  const [shapeFilter, setShapeFilter] = useState(true);
  const [colorFilter, setColorFilter] = useState(true);

  // Tasks data for deadline alerts
  const { tasks } = useTasks(tab);

  // Check deadline alerts every 60s
  useEffect(() => {
    checkDeadlineAlerts(tasks);
    const interval = setInterval(() => checkDeadlineAlerts(tasks), 60_000);
    return () => clearInterval(interval);
  }, [tasks]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getWeekRows = () => {
    const dayIndex = firstDay + selectedDay - 1;
    const weekStart = dayIndex - (dayIndex % 7);
    return [cells.slice(weekStart, weekStart + 7)];
  };

  const getMonthRows = () => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  };

  const rows = calView === "week" ? getWeekRows() : getMonthRows();
  const eventDays: Record<number, boolean> = { 17: true };

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} />

      {/* ─── Greeting + Sync ─── */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] lg:text-[20px] text-white">Olá, {firstName}!</h2>
            <p className="text-[14px] text-[#707070]">
              você está na turma "Ciencias da Comp"
            </p>
          </div>
          <SyncStatusBadge isOnline={isOnline} pendingCount={getQueueSize()} />
        </div>
      </div>

      {/* ─── Desktop: 2-column grid for calendar + reminders ─── */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-7">
        {/* ─── Left column: Filters + Calendar ─── */}
        <div>
          {/* Filters */}
          <div className="px-7 lg:px-0 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] text-white">Filtrando por</h3>
              <button
                className="text-[14px] text-[rgba(112,112,112,0.48)]"
                onClick={() => navigate("/tasks")}
              >
                ver mais...
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShapeFilter(!shapeFilter)}
                className="h-[33px] px-4 rounded-[5px] text-[14px] text-[#a1a0a0] flex items-center gap-2"
                style={{ background: "#222" }}
              >
                Formas {shapeFilter && <span className="text-[#666]">x</span>}
              </button>
              <button
                onClick={() => setColorFilter(!colorFilter)}
                className="h-[33px] px-4 rounded-[5px] text-[14px] text-[#a1a0a0] flex items-center gap-2"
                style={{ background: "#222" }}
              >
                Cores {colorFilter && <span className="text-[#666]">x</span>}
              </button>
              <div className="flex-1" />
              <button
                onClick={() => setCalView(calView === "month" ? "week" : "month")}
                className="h-[25px] px-3 rounded-[3px] text-[12px] text-white flex items-center gap-1"
                style={{ background: "#424C3B" }}
              >
                {calView === "month" ? "Expandir" : "Minimizar"}
              </button>
              <button className="text-[#666]">
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Separator — mobile only */}
          <div className="mx-4 h-[1px] bg-[#222] mb-4 lg:hidden" />

          {/* Calendar */}
          <div className="px-7 lg:px-0 mb-4">
            <h3 className="text-[16px] text-white mb-2">Março, 2026</h3>

            {/* Day headers */}
            <div className="grid grid-cols-7 rounded-[4px] mb-1" style={{ background: "#222" }}>
              {dayHeaders.map((d, i) => {
                const isTuesday = i === 2;
                return (
                  <div key={i} className="flex items-center justify-center h-[33px]">
                    {isTuesday ? (
                      <div className="w-[21px] h-[20px] rounded-full bg-[#7A8F6B] flex items-center justify-center">
                        <span className="text-[14px] text-[#1c1c1c]">{d}</span>
                      </div>
                    ) : (
                      <span className="text-[14px] text-[rgba(255,255,255,0.57)]">{d}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day grid */}
            <div className="rounded-[4px]" style={{ background: "#222" }}>
              {rows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7">
                  {row.map((day, ci) => {
                    if (day === undefined || day === null) {
                      return <div key={ci} className="h-[38px]" />;
                    }
                    const isSelected = day === selectedDay;
                    const hasEvent = eventDays[day];
                    return (
                      <button
                        key={ci}
                        onClick={() => setSelectedDay(day)}
                        className="h-[38px] flex items-center justify-center relative"
                      >
                        {hasEvent && isSelected ? (
                          <div className="w-[35px] h-[27px] flex items-center justify-center">
                            <svg width="35" height="27" viewBox="0 0 35 27" fill="none">
                              <path d="M17.5 0L35 27H0L17.5 0Z" fill="#7A8F6B" />
                            </svg>
                            <span className="absolute text-[13px] text-[#1c1c1c]">{day}</span>
                          </div>
                        ) : (
                          <span className="text-[14px] text-[rgba(255,255,255,0.34)]">{day}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}

              {/* + Tarefas button inside calendar */}
              <div className="flex justify-end px-2 pb-2 pt-1">
                <button
                  onClick={() => navigate("/tasks")}
                  className="h-[27px] px-4 rounded-[4px] bg-[#7A8F6B] flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="text-[20px] text-white leading-none">+</span>
                  <span className="text-[13px] text-white">Tarefas</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right column (desktop) / full-width (mobile): Reminders ─── */}
        <div>
          {/* Add Reminder */}
          <div className="px-7 lg:px-0 mb-5">
            <div
              className="flex items-center gap-3 h-[69px] rounded-[9px] px-5 cursor-pointer transition-all active:scale-[0.98]"
              style={{
                background: "rgba(40,40,40,0.41)",
                border: "2px dashed #282828",
              }}
              onClick={() => setShowReminder(true)}
            >
              <span className="text-[38px] text-[#4c4c4c] leading-none">+</span>
              <span className="text-[16px] text-[rgba(255,255,255,0.19)]">
                Adicionar lembrete
              </span>
            </div>

            {/* Reminder Modal Inline */}
            {showReminder && (
              <div className="mt-3 rounded-[12px] p-4" style={{ background: "rgba(58,58,58,0.6)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[14px] text-white">Nome lembrete</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#7A8F6B] px-2 py-0.5 rounded bg-[rgba(122,143,107,0.15)]">Todos</span>
                    <button onClick={() => setShowReminder(false)} className="text-[#666]">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[#8F6B8A] flex items-center justify-center">
                    <span className="text-[10px] text-white">LB</span>
                  </div>
                  <div>
                    <p className="text-[12px] text-white">Laís Bembo</p>
                    <p className="text-[10px] text-[#666]">18/03/26</p>
                  </div>
                  <p className="text-[13px] text-[#666] ml-2">descrição maior aqui</p>
                </div>
                <input
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  placeholder="Escrever lembrete..."
                  className="w-full bg-[#222] rounded-lg px-3 py-2 text-[12px] text-white placeholder-[#555] outline-none"
                />
              </div>
            )}
          </div>

          {/* ─── Ultima Alteração — desktop: inside right column ─── */}
          <div className="px-7 lg:px-0 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[27px] px-3 rounded-[3px] flex items-center" style={{ background: "rgba(114,114,114,0.19)" }}>
                <span className="text-[13px] text-white">Ultima alteração</span>
              </div>
              <span className="text-[13px] text-[rgba(255,255,255,0.37)]">18/03 - 0:45</span>
            </div>

            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 h-[42px] rounded-[3px] px-3 mb-2" style={{ background: "#222" }}>
                <div
                  className="w-[28px] h-[25px] rounded-full flex items-center justify-center shrink-0"
                  style={{ background: log.color }}
                >
                  <span className="text-[11px] text-white">{log.initials}</span>
                </div>
                <span className="text-[12px] text-white">{log.user}</span>
                <span className="text-[13px] text-[rgba(255,255,255,0.37)]">
                  {log.action} {log.date} -
                </span>
                <span className="text-[13px] text-[rgba(255,255,255,0.37)]">{log.detail}</span>
                <div className="flex-1" />
                <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="shrink-0">
                  <path d="M14 0V10L0 7L14 0Z" fill="#666" fillOpacity="0.3" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
