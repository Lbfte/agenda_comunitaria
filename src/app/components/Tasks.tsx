"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "./layout/PageHeader";
import {
  Search, Check, Trash2, Plus, SlidersHorizontal, List, Grid,
  Calendar, RefreshCw, CheckCircle2, ChevronDown, AlertCircle,
  HelpCircle, Clock
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { KanbanBoard } from "./KanbanBoard";
import { CATEGORY_FILTERS, CATEGORY_COLORS } from "@/lib/constants";
import { useGoogleCalendarSync } from "../hooks/useGoogleCalendarSync";
import { useViewTurma } from "../hooks/useViewTurma";
import { GCalSyncButton } from "./shared/GCalSyncButton";
import { SyncNotification } from "./shared/SyncNotification";
import { CategoryFilter } from "./shared/CategoryFilter";
import { TaskRow } from "./shared/TaskRow";
import { TaskCard } from "./shared/TaskCard";
import { SyncStatusBadge } from "./shared/SyncStatusBadge";
import { TaskCreateModal, type TaskFormData } from "./modals/TaskCreateModal";
import { useTasks } from "../hooks/useTasks";

export function Tasks() {
  const [tab, setTab] = useState<"geral" | "pessoal">("pessoal");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user, profile, userTurmas } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";

  // Hook de Sincronização GCal
  const { syncingGCal, syncMessage, handleSyncGCal } = useGoogleCalendarSync(user?.id, () => fetchTasks());

  // Hook de Turma Ativa
  const { viewTurmaId, setViewTurmaId, activeTurmaName } = useViewTurma(profile?.turma_id, () => {
    if (tab === "geral") setTab("pessoal");
  });

  const { tasks, loading, error, isOnline, pendingCount, fetchTasks, createTask, completeTask, deleteTask } = useTasks(tab, viewTurmaId || undefined);

  // Novos Estados
  const [viewMode, setViewMode] = useState<"lista" | "cards" | "kanban">("lista");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("todos");
  
  // Controle de Abas Recolhidas (Collapsible sections)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    concluidas: true // Por padrão, as concluídas começam recolhidas
  });


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
        if (categoryFilter === "provas" && t.shape_color !== CATEGORY_COLORS.provas) return false;
        if (categoryFilter === "trabalhos" && t.shape_color !== CATEGORY_COLORS.trabalhos) return false;
        if (categoryFilter === "atividades" && t.shape_color !== CATEGORY_COLORS.atividades) return false;
        if (categoryFilter === "avisos" && !CATEGORY_COLORS.avisos.includes(t.shape_color as any)) return false;
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
                    <TaskRow key={t.id} task={t} isOnline={isOnline} onComplete={completeTask} onDelete={deleteTask} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                  {items.map((t) => (
                    <TaskCard key={t.id} task={t} isOnline={isOnline} onComplete={completeTask} onDelete={deleteTask} />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };


  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} viewTurmaId={viewTurmaId || undefined} setViewTurmaId={setViewTurmaId} hideGeral={!profile?.turma_id} />

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
            <GCalSyncButton onSync={handleSyncGCal} isSyncing={syncingGCal} />
            
            <SyncStatusBadge isOnline={isOnline} pendingCount={pendingCount} />
          </div>
        </div>

        <SyncNotification message={syncMessage} />
      </div>

      {/* Separator */}
      <div className="mx-7 h-[1px] bg-white/[0.04] mb-5" />

      {/* ─── Painel Superior: Barra de Busca, Alternador de View e Filtros ─── */}
      <div className="px-6 lg:px-7 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-zinc-900/30 border border-white/[0.04] p-4 rounded-2xl">
          {/* Input de Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 w-4.5 h-4.5" aria-hidden="true" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou descrição..."
              aria-label="Buscar tarefas por título ou descrição"
              className="w-full h-10 pl-11 pr-4 bg-zinc-950 border border-white/[0.04] focus:border-[#7A8F6B]/30 rounded-xl text-[13px] text-white placeholder-zinc-700 outline-none transition-all"
            />
          </div>

          {/* Filtro por Categoria rápido */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-medium mr-1 uppercase tracking-wider">Tipo:</span>
            <CategoryFilter currentFilter={categoryFilter} onFilterChange={setCategoryFilter} variant="tasks" />
          </div>

          {/* Alternador de Layout Lista / Cards */}
          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-auto border-t md:border-t-0 border-white/[0.04] pt-3 md:pt-0">
            <span className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider hidden sm:inline mr-1">Visualização:</span>
            <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-white/[0.04] relative">
              <button
                onClick={() => setViewMode("lista")}
                aria-label="Visualização em Lista"
                aria-pressed={viewMode === "lista"}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "lista" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Lista"
              >
                <List size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                aria-label="Visualização em Cards"
                aria-pressed={viewMode === "cards"}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "cards" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Cards"
              >
                <Grid size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                aria-label="Visualização Kanban"
                aria-pressed={viewMode === "kanban"}
                className={`h-8 w-10 flex items-center justify-center rounded-lg transition-all ${
                  viewMode === "kanban" ? "bg-[#7A8F6B] text-zinc-950" : "text-zinc-500 hover:text-white"
                }`}
                title="Modo Kanban"
              >
                <SlidersHorizontal size={15} aria-hidden="true" />
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
