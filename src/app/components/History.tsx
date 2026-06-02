"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "./layout/PageHeader";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "../hooks/useHistory";
import { RefreshCw, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";

const actionLabels: Record<string, string> = {
  add: "adicionou",
  edit: "editou",
  delete: "removeu",
  complete: "concluiu",
};

const actionColors: Record<string, string> = {
  add: "#7A8F6B",
  edit: "#5B8DEF",
  delete: "#E85D5D",
  complete: "#E8C84A",
};

export function History() {
  const router = useRouter();
  const { profile, userTurmas, refreshProfile, user } = useAuth();
  const [viewTurmaId, setViewTurmaId] = useState<string>("all");
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const { entries, mentions, loading } = useHistory(viewTurmaId);

  // Estados para onboarding e solicitação pendente
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Buscar solicitação pendente
  useEffect(() => {
    if (!user || profile?.turma_id) return;
    const userId = user.id;

    async function checkPendingRequest() {
      setOnboardingLoading(true);
      setOnboardingError(null);
      try {
        const { data, error } = await supabase
          .from("turma_requests")
          .select("*, turmas(name)")
          .eq("user_id", userId)
          .eq("status", "pending")
          .maybeSingle();

        if (error) {
          console.error("Erro ao buscar solicitações:", error);
        } else {
          setActiveRequest(data);
        }
      } catch (err) {
        console.error("Erro inesperado no checkPendingRequest:", err);
      } finally {
        setOnboardingLoading(false);
      }
    }

    checkPendingRequest();
  }, [user, profile?.turma_id]);

  const handleCheckStatus = async () => {
    setOnboardingLoading(true);
    await refreshProfile();
    setOnboardingLoading(false);
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
      }
    } catch (err: any) {
      setOnboardingError(err.message || "Erro ao cancelar solicitação.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const lastEntry = entries[0];
  const lastDate = lastEntry
    ? `${formatDate(lastEntry.created_at)} - ${formatTime(lastEntry.created_at)}`
    : "--";

  const activeTurmaName = viewTurmaId === "all" 
    ? "Todas as Turmas" 
    : userTurmas?.find(t => t.id === viewTurmaId)?.name || "Carregando...";

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader 
        tab="geral" 
        onTabChange={() => {}} 
        hideTabs={true} 
        viewTurmaId={viewTurmaId} 
        setViewTurmaId={setViewTurmaId} 
      />

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] lg:text-[20px] text-white">Olá, {firstName}!</h2>
        <p className="text-[14px] text-[#707070]">
          você está em "Notificações: {activeTurmaName}"
        </p>
      </div>

      {/* Alerta de solicitação de turma ou falta de turma no topo */}
      {!profile?.turma_id && user?.email !== "morcegosnaodormem@gmail.com" && (
        <div className="px-7 mb-6">
          <AnimatePresence mode="wait">
            {onboardingLoading ? (
              <div className="p-5 rounded-2xl border border-white/[0.06] bg-zinc-900/30 backdrop-blur-md flex items-center gap-3">
                <RefreshCw size={16} className="animate-spin text-[#7A8F6B]" />
                <span className="text-[13px] text-zinc-400">Verificando solicitações...</span>
              </div>
            ) : activeRequest ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl border border-yellow-500/10 bg-yellow-500/[0.02] backdrop-blur-md shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                    <RefreshCw size={20} className="text-yellow-400 animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[15px] font-semibold text-white">Solicitação de Entrada Pendente</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                      Você enviou uma solicitação para a turma <strong className="text-yellow-400">{activeRequest.turmas?.name}</strong>. Ela está aguardando a aprovação do administrador.
                    </p>
                    {onboardingError && (
                      <p className="text-[12px] text-red-400 mt-2 font-medium">{onboardingError}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleCheckStatus}
                    disabled={requestSubmitting}
                    className="h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] font-semibold text-[13px] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-[#7A8F6B]/10"
                  >
                    <RefreshCw size={12} className={requestSubmitting ? "animate-spin" : ""} />
                    <span>Verificar Status</span>
                  </button>

                  <button
                    onClick={handleCancelRequest}
                    disabled={requestSubmitting}
                    className="h-10 px-4 rounded-xl flex items-center justify-center border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-medium text-[13px] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    <span>Cancelar</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-6 rounded-3xl border border-white/[0.06] bg-zinc-900/60 backdrop-blur-md shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7A8F6B]/15 flex items-center justify-center shrink-0">
                    <Calendar size={20} className="text-[#9EBF8A]" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[15px] font-semibold text-white">Nenhuma Turma Conectada</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">
                      Para visualizar cronogramas de turmas, tarefas acadêmicas integradas e participar do chat social geral, você precisa estar em uma turma.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/turmas")}
                  className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] font-semibold text-[13px] transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-[#7A8F6B]/10 shrink-0"
                >
                  <span>Entrar em uma Turma</span>
                  <ArrowRight size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Header */}
      <div className="px-7 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="h-[30px] px-4 rounded-[3px] flex items-center"
            style={{ background: "rgba(114,114,114,0.19)" }}
          >
            <span className="text-[14px] text-white">Últimas alterações</span>
          </div>
          <span className="text-[13px] text-[rgba(255,255,255,0.37)]">{lastDate}</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-[#333] border-t-[#7A8F6B] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 lg:px-7">
          {/* Timeline */}
          <div className="px-7 lg:px-0 mb-6">
            {entries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[14px] text-[#555]">Nenhuma alteração registrada ainda</p>
              </div>
            ) : (
              <div className="relative pl-6">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[#333]" />

                {entries.map((entry) => {
                  const color = entry.profile?.color || actionColors[entry.action] || "#666";
                  return (
                    <div key={entry.id} className="relative flex items-center gap-3 mb-6">
                      {/* Dot */}
                      <div className="absolute -left-6 w-[22px] h-[22px] rounded-full border-2 border-[#333] bg-[#1E1E1E] flex items-center justify-center z-10">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: actionColors[entry.action] || color }}
                        />
                      </div>

                      {/* Avatar */}
                      <div
                        className="w-[30px] h-[28px] rounded-full flex items-center justify-center shrink-0 ml-2"
                        style={{ background: color }}
                      >
                        <span className="text-[10px] text-white">
                          {entry.profile?.initials || "?"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12px] text-white">
                            {entry.profile?.full_name || "Usuário"}
                          </span>
                          <span
                            className="text-[11px] px-1.5 py-0.5 rounded"
                            style={{
                              color: actionColors[entry.action],
                              background: `${actionColors[entry.action]}15`,
                            }}
                          >
                            {actionLabels[entry.action] || entry.action}
                          </span>
                          <span className="text-[11px] text-[rgba(255,255,255,0.3)]">
                            {entry.entity_type}
                          </span>
                        </div>
                        {entry.description && (
                          <p className="text-[12px] text-[rgba(255,255,255,0.37)] mt-0.5 truncate">
                            {entry.description}
                          </p>
                        )}
                        <p className="text-[10px] text-[#444] mt-0.5">
                          {formatDate(entry.created_at)} às {formatTime(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mentions Section */}
          <div className="px-7 lg:px-0 mb-4">
            <div className="rounded-[8px] p-5" style={{ background: "rgba(58,58,58,0.25)" }}>
              <h3 className="text-[16px] text-white mb-4">Menções</h3>
              <div className="h-[1px] bg-[#333] mb-4" />

              {mentions.length === 0 ? (
                <p className="text-[13px] text-[#555] text-center py-4">
                  Nenhuma menção para você
                </p>
              ) : (
                mentions.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 mb-4 last:mb-0 flex-wrap">
                    <span
                      className="text-[12px] text-white px-3 py-1.5 rounded-lg shrink-0"
                      style={{
                        background: "rgba(122,143,107,0.25)",
                        border: "1px solid rgba(122,143,107,0.3)",
                      }}
                    >
                      @{m.mentioner?.full_name || "Alguém"}
                    </span>
                    <span className="text-[12px] text-[rgba(255,255,255,0.5)]">
                      {m.history?.action ? actionLabels[m.history.action] : "mencionou você em"}
                    </span>
                    <span className="text-[12px] text-white truncate">
                      {m.history?.description || ""}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
