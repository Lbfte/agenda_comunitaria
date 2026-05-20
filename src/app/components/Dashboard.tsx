import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { PageHeader } from "./PageHeader";
import { X, Calendar, RefreshCw, CheckCircle2, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { getQueueSize } from "@/lib/local-storage";
import { useTasks } from "../hooks/useTasks";
import { checkDeadlineAlerts } from "@/lib/notifications";
import { CalendarGrid } from "./CalendarGrid";
import { syncAllWithGoogleCalendar } from "@/lib/sync-engine";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";

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
  const { user, profile, refreshProfile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const [turmaName, setTurmaName] = useState<string>("");

  // Estados para o fluxo de onboarding e solicitação de turma
  const [onboardingLoading, setOnboardingLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [availableTurmas, setAvailableTurmas] = useState<{ id: string; name: string }[]>([]);
  const [selectedOnboardingTurmaId, setSelectedOnboardingTurmaId] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Carregar nome da turma dinamicamente
  useEffect(() => {
    if (profile?.turma_id) {
      supabase
        .from("turmas")
        .select("name")
        .eq("id", profile.turma_id)
        .single()
        .then(({ data }) => {
          if (data) setTurmaName(data.name);
        });
    }
  }, [profile?.turma_id]);

  // Gerenciar o fluxo de onboarding e solicitações de turma
  useEffect(() => {
    if (!user) return;

    async function checkOnboarding() {
      setOnboardingLoading(true);
      setOnboardingError(null);

      try {
        if (profile?.turma_id) {
          setOnboardingLoading(false);
          return;
        }

        const pendingTurmaId = localStorage.getItem("pending_turma_id");
        if (pendingTurmaId) {
          const { error: insertError } = await supabase
            .from("turma_requests")
            .insert({
              user_id: user.id,
              turma_id: pendingTurmaId,
              status: "pending"
            });

          if (insertError) {
            console.error("Erro ao inserir solicitação automática:", insertError);
          }
          localStorage.removeItem("pending_turma_id");
        }

        const { data: requestData, error: requestError } = await supabase
          .from("turma_requests")
          .select("*, turmas(name)")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .maybeSingle();

        if (requestError) {
          console.error("Erro ao buscar solicitações:", requestError);
        } else if (requestData) {
          setActiveRequest(requestData);
        } else {
          setActiveRequest(null);
          const { data: turmasData, error: turmasError } = await supabase
            .from("turmas")
            .select("id, name")
            .order("name", { ascending: true });

          if (turmasError) {
            console.error("Erro ao carregar turmas:", turmasError);
          } else if (turmasData) {
            setAvailableTurmas(turmasData);
            if (turmasData.length > 0) {
              setSelectedOnboardingTurmaId(turmasData[0].id);
            }
          }
        }
      } catch (err) {
        console.error("Erro inesperado no onboarding:", err);
      } finally {
        setOnboardingLoading(false);
      }
    }

    checkOnboarding();
  }, [user, profile?.turma_id]);

  const handleSendRequest = async () => {
    if (!user || !selectedOnboardingTurmaId) return;
    setRequestSubmitting(true);
    setOnboardingError(null);

    try {
      const { data, error } = await supabase
        .from("turma_requests")
        .insert({
          user_id: user.id,
          turma_id: selectedOnboardingTurmaId,
          status: "pending"
        })
        .select("*, turmas(name)")
        .single();

      if (error) {
        if (error.message.includes("duplicate key")) {
          setOnboardingError("Você já tem uma solicitação pendente para esta turma.");
        } else {
          setOnboardingError(error.message);
        }
      } else {
        setActiveRequest(data);
      }
    } catch (err: any) {
      setOnboardingError(err.message || "Erro ao enviar solicitação.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!activeRequest || !user) return;
    setRequestSubmitting(true);
    setOnboardingError(null);

    try {
      const { error } = await supabase
        .from("turma_requests")
        .delete()
        .eq("id", activeRequest.id);

      if (error) {
        setOnboardingError(error.message);
      } else {
        setActiveRequest(null);
        const { data: turmasData } = await supabase
          .from("turmas")
          .select("id, name")
          .order("name", { ascending: true });
        if (turmasData) {
          setAvailableTurmas(turmasData);
          if (turmasData.length > 0) {
            setSelectedOnboardingTurmaId(turmasData[0].id);
          }
        }
      }
    } catch (err: any) {
      setOnboardingError(err.message || "Erro ao cancelar solicitação.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const handleCheckStatus = async () => {
    setOnboardingLoading(true);
    await refreshProfile();
    setOnboardingLoading(false);
  };
  
  // Data inicial dinâmica baseada na data atual real
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const [showReminder, setShowReminder] = useState(false);
  const [reminderText, setReminderText] = useState("");

  // Novos Filtros Inteligentes
  const [categoryFilter, setCategoryFilter] = useState<"todos" | "provas" | "trabalhos" | "atividades" | "avisos">("todos");
  const [periodFilter, setPeriodFilter] = useState<"todos" | "manha" | "tarde" | "noite">("todos");

  // Estado para Sincronização Google Calendar
  const [syncingGCal, setSyncingGCal] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Tasks data for deadline alerts e visualização
  const { tasks } = useTasks(tab);
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

  if (!profile?.turma_id && user?.email !== "morcegosnaodormem@gmail.com") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[80vh]">
        {onboardingLoading ? (
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-[#7A8F6B]" />
            <span className="text-[14px] text-zinc-400">Verificando sua turma...</span>
          </div>
        ) : activeRequest ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[420px] p-8 rounded-3xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-md shadow-2xl flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#7A8F6B]/15 flex items-center justify-center mb-6">
              <RefreshCw size={28} className="text-[#9EBF8A] animate-pulse" />
            </div>
            
            <h3 className="text-[20px] font-semibold text-white mb-2">Solicitação Enviada!</h3>
            
            <p className="text-[14px] text-zinc-400 mb-6 leading-relaxed">
              Sua solicitação de entrada na turma <strong className="text-[#9EBF8A]">{activeRequest.turmas?.name}</strong> foi enviada e está aguardando a aprovação do administrador.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleCheckStatus}
                disabled={requestSubmitting}
                className="w-full h-[48px] rounded-xl flex items-center justify-center gap-2 text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#7A8F6B]/10"
              >
                <RefreshCw size={14} className={requestSubmitting ? "animate-spin" : ""} />
                <span>Atualizar Status</span>
              </button>

              <button
                onClick={handleCancelRequest}
                disabled={requestSubmitting}
                className="w-full h-[48px] rounded-xl flex items-center justify-center border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-medium text-[14px] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                <span>Cancelar Solicitação</span>
              </button>
            </div>

            {onboardingError && (
              <p className="text-[12px] text-red-400 mt-4">{onboardingError}</p>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[420px] p-8 rounded-3xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-md shadow-2xl flex flex-col items-center"
          >
            <div className="w-16 h-16 rounded-full bg-[#7A8F6B]/15 flex items-center justify-center mb-6">
              <Calendar size={28} className="text-[#9EBF8A]" />
            </div>

            <h3 className="text-[20px] font-semibold text-white mb-2 text-center">Entre em uma Turma</h3>
            
            <p className="text-[14px] text-zinc-400 mb-6 text-center leading-relaxed">
              Você ainda não está associado a nenhuma turma. Escolha sua turma abaixo para solicitar acesso ao calendário e materiais acadêmicos.
            </p>

            {availableTurmas.length > 0 ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-col gap-1.5 w-full text-left">
                  <span className="text-[12px] text-[#A0A0A0] pl-1 font-medium">Turma Acadêmica</span>
                  <select
                    value={selectedOnboardingTurmaId}
                    onChange={(e) => setSelectedOnboardingTurmaId(e.target.value)}
                    className="w-full h-[52px] rounded-xl px-4 text-white outline-none transition-all focus:border-[#7A8F6B] cursor-pointer bg-zinc-950 border border-white/[0.06]"
                  >
                    {availableTurmas.map((t) => (
                      <option key={t.id} value={t.id} style={{ background: "#1E1E1E", color: "white" }}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleSendRequest}
                  disabled={requestSubmitting || !selectedOnboardingTurmaId}
                  className="w-full h-[52px] rounded-xl flex items-center justify-center mt-2 text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#7A8F6B]/10"
                >
                  {requestSubmitting ? "Enviando..." : "Enviar Solicitação de Entrada"}
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <span className="text-[13px] text-zinc-500">Nenhuma turma cadastrada no sistema. Contate o administrador.</span>
              </div>
            )}

            {onboardingError && (
              <p className="text-[12px] text-red-400 mt-4 text-center">{onboardingError}</p>
            )}

            <button
              onClick={() => supabase.auth.signOut()}
              className="mt-6 text-[13px] text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
            >
              Sair da conta
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} />

      {/* ─── Greeting + Sync ─── */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[16px] lg:text-[20px] font-semibold text-white tracking-tight">Olá, {firstName}!</h2>
            <p className="text-[13px] text-zinc-500 font-light">
              {profile?.turma_id 
                ? `você está na turma "${turmaName || 'Carregando...'}"`
                : "Painel do Administrador Geral"}
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
                onClick={() => navigate("/tasks")}
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
          />
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
                  <div className="w-8 h-8 rounded-full bg-[#8F6B8A] flex items-center justify-center text-[11px] font-bold text-white shadow-inner">
                    LB
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-white">Laís Bembo</p>
                    <p className="text-[10px] text-zinc-500">18/03/26</p>
                  </div>
                  <p className="text-[12px] text-zinc-400 italic ml-auto max-w-[140px] truncate">descrição maior aqui</p>
                </div>
                <input
                  value={reminderText}
                  onChange={(e) => setReminderText(e.target.value)}
                  placeholder="Escrever lembrete..."
                  className="w-full bg-zinc-950 border border-white/[0.04] focus:border-[#7A8F6B]/30 rounded-xl px-3.5 py-2 text-[12px] text-white placeholder-zinc-700 outline-none transition-all"
                />
              </div>
            )}
          </div>

          {/* ─── Última Alteração ─── */}
          <div className="px-6 lg:px-0 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[24px] px-3.5 rounded-full border border-white/[0.06] bg-white/[0.04] flex items-center">
                <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">Última alteração</span>
              </div>
              <span className="text-[12px] text-zinc-500">18/03 - 0:45</span>
            </div>

            {recentLogs.map((log, i) => (
              <div key={i} className="flex items-center gap-3 h-[48px] rounded-xl px-4 mb-2.5 border border-white/[0.04] bg-zinc-900/30">
                <div
                  className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow"
                  style={{ background: log.color }}
                >
                  {log.initials}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-[12px] font-medium text-white truncate">{log.user}</span>
                  <span className="text-[11px] text-zinc-500 truncate">
                    {log.action} {log.date} - {log.detail}
                  </span>
                </div>
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
