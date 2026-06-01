"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "./PageHeader";
import {
  Search, Check, Trash2, Plus, SlidersHorizontal, List, Grid,
  Calendar, RefreshCw, CheckCircle2, ChevronDown, AlertCircle,
  HelpCircle, Clock
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTasks } from "../hooks/useTasks";
import { SyncStatusBadge } from "./SyncStatusBadge";
import { TaskCreateModal, type TaskFormData } from "./TaskCreateModal";
import { syncAllWithGoogleCalendar } from "@/lib/sync-engine";
import { motion, AnimatePresence } from "motion/react";
import { KanbanBoard } from "./KanbanBoard";

export function Tasks() {
  const [tab, setTab] = useState<"geral" | "pessoal">("pessoal");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, profile, userTurmas } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  useEffect(() => {
    if (profile?.turma_id) {
      setTab("geral");
    } else {
      setTab("pessoal");
    }
  }, [profile?.turma_id]);

  // Controle local de visualização da Turma (para usuários com > 1 turma)
  const [viewTurmaId, setViewTurmaId] = useState<string>("");

  useEffect(() => {
    if (profile?.turma_id && !viewTurmaId) {
      setViewTurmaId(profile.turma_id);
    }
  }, [profile?.turma_id, viewTurmaId]);

  // Buscar tarefas usando o hook otimizado
  const { tasks, loading, isOnline, pendingCount, fetchTasks, createTask, completeTask, deleteTask } =
    useTasks(tab, viewTurmaId || undefined);

  // Novos Estados
  const [viewMode, setViewMode] = useState<"lista" | "cards" | "kanban">("lista");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"todos" | "provas" | "trabalhos" | "atividades" | "avisos">("todos");
  
  // Controle de Abas Recolhidas (Collapsible sections)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    concluidas: true // Por padrão, as concluídas começam recolhidas
  });

  // Estado para Sincronização Google Calendar
  const [syncingGCal, setSyncingGCal] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Manipular alternância de recolhimento
  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Filtragem de tarefas por busca e categoria
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      // 1. Busca por título ou descrição
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Filtro por categoria (mapeado por cor)
      if (categoryFilter !== "todos") {
        if (categoryFilter === "provas" && t.shape_color !== "#E85D5D") return false;
        if (categoryFilter === "trabalhos" && t.shape_color !== "#E8C84A") return false;
        if (categoryFilter === "atividades" && t.shape_color !== "#7A8F6B") return false;
        if (categoryFilter === "avisos" && t.shape_color !== "#5B8DEF" && t.shape_color !== "#C77DFF" && t.shape_color !== "#666") return false;
      }

      return true;
    });
  }, [tasks, searchQuery, categoryFilter]);

  // Agrupamento contínuo das tarefas por períodos cronológicos
  const groupedTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    const getDaysDiff = (dateStr: string) => {
      const today = new Date(todayStr + "T00:00:00");
      const target = new Date(dateStr + "T00:00:00");
      return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    };

    const groups = {
      atrasadas: [] as typeof tasks,
      hoje: [] as typeof tasks,
      amanha: [] as typeof tasks,
      estaSemana: [] as typeof tasks,
      maisTarde: [] as typeof tasks,
      semData: [] as typeof tasks,
      concluidas: [] as typeof tasks
    };

    filteredTasks.forEach(t => {
      if (t.completed) {
        groups.concluidas.push(t);
      } else if (!t.due_date) {
        groups.semData.push(t);
      } else {
        const diff = getDaysDiff(t.due_date);
        if (diff < 0) {
          groups.atrasadas.push(t);
        } else if (diff === 0) {
          groups.hoje.push(t);
        } else if (diff === 1) {
          groups.amanha.push(t);
        } else if (diff > 1 && diff <= 7) {
          groups.estaSemana.push(t);
        } else {
          groups.maisTarde.push(t);
        }
      }
    });

    return groups;
  }, [filteredTasks]);

  const handleCreate = async (form: TaskFormData) => {
    if (tab === "geral" && !profile?.turma_id) {
      alert("Você precisa entrar em uma turma para criar avisos na aba Geral!");
      return;
    }

    const result = await createTask({
      title: form.title,
      description: form.description || undefined,
      due_date: form.due_date || undefined,
      due_time: form.due_time || undefined,
      period: (form.period as 'manha' | 'tarde' | 'noite') || undefined,
      shape: form.shape,
      shape_color: form.shape_color,
    }, form.turma_id || profile?.turma_id || undefined);

    if (result && !result.success) {
      alert("Erro ao salvar tarefa: " + (result.error || "Tente novamente."));
    }

    setShowCreateModal(false);
  };

  // Manipular Sincronização Google Calendar
  const handleSyncGCal = async () => {
    if (!user) return;
    setSyncingGCal(true);
    setSyncMessage(null);

    try {
      const result = await syncAllWithGoogleCalendar(user.id);
      if (result.success) {
        setSyncMessage(`Agenda integrada! ${result.syncedCount} evento(s) adicionado(s)/removido(s).`);
        setTimeout(() => setSyncMessage(null), 5000);
        fetchTasks(); // Atualizar a lista local para refletir IDs do Google Calendar
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

  // Auxiliar para obter rótulo do período
  const getPeriodLabel = (p?: string | null) => {
    if (p === "manha") return "☀️ Manhã";
    if (p === "tarde") return "⛅ Tarde";
    if (p === "noite") return "🌙 Noite";
    return null;
  };

  // Auxiliar para formatar data (DD/MM)
  const formatDateLabel = (dateStr?: string | null) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  };

  // COMPONENTE: Renderizar uma Tarefa no MODO LISTA
  const RenderTaskRow = ({ task }: { task: typeof tasks[0] }) => {
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
          {getPeriodLabel(task.period) && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
              {getPeriodLabel(task.period)}
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

        {/* Ações (Visíveis no Hover no desktop, ativas no mobile) */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-80 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
          {!task.completed && (
            <button
              onClick={() => completeTask(task.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/15 text-emerald-400 transition-colors cursor-pointer"
            >
              <Check size={14} />
            </button>
          )}
          <button
            onClick={() => deleteTask(task.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 hover:bg-red-500/25 border border-red-500/15 text-red-400 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </motion.div>
    );
  };

  // COMPONENTE: Renderizar uma Tarefa no MODO CARDS (Glassmorphic)
  const RenderTaskCard = ({ task }: { task: typeof tasks[0] }) => {
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
            {getPeriodLabel(task.period) && (
              <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-500 font-medium">
                {getPeriodLabel(task.period)}
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
                onClick={() => completeTask(task.id)}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/15 text-emerald-400 transition-all cursor-pointer active:scale-90"
              >
                <Check size={14} />
              </button>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 hover:bg-red-500/25 border border-red-500/15 text-red-400 transition-all cursor-pointer active:scale-90"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  // RENDER SEÇÃO AGRUPADA
  const RenderGroupSection = (title: string, items: typeof tasks, secKey: string, iconColor = "text-[#7A8F6B]") => {
    if (items.length === 0) return null;
    const isCollapsed = collapsedSections[secKey] || false;

    return (
      <div className="mb-5 bg-zinc-900/10 border border-white/[0.02] p-4 rounded-2xl">
        <div
          onClick={() => toggleSection(secKey)}
          className="flex items-center justify-between mb-3 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${secKey === "atrasadas" ? "bg-red-500" : secKey === "concluidas" ? "bg-zinc-600" : "bg-[#7A8F6B]"}`} />
            <h3 className="text-[15px] font-semibold text-white tracking-wide">{title}</h3>
            <span className="text-[11px] text-zinc-500 font-light">({items.length})</span>
          </div>
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="text-zinc-500 group-hover:text-white"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {viewMode === "lista" ? (
                <div className="flex flex-col">
                  {items.map((t) => (
                    <RenderTaskRow key={t.id} task={t} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                  {items.map((t) => (
                    <RenderTaskCard key={t.id} task={t} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const activeTurmaName = userTurmas?.find(t => t.id === viewTurmaId)?.name || 'Carregando...';

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} viewTurmaId={viewTurmaId} setViewTurmaId={setViewTurmaId} hideGeral={!profile?.turma_id} />

      {/* Greeting + Sync Status */}
      <div className="px-7 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-[16px] lg:text-[20px] font-semibold text-white tracking-tight">Olá, {firstName}!</h2>
            <p className="text-[13px] text-zinc-500 font-light">
              {tab === "geral" 
                ? `você está na aba "Listas: ${activeTurmaName}"`
                : profile?.turma_id
                  ? 'você está na aba "Listas: Pessoais"'
                  : 'você está na aba "Listas: Pessoais (sem turma conectada)"'}
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

            <SyncStatusBadge isOnline={isOnline} pendingCount={pendingCount} />
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
      <div className="mx-7 h-[1px] bg-white/[0.04] mb-5" />

      {/* ─── Painel Superior: Barra de Busca, Alternador de View e Filtros ─── */}
      <div className="px-6 lg:px-7 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-zinc-900/30 border border-white/[0.04] p-4 rounded-2xl">
          {/* Input de Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4.5 h-4.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              className="w-full h-10 pl-11 pr-4 bg-zinc-950 border border-white/[0.04] focus:border-[#7A8F6B]/30 rounded-xl text-[13px] text-white placeholder-zinc-700 outline-none transition-all"
            />
          </div>

          {/* Filtro por Categoria rápido */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium mr-1 uppercase tracking-wider">Tipo:</span>
            {[
              { id: "todos", label: "Tudo" },
              { id: "provas", label: "Provas 🔴" },
              { id: "trabalhos", label: "Trabalhos 🟡" },
              { id: "atividades", label: "Atividades 🟢" },
              { id: "avisos", label: "Avisos 🔵" }
            ].map(c => (
              <button
                key={c.id}
                onClick={() => setCategoryFilter(c.id as any)}
                className={`h-8 px-3 rounded-xl text-[11px] font-medium border select-none transition-all active:scale-95 ${
                  categoryFilter === c.id
                    ? "bg-[#7A8F6B] border-[#7A8F6B] text-zinc-950 font-bold"
                    : "bg-zinc-950 border-white/[0.04] text-zinc-400 hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Alternador de Layout Lista / Cards */}
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto border-t md:border-t-0 border-white/[0.04] pt-3 md:pt-0">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider hidden sm:inline mr-1">Visualização:</span>
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/[0.04] relative">
              <button
                onClick={() => setViewMode("lista")}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "lista" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Lista"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "cards" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Cards"
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "kanban" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Kanban"
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Listagem de Tarefas Agrupadas ─── */}
      <div className="px-6 lg:px-7 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-zinc-800 border-t-[#7A8F6B] rounded-full animate-spin" />
            <span className="text-[13px] text-zinc-500 font-light">Carregando central de avisos...</span>
          </div>
        ) : viewMode === "kanban" ? (
          <KanbanBoard tasks={filteredTasks} onComplete={completeTask} onDelete={deleteTask} />
        ) : (
          <div className="space-y-1">
            {RenderGroupSection("⚠️ Atrasadas / Pendentes Anteriores", groupedTasks.atrasadas, "atrasadas")}
            {RenderGroupSection("📅 Hoje", groupedTasks.hoje, "hoje")}
            {RenderGroupSection("🌅 Amanhã", groupedTasks.amanha, "amanha")}
            {RenderGroupSection("🗓️ Esta Semana", groupedTasks.estaSemana, "estaSemana")}
            {RenderGroupSection("⏳ Próximas Entregas", groupedTasks.maisTarde, "maisTarde")}
            {RenderGroupSection("❓ Sem Data Definida", groupedTasks.semData, "semData")}
            {RenderGroupSection("✅ Concluídas", groupedTasks.concluidas, "concluidas")}

            {/* Empty State */}
            {filteredTasks.length === 0 && (
              <div className="text-center py-20 bg-zinc-900/10 border border-dashed border-white/[0.04] rounded-2xl p-6 max-w-[500px] mx-auto">
                <HelpCircle size={36} className="text-zinc-700 mx-auto mb-3" />
                <h4 className="text-[14px] font-semibold text-zinc-400 mb-1">Nenhum aviso encontrado</h4>
                <p className="text-[12px] text-zinc-600 max-w-[320px] mx-auto mb-5">
                  Não encontramos tarefas que coincidam com sua busca ou filtros selecionados.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("todos");
                  }}
                  className="h-8 px-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-[12px] text-zinc-300 transition-all active:scale-95"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        )}

        {/* FAB / Botão Flutuante (Nova Tarefa) */}
        <button
          onClick={() => {
            if (tab === "geral" && !profile?.turma_id) {
              alert("Você precisa estar em uma turma para adicionar avisos gerais. Vá até a aba 'Turmas'!");
              return;
            }
            setShowCreateModal(true);
          }}
          className="fixed bottom-24 md:bottom-8 right-6 lg:right-8 w-14 h-14 rounded-full bg-gradient-to-r from-[#7A8F6B] to-[#9EBF8A] flex items-center justify-center shadow-2xl shadow-[#7A8F6B]/30 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer"
          title="Criar nova tarefa/aviso"
        >
          <Plus size={26} className="text-zinc-950 font-bold" />
        </button>
      </div>

      {/* Modal de Criação */}
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
