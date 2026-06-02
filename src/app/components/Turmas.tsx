"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  GraduationCap, 
  Search, 
  Check, 
  Clock, 
  X, 
  AlertTriangle, 
  LogOut, 
  HelpCircle,
  ArrowLeft,
  RefreshCw,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ADMIN_EMAIL } from "@/lib/constants";

type Turma = {
  id: string;
  name: string;
  code: string;
  created_at: string;
};

type TurmaRequest = {
  id: string;
  turma_id: string;
  status: string;
};

export function Turmas() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [requests, setRequests] = useState<TurmaRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Modais
  const [replaceModalData, setReplaceModalData] = useState<{
    newTurmaId: string;
    newTurmaName: string;
    oldRequestId: string;
    oldTurmaName: string;
  } | null>(null);
  
  const [leaveModalData, setLeaveModalData] = useState<{
    turmaId: string;
    turmaName: string;
  } | null>(null);

  // Estados de criação de turma
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTurmaName, setNewTurmaName] = useState("");
  const [newTurmaCode, setNewTurmaCode] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Buscar todas as turmas
      const { data: turmasData, error: turmasError } = await (supabase as any)
        .from("turmas")
        .select("id, name, code, created_at")
        .order("name", { ascending: true });

      if (turmasError) throw turmasError;

      // 2. Buscar solicitações do usuário
      const { data: requestsData, error: requestsError } = await (supabase as any)
        .from("turma_requests")
        .select("id, turma_id, status")
        .eq("user_id", user.id);

      if (requestsError) throw requestsError;

      setTurmas(turmasData || []);
      setRequests(requestsData || []);
    } catch (err: any) {
      console.error("Erro ao carregar dados de turmas:", err);
      setMessage({ text: "Não foi possível carregar as turmas.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.id) {
      // Atualizar perfil ao montar para detectar aprovações do admin
      refreshProfile();
      loadData();
    }
  }, [user?.id]);

  // Listener Realtime: detecta quando o admin aprova e atualiza o turma_id do perfil
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('turmas-profile-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        () => {
          refreshProfile();
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Função para solicitar entrada na turma
  const handleRequestAccess = async (targetTurmaId: string, targetTurmaName: string) => {
    if (!user) return;
    setProcessingId(targetTurmaId);
    setMessage(null);

    try {
      // Verificar se o usuário já tem outra solicitação pendente ativa
      const pendingRequest = requests.find((r) => r.status === "pending");
      
      if (pendingRequest) {
        // Se a solicitação pendente for para a MESMA turma (caso raro de dessincronização de estado local)
        if (pendingRequest.turma_id === targetTurmaId) {
          setMessage({ text: "Você já possui uma solicitação pendente para esta turma.", type: "error" });
          setProcessingId(null);
          return;
        }

        // Buscar nome da turma da solicitação anterior para exibir no modal
        const oldTurma = turmas.find((t) => t.id === pendingRequest.turma_id);
        const oldTurmaName = oldTurma?.name || "Outra Turma";

        // Abrir modal de substituição de solicitação
        setReplaceModalData({
          newTurmaId: targetTurmaId,
          newTurmaName: targetTurmaName,
          oldRequestId: pendingRequest.id,
          oldTurmaName: oldTurmaName
        });
        setProcessingId(null);
        return;
      }

      // Enviar a nova solicitação
      const { data, error } = await (supabase as any)
        .from("turma_requests")
        .insert({
          user_id: user.id,
          turma_id: targetTurmaId,
          status: "pending"
        } as any)
        .select("id, turma_id, status")
        .single();

      if (error) throw error;

      if (data) {
        setRequests((prev) => [...prev, data]);
        setMessage({
          text: `Solicitação para entrar na turma "${targetTurmaName}" enviada com sucesso! Aguarde aprovação.`,
          type: "success"
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao enviar solicitação: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Substituir solicitação anterior pela nova
  const handleConfirmReplace = async () => {
    if (!user || !replaceModalData) return;
    const { newTurmaId, newTurmaName, oldRequestId } = replaceModalData;
    setProcessingId(newTurmaId);
    setReplaceModalData(null);
    setMessage(null);

    try {
      // 1. Deletar solicitação anterior
      const { error: deleteError } = await (supabase as any)
        .from("turma_requests")
        .delete()
        .eq("id", oldRequestId);

      if (deleteError) throw deleteError;

      // 2. Inserir a nova solicitação
      const { data: newRequest, error: insertError } = await (supabase as any)
        .from("turma_requests")
        .insert({
          user_id: user.id,
          turma_id: newTurmaId,
          status: "pending"
        } as any)
        .select("id, turma_id, status")
        .single();

      if (insertError) throw insertError;

      if (newRequest) {
        // Atualiza estado local removendo a antiga e adicionando a nova
        setRequests((prev) => prev.filter((r) => r.id !== oldRequestId).concat(newRequest));
        setMessage({
          text: `Solicitação anterior cancelada. Nova solicitação para "${newTurmaName}" enviada com sucesso!`,
          type: "success"
        });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao substituir solicitação: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Cancelar solicitação pendente
  const handleCancelRequest = async (requestId: string, turmaName: string) => {
    setProcessingId(requestId);
    setMessage(null);

    try {
      const { error } = await (supabase as any)
        .from("turma_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      // Remove localmente
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setMessage({
        text: `Solicitação para entrar na turma "${turmaName}" cancelada.`,
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao cancelar solicitação: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Sair da turma atual
  const handleConfirmLeave = async () => {
    if (!user || !profile?.turma_id || !leaveModalData) return;
    const { turmaId, turmaName } = leaveModalData;
    setProcessingId(turmaId);
    setLeaveModalData(null);
    setMessage(null);

    try {
      // 1. Remover do membro da turma
      const { error: memberError } = await (supabase as any)
        .from("turma_members")
        .delete()
        .eq("user_id", user.id)
        .eq("turma_id", turmaId);

      if (memberError) throw memberError;

      // 2. Limpar o turma_id no perfil do usuário
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .update({ turma_id: null } as any)
        .eq("id", user.id);

      if (profileError) throw profileError;

      // 3. Atualizar o perfil no contexto de Autenticação para propagar mudanças
      await refreshProfile();

      setMessage({
        text: `Você saiu da turma "${turmaName}" com sucesso.`,
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao sair da turma: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Criar nova turma
  const handleCreateTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!newTurmaName.trim() || !newTurmaCode.trim()) {
      setMessage({ text: "Por favor, preencha todos os campos.", type: "error" });
      return;
    }

    const cleanCode = newTurmaCode.trim().toUpperCase().replace(/\s+/g, "");

    setCreateSubmitting(true);
    setMessage(null);

    try {
      // 1. Inserir a nova turma no Supabase
      const { data: createdTurma, error: createError } = await (supabase as any)
        .from("turmas")
        .insert({
          name: newTurmaName.trim(),
          code: cleanCode,
          created_by: user.id
        } as any)
        .select()
        .single();

      if (createError) {
        if (createError.message.includes("duplicate key") || createError.code === "23505") {
          throw new Error("Já existe uma turma cadastrada com este código. Escolha outro.");
        }
        throw createError;
      }

      if (createdTurma) {
        // 2. Inserir em turma_members como admin
        const { error: memberError } = await (supabase as any)
          .from("turma_members")
          .insert({
            turma_id: createdTurma.id,
            user_id: user.id,
            role: "admin"
          } as any);

        if (memberError) throw memberError;

        // 3. Se NÃO for o administrador geral, associar a turma no perfil do próprio criador
        const isAdminGeral = user.email === ADMIN_EMAIL;
        if (!isAdminGeral) {
          const { error: profileError } = await (supabase as any)
            .from("profiles")
            .update({ turma_id: createdTurma.id } as any)
            .eq("id", user.id);

          if (profileError) throw profileError;

          // Atualizar o perfil localmente
          await refreshProfile();
        }

        setMessage({
          text: `Turma "${createdTurma.name}" criada com sucesso!`,
          type: "success"
        });

        // Limpar os campos e fechar o modal
        setNewTurmaName("");
        setNewTurmaCode("");
        setIsCreateModalOpen(false);

        // Recarregar os dados locais
        await loadData();
      }
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err.message || "Erro ao criar turma. Tente novamente.",
        type: "error"
      });
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Filtro de pesquisa
  const filteredTurmas = turmas.filter((t) => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col p-6 overflow-auto max-w-[1200px] mx-auto w-full pb-24 md:pb-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/")}
          className="h-10 w-10 rounded-xl flex items-center justify-center border border-white/[0.04] bg-zinc-900/30 hover:bg-zinc-900/60 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} className="text-zinc-400" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="text-[#9EBF8A]" size={24} />
            Turmas Disponíveis
          </h1>
          <p className="text-[13px] text-zinc-500 font-light">
            Explore as turmas cadastradas no sistema e solicite ingresso na sua turma acadêmica
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 rounded-xl flex items-center gap-2 bg-[#7A8F6B] hover:bg-[#8da77c] text-[12px] font-semibold text-zinc-950 cursor-pointer transition-colors shadow-md shadow-[#7A8F6B]/10 active:scale-95"
          >
            <Plus size={14} />
            <span>Criar Turma</span>
          </button>
          
          <button
            onClick={loadData}
            disabled={loading}
            className="h-10 px-4 rounded-xl flex items-center gap-2 border border-white/[0.04] bg-zinc-900/20 hover:bg-zinc-900/40 text-[12px] font-medium text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative mb-6">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search size={16} className="text-zinc-500" />
        </span>
        <input
          type="text"
          placeholder="Pesquisar por nome ou código da turma..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-11 pr-4 rounded-2xl bg-zinc-900/30 border border-white/[0.04] hover:border-white/[0.08] focus:border-[#7A8F6B]/40 focus:ring-1 focus:ring-[#7A8F6B]/40 text-[13px] text-white placeholder-zinc-500 transition-all outline-none"
        />
      </div>

      {/* Alertas / Mensagens */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl mb-6 border flex items-center gap-3 ${
              message.type === "success"
                ? "bg-[#7A8F6B]/10 border-[#7A8F6B]/20 text-[#9EBF8A]"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.type === "success" ? <Check size={16} /> : <X size={16} />}
            <span className="text-[13px] font-medium">{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-zinc-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo Principal */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="animate-spin text-[#7A8F6B]" />
          <span className="text-[13px] text-zinc-500">Carregando turmas...</span>
        </div>
      ) : filteredTurmas.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 border border-dashed border-white/[0.04] bg-zinc-900/10 rounded-3xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <GraduationCap className="text-zinc-600" size={24} />
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-300 mb-1">Nenhuma turma encontrada</h3>
          <p className="text-[13px] text-zinc-500 max-w-[320px] mx-auto">
            {searchQuery ? "Nenhuma turma corresponde à sua pesquisa de filtro." : "Ainda não existem turmas cadastradas no sistema."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTurmas.map((turma) => {
            const isMember = profile?.turma_id === turma.id;
            const request = requests.find((r) => r.turma_id === turma.id);
            const isPending = request?.status === "pending";

            return (
              <motion.div
                key={turma.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl border border-white/[0.04] bg-zinc-900/20 backdrop-blur-md flex flex-col justify-between gap-5 hover:border-white/[0.08] transition-all relative overflow-hidden group"
              >
                {/* Indicador de Minha Turma */}
                {isMember && (
                  <div className="absolute top-0 right-0 h-[24px] px-3 bg-[#7A8F6B] text-zinc-950 font-bold text-[10px] uppercase tracking-wider flex items-center rounded-bl-xl">
                    Sua Turma
                  </div>
                )}

                {/* Info da Turma */}
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-zinc-900/80 flex items-center justify-center shrink-0 border border-white/[0.04] text-zinc-400 group-hover:text-[#9EBF8A] group-hover:border-[#7A8F6B]/20 transition-all">
                    <GraduationCap size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-white group-hover:text-white/95 transition-colors line-clamp-1">
                      {turma.name}
                    </h3>
                    <p className="text-[11px] text-zinc-500 mt-1 font-mono uppercase">
                      Cód: <span className="text-zinc-400 font-semibold">{turma.code}</span>
                    </p>
                  </div>
                </div>

                {/* Status e Botão de Ação */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/[0.02]">
                  {/* Status Badge */}
                  <div>
                    {isMember ? (
                      <span className="text-[11px] font-semibold text-[#9EBF8A] bg-[#7A8F6B]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={12} /> Ativo
                      </span>
                    ) : isPending ? (
                      <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={12} /> Pendente
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-600 font-light flex items-center gap-1">
                        <HelpCircle size={12} /> Não associado
                      </span>
                    )}
                  </div>

                  {/* Ações */}
                  <div>
                    {isMember ? (
                      <button
                        onClick={() => setLeaveModalData({ turmaId: turma.id, turmaName: turma.name })}
                        disabled={processingId === turma.id}
                        className="h-8 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[11px] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <LogOut size={12} />
                        <span>Sair</span>
                      </button>
                    ) : isPending ? (
                      <button
                        onClick={() => handleCancelRequest(request.id, turma.name)}
                        disabled={processingId === request.id || processingId === turma.id}
                        className="h-8 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[11px] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <X size={12} />
                        <span>Cancelar</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestAccess(turma.id, turma.name)}
                        disabled={processingId === turma.id}
                        className="h-8 px-3 rounded-lg text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] text-[11px] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md shadow-[#7A8F6B]/10 flex items-center gap-1"
                      >
                        <GraduationCap size={12} />
                        <span>Entrar</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal de Substituição de Solicitação */}
      <AnimatePresence>
        {replaceModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[420px] rounded-3xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4 text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-white mb-2">
                Substituir solicitação pendente?
              </h3>
              <p className="text-[13px] text-zinc-400 font-light mb-6 leading-relaxed">
                Você já possui um pedido ativo para entrar na turma <strong className="text-white font-medium">"{replaceModalData.oldTurmaName}"</strong>. 
                Ao prosseguir, essa solicitação anterior será cancelada e uma nova será aberta para <strong className="text-white font-medium">"{replaceModalData.newTurmaName}"</strong>.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReplaceModalData(null)}
                  className="flex-1 h-10 rounded-xl border border-white/[0.04] bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmReplace}
                  className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[12px] font-semibold transition-colors cursor-pointer shadow-lg shadow-amber-500/10"
                >
                  Sim, Substituir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação para Sair da Turma */}
      <AnimatePresence>
        {leaveModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[420px] rounded-3xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4 text-red-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-[16px] font-bold text-white mb-2">
                Deseja mesmo sair desta turma?
              </h3>
              <p className="text-[13px] text-zinc-400 font-light mb-6 leading-relaxed">
                Você está prestes a sair da turma <strong className="text-white font-medium">"{leaveModalData.turmaName}"</strong>. 
                Ao fazer isso, você perderá acesso ao calendário acadêmico, tarefas e chats específicos desta turma. 
                Será necessário solicitar acesso novamente se quiser retornar.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLeaveModalData(null)}
                  className="flex-1 h-10 rounded-xl border border-white/[0.04] bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  onClick={handleConfirmLeave}
                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white text-[12px] font-semibold transition-colors cursor-pointer shadow-lg shadow-red-600/10"
                >
                  Confirmar e Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Criação de Turma */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] rounded-3xl border border-white/[0.06] bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <GraduationCap className="text-[#9EBF8A]" size={20} />
                  Criar Nova Turma
                </h3>
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewTurmaName("");
                    setNewTurmaCode("");
                  }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTurma} className="space-y-4">
                {/* Nome da Turma */}
                <div>
                  <label className="text-[12px] text-zinc-400 block mb-1">Nome da Turma *</label>
                  <input
                    type="text"
                    required
                    value={newTurmaName}
                    onChange={(e) => setNewTurmaName(e.target.value)}
                    placeholder="Ex: Ciência da Computação"
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] focus:border-[#7A8F6B]/40 focus:ring-1 focus:ring-[#7A8F6B]/40 text-[13px] text-white placeholder-zinc-500 transition-all outline-none"
                    autoFocus
                  />
                </div>

                {/* Código da Turma */}
                <div>
                  <label className="text-[12px] text-zinc-400 block mb-1">
                    Código de Convite (Sem espaços, único) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTurmaCode}
                    onChange={(e) => setNewTurmaCode(e.target.value)}
                    placeholder="Ex: CC-2026"
                    className="w-full h-11 px-4 rounded-xl bg-zinc-900 border border-white/[0.06] hover:border-white/[0.1] focus:border-[#7A8F6B]/40 focus:ring-1 focus:ring-[#7A8F6B]/40 text-[13px] text-white placeholder-zinc-500 transition-all outline-none uppercase"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1 font-light leading-relaxed">
                    O código será salvo automaticamente em letras maiúsculas e servirá para outros alunos solicitarem ingresso.
                  </p>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setNewTurmaName("");
                      setNewTurmaCode("");
                    }}
                    className="flex-1 h-11 rounded-xl border border-white/[0.04] bg-zinc-900/40 hover:bg-zinc-900/60 text-zinc-400 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting}
                    className="flex-1 h-11 rounded-xl bg-[#7A8F6B] hover:bg-[#8da77c] text-zinc-950 text-[12px] font-bold transition-colors cursor-pointer shadow-lg shadow-[#7A8F6B]/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    {createSubmitting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Plus size={14} />
                    )}
                    <span>Criar e Entrar</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
