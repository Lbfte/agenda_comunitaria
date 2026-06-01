"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "./PageHeader";
import { X, Calendar, RefreshCw, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { getQueueSize } from "@/lib/local-storage";
import { useTasks } from "../hooks/useTasks";
import { checkDeadlineAlerts } from "@/lib/notifications";
import { CalendarGrid } from "./CalendarGrid";
import { TaskCreateModal, type TaskFormData } from "./TaskCreateModal";
import { syncAllWithGoogleCalendar } from "@/lib/sync-engine";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";

// Mocks de lembretes removidos. Usando tarefas do canal pessoal.

export function Dashboard() {
  const router = useRouter();
  const { user, profile, refreshProfile, userTurmas } = useAuth();
  const { isOnline } = useNetworkStatus();
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const [tab, setTab] = useState<"geral" | "pessoal">("pessoal");
  const [turmaName, setTurmaName] = useState<string>("");

  // Inicializar aba baseada na presença de turma
  useEffect(() => {
    if (profile?.turma_id) {
      setTab("geral");
    } else {
      setTab("pessoal");
    }
  }, [profile?.turma_id]);

  // Carregar nome da turma dinamicamente
  useEffect(() => {
    if (profile?.turma_id) {
      supabase
        .from("turmas")
        .select("name")
        .eq("id", profile.turma_id)
        .single()
        .then(({ data }) => {
          if (data) setTurmaName((data as any).name);
        });
    }
  }, [profile?.turma_id]);

  // Data inicial dinâmica baseada na data atual real
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState("");

  const handleCreateReminder = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && reminderText.trim() !== '') {
      const todayStr = new Date().toISOString().split('T')[0];
      await createPersonalTask({
        title: reminderText.trim(),
        shape: 'triangle',
        shape_color: '#5B8DEF', // cor padrão para lembretes rápidos (avisos)
        due_date: todayStr,
      });
      setReminderText("");
      setShowReminder(false);
    }
  };

  // Novos Filtros Inteligentes
  const [categoryFilter, setCategoryFilter] = useState<"todos" | "provas" | "trabalhos" | "atividades" | "avisos">("todos");
  const [periodFilter, setPeriodFilter] = useState<"todos" | "manha" | "tarde" | "noite">("todos");

  // Estado para Sincronização Google Calendar
  const [syncingGCal, setSyncingGCal] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Estado para o modal de criação de tarefa via calendário
  const [calendarTaskDate, setCalendarTaskDate] = useState<string | null>(null);

  // Controle local de visualização da Turma (para usuários com > 1 turma)
  const [viewTurmaId, setViewTurmaId] = useState<string>("");

  useEffect(() => {
    if (profile?.turma_id && !viewTurmaId) {
      setViewTurmaId(profile.turma_id);
    }
  }, [profile?.turma_id, viewTurmaId]);

  // Tasks data for deadline alerts e visualização
  const { tasks, createTask } = useTasks(tab, viewTurmaId || undefined);
  const { tasks: personalTasks, createTask: createPersonalTask } = useTasks("pessoal");
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Check deadline alerts every 60s
  useEffect(() => {
    checkDeadlineAlerts(tasksRef.current);
    const interval = setInterval(() => checkDeadlineAlerts(tasksRef.current), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Filtrar tarefas dinamicamente antes de passá-las para o calendário
  const filteredTasks = tasks.filter(task => {
    // 1. Filtrar por categoria (mapeado por cor)
    if (categoryFilter !== "todos") {
      if (categoryFilter === "provas" && task.shape_color !== "#E85D5D") return false;
      if (categoryFilter === "trabalhos" && task.shape_color !== "#E8C84A") return false;
      if (categoryFilter === "atividades" && task.shape_color !== "#7A8F6B") return false;
      if (categoryFilter === "avisos" && task.shape_color !== "#5B8DEF" && task.shape_color !== "#C77DFF" && task.shape_color !== "#666") return false;
    }
    // 2. Filtrar por período
    if (periodFilter !== "todos" && task.period !== periodFilter) return false;
    return true;
  });

  // Manipular alteração de meses
  const handleMonthChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth);
    setYear(newYear);
    setSelectedDay(1); // Mudar para o dia 1 do novo mês para evitar bugs de data
  };

  // Manipular Integração com Google Calendar
  const handleSyncGCal = async () => {
    if (!user) return;
    setSyncingGCal(true);
    setSyncMessage(null);

    try {
      const result = await syncAllWithGoogleCalendar(user.id);
      if (result.success) {
        setSyncMessage(`Agenda integrada! ${result.syncedCount} evento(s) adicionado(s)/removido(s).`);
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage(`Erro de sincronização: ${result.error || "Tente novamente."}`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setSyncMessage("Erro inesperado na conexão com o Google.");
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncingGCal(false);
    }
  };

  const activeTurmaName = userTurmas?.find(t => t.id === viewTurmaId)?.name || turmaName;

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} viewTurmaId={viewTurmaId} setViewTurmaId={setViewTurmaId} hideGeral={!profile?.turma_id} />

      {/* ─── Greeting + Sync ─── */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] lg:text-[20px] font-semibold text-white tracking-tight">Olá, {firstName}!</h2>
            <p className="text-[13px] text-zinc-500 font-light">
              {profile?.turma_id 
                ? `você está na turma "${activeTurmaName || 'Carregando...'}"`
                : user?.email === "morcegosnaodormem@gmail.com"
                  ? "Painel do Administrador Geral"
                  : "Canal Pessoal (sem turma conectada)"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Botão de Integração Google Calendar */}
            <button
              onClick={handleSyncGCal}
              disabled={syncingGCal}
              className={`h-9 px-3.5 rounded-xl text-[12px] font-semibold flex items-center gap-2 border transition-all select-none ${
                syncingGCal
                  ? "bg-zinc-800 border-zinc-700 text-zinc-400 cursor-not-allowed"
                  : "bg-[#7A8F6B]/10 border-[#7A8F6B]/20 text-[#9EBF8A] hover:bg-[#7A8F6B]/25 hover:border-[#7A8F6B]/30 active:scale-95 cursor-pointer"
              }`}
            >
              {syncingGCal ? (
                <RefreshCw size={14} className="animate-spin text-[#9EBF8A]" />
              ) : (
                <Calendar size={14} className="text-[#9EBF8A]" />
              )}
              <span>{syncingGCal ? "Integrando..." : "Integrar Google Calendar"}</span>
            </button>

            <SyncStatusBadge isOnline={isOnline} pendingCount={getQueueSize()} />
          </div>
        </div>

        {/* Notificação da Sincronização Google Calendar */}
        <AnimatePresence>
          {syncMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 p-3 rounded-xl border border-white/[0.06] bg-zinc-950/80 text-[12px] text-zinc-300 flex items-center gap-2 shadow-lg backdrop-blur-sm"
            >
              <CheckCircle2 size={14} className="text-[#9EBF8A] shrink-0" />
              <span>{syncMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      <div className="mx-7 h-[1px] bg-white/[0.04] mb-5 hidden lg:block" />

      {/* ─── Grid Principal: Calendário + Lembretes ─── */}
      <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-8 lg:px-7">
        
        {/* ─── Coluna Esquerda: Filtros + Calendário ─── */}
        <div className="flex flex-col">
          
          {/* Seção de Filtros Redesenhada */}
          <div className="px-6 lg:px-0 mb-4 bg-zinc-900/30 border border-white/[0.04] lg:bg-transparent lg:border-none rounded-2xl p-4 lg:p-0">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={14} className="text-zinc-400" />
                <h3 className="text-[14px] font-semibold text-white tracking-wide uppercase">Filtrar Calendário</h3>
              </div>
              <button
                className="text-[12px] text-zinc-500 hover:text-white flex items-center gap-0.5 transition-colors"
                onClick={() => router.push("/tasks")}
              >
                <span>Listagem</span>
                <ChevronRight size={12} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Filtro por Categorias */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-medium mr-1.5 uppercase tracking-wider">Tipos:</span>
                {[
                  { id: "todos", label: "Tudo", color: "border-zinc-700 text-zinc-300" },
                  { id: "provas", label: "Provas 🔴", color: "border-red-500/20 text-red-400 hover:bg-red-500/5" },
                  { id: "trabalhos", label: "Trabalhos 🟡", color: "border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/5" },
                  { id: "atividades", label: "Atividades 🟢", color: "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/5" },
                  { id: "avisos", label: "Avisos 🔵", color: "border-blue-500/20 text-blue-400 hover:bg-blue-500/5" }
                ].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryFilter(c.id as any)}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium border select-none transition-all active:scale-95 ${
                      categoryFilter === c.id
                        ? "bg-[#7A8F6B] border-[#7A8F6B] text-zinc-950 font-semibold"
                        : `bg-white/[0.02] ${c.color}`
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Filtro por Período */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-zinc-500 font-medium mr-1.5 uppercase tracking-wider">Turno:</span>
                {[
                  { id: "todos", label: "Todos" },
                  { id: "manha", label: "Manhã" },
                  { id: "tarde", label: "Tarde" },
                  { id: "noite", label: "Noite" }
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setPeriodFilter(p.id as any)}
                    className={`h-7 px-3 rounded-full text-[11px] font-medium border select-none transition-all active:scale-95 ${
                      periodFilter === p.id
                        ? "bg-zinc-300 border-zinc-300 text-zinc-950 font-semibold"
                        : "bg-white/[0.02] border-white/[0.04] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Separator — mobile only */}
          <div className="mx-6 h-[1px] bg-white/[0.04] mb-4 lg:hidden" />

          {/* Calendário Dinâmico */}
          <CalendarGrid 
            month={month}
            year={year}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            onMonthChange={handleMonthChange}
            tasks={filteredTasks}
            onAddTask={(date) => setCalendarTaskDate(date)}
          />

          {/* ─── Tarefas do Dia Selecionado ─── */}
          <div className="px-6 lg:px-0 mt-2 mb-6">
            <h3 className="text-[14px] font-semibold text-white tracking-wide uppercase mb-3">
              Tarefas do dia {String(selectedDay).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}
            </h3>
            <div className="flex flex-col gap-2">
              {filteredTasks
                .filter(t => t.due_date === `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`)
                .map(task => (
                  <div key={task.id} className="p-4 rounded-xl border border-white/[0.04] bg-zinc-900/40 hover:bg-zinc-900/60 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: task.shape_color || "#7A8F6B" }}></span>
                      <h4 className="text-[13px] font-semibold text-white">{task.title}</h4>
                      {task.due_time && <span className="ml-auto text-[11px] text-zinc-500 font-medium bg-zinc-950 px-2 py-0.5 rounded-full">{task.due_time}</span>}
                    </div>
                    {task.description && (
                      <p className="text-[12px] text-zinc-400 mb-3 pl-4 border-l border-white/[0.04] ml-1">{task.description}</p>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-2 pt-2 border-t border-white/[0.02]">
                      <span>
                        Adicionado por: <strong className="text-zinc-400">{task.created_by === user?.id ? "Você" : "Membro da Turma"}</strong>
                      </span>
                      <span className="capitalize">{task.period || "Sem turno"}</span>
                    </div>
                  </div>
                ))}
              {filteredTasks.filter(t => t.due_date === `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`).length === 0 && (
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/[0.06] bg-zinc-900/20">
                  <span className="text-[12px] text-zinc-500">Nenhuma tarefa para este dia.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── Coluna Direita: Lembretes + Alterações ─── */}
        <div>
          {/* Adicionar Lembrete */}
          <div className="px-6 lg:px-0 mb-5">
            <div
              className="flex items-center gap-3 h-[64px] rounded-2xl px-5 border-2 border-dashed border-white/[0.06] bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-white/[0.1] cursor-pointer transition-all active:scale-[0.98] select-none"
              onClick={() => setShowReminder(true)}
            >
              <span className="text-[28px] text-zinc-600 font-light leading-none">+</span>
              <span className="text-[14px] text-zinc-500">
                Adicionar lembrete rápido
              </span>
            </div>

            {/* Reminder Modal Inline */}
            {showReminder && (
              <div className="mt-3 rounded-2xl p-4 border border-white/[0.06] bg-zinc-900/60 backdrop-blur-sm shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[13px] font-medium text-white">Nome do lembrete</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#9EBF8A] font-semibold px-2 py-0.5 rounded-full bg-[#7A8F6B]/15">Todos</span>
                    <button onClick={() => setShowReminder(false)} className="text-zinc-500 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-inner"
                    style={{ backgroundColor: profile?.color || "#7A8F6B" }}
                  >
                    {profile?.initials || "U"}
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-white">{firstName}</p>
                    <p className="text-[10px] text-zinc-500">Hoje</p>
                  </div>
                  <p className="text-[12px] text-zinc-400 italic ml-auto max-w-[140px] truncate">Anotação pessoal</p>
                </div>
                <input
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  onKeyDown={handleCreateReminder}
                  placeholder="Escrever lembrete... (pressione Enter para salvar)"
                  className="w-full bg-zinc-950 border border-white/[0.04] focus:border-[#7A8F6B]/30 rounded-xl px-3.5 py-2 text-[12px] text-white placeholder-zinc-700 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* ─── Lembretes Pessoais ─── */}
          <div className="px-6 lg:px-0 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[24px] px-3.5 rounded-full border border-white/[0.06] bg-white/[0.04] flex items-center">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Meus Lembretes</span>
              </div>
            </div>

            {personalTasks.filter(t => !t.completed).slice(-5).reverse().map((task) => {
              const taskDate = task.due_date ? task.due_date.split('-').reverse().slice(0, 2).join('/') : "Sem data";
              
              return (
                <div key={task.id} className="flex items-center gap-3 h-[48px] rounded-xl px-4 mb-2.5 border border-white/[0.04] bg-zinc-900/30">
                  <div
                    className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow"
                    style={{ background: task.shape_color || "#5B8DEF" }}
                  >
                    {profile?.initials || "U"}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[12px] font-medium text-white truncate">{task.title}</span>
                    <span className="text-[11px] text-zinc-500 truncate">
                      Adicionado {taskDate}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {personalTasks.filter(t => !t.completed).length === 0 && (
              <p className="text-[12px] text-zinc-500 text-center py-4">Nenhum lembrete rápido.</p>
            )}
          </div>
        </div>

      </div>

      {/* Modal de criação de tarefa via calendário */}
      <AnimatePresence>
        {calendarTaskDate && (
          <TaskCreateModal
            channel={tab}
            editData={{
              title: '',
              description: '',
              due_date: calendarTaskDate,
              due_time: '',
              period: '',
              shape: 'triangle',
              shape_color: '#666',
            }}
            onSubmit={async (data: TaskFormData) => {
              await createTask({
                title: data.title,
                description: data.description || undefined,
                due_date: data.due_date || undefined,
                due_time: data.due_time || undefined,
                period: data.period || undefined,
                shape: data.shape,
                shape_color: data.shape_color,
              }, data.turma_id || profile?.turma_id || undefined);
              setCalendarTaskDate(null);
            }}
            onClose={() => setCalendarTaskDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
