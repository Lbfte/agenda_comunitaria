"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, UserCheck, Clock, ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";

type RequestWithDetails = {
  id: string;
  user_id: string;
  turma_id: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    color: string | null;
    initials: string | null;
  } | null;
  turmas: {
    name: string;
  } | null;
};

export function AdminRequests() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("turma_requests")
        .select(`
          id,
          user_id,
          turma_id,
          status,
          created_at,
          profiles!user_id (
            full_name,
            avatar_url,
            color,
            initials
          ),
          turmas!turma_id (
            name
          )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar solicitações:", error);
        setMessage({ text: "Não foi possível carregar as solicitações.", type: "error" });
      } else if (data) {
        setRequests(data as any);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Ocorreu um erro inesperado.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();

    // Iniciar escuta em tempo real para novas solicitações
    const channel = supabase
      .channel('admin-requests-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'turma_requests' },
        () => {
          loadRequests(); // Recarregar a lista quando houver nova solicitação
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleApprove = async (request: RequestWithDetails) => {
    setProcessingId(request.id);
    setMessage(null);

    try {
      // 1. Atualizar o perfil do aluno com o turma_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ turma_id: request.turma_id })
        .eq("id", request.user_id);

      if (profileError) throw profileError;

      // 2. Inserir o aluno em turma_members
      const { error: memberError } = await supabase
        .from("turma_members")
        .insert({
          turma_id: request.turma_id,
          user_id: request.user_id,
          role: "member"
        });

      // Se der erro por já ser membro, tudo bem, prosseguimos para deletar a solicitação
      if (memberError && !memberError.message.includes("duplicate key")) {
        throw memberError;
      }

      // 3. Deletar a solicitação pendente
      const { error: deleteError } = await supabase
        .from("turma_requests")
        .delete()
        .eq("id", request.id);

      if (deleteError) throw deleteError;

      // Atualiza o estado local
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setMessage({
        text: `Solicitação de ${request.profiles?.full_name || "Estudante"} aprovada com sucesso!`,
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao aprovar solicitação: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: RequestWithDetails) => {
    setProcessingId(request.id);
    setMessage(null);

    try {
      // Deletar a solicitação pendente
      const { error: deleteError } = await supabase
        .from("turma_requests")
        .delete()
        .eq("id", request.id);

      if (deleteError) throw deleteError;

      // Atualiza o estado local
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setMessage({
        text: `Solicitação de ${request.profiles?.full_name || "Estudante"} rejeitada.`,
        type: "success"
      });
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: `Erro ao rejeitar solicitação: ${err.message || "Tente novamente."}`,
        type: "error"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

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
            <UserCheck className="text-[#9EBF8A]" size={22} />
            Solicitações de Entrada
          </h1>
          <p className="text-[13px] text-zinc-500 font-light">
            Gerencie novos alunos que solicitaram entrada nas turmas acadêmicas
          </p>
        </div>

        <button
          onClick={loadRequests}
          disabled={loading}
          className="ml-auto h-10 px-4 rounded-xl flex items-center gap-2 border border-white/[0.04] bg-zinc-900/20 hover:bg-zinc-900/40 text-[12px] font-medium text-zinc-400 hover:text-white cursor-pointer transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Atualizar</span>
        </button>
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
            {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
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

      {/* Lista de Solicitações */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw size={24} className="animate-spin text-[#7A8F6B]" />
          <span className="text-[13px] text-zinc-500">Carregando solicitações pendentes...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-24 border border-dashed border-white/[0.04] bg-zinc-900/10 rounded-3xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
            <UserCheck className="text-zinc-600" size={24} />
          </div>
          <h3 className="text-[15px] font-semibold text-zinc-300 mb-1">Tudo limpo por aqui!</h3>
          <p className="text-[13px] text-zinc-500 max-w-[280px]">
            Nenhuma solicitação pendente de aprovação no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4.5">
          <div className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider pl-2">
            Aguardando aprovação ({requests.length})
          </div>

          <div className="flex flex-col gap-3">
            {requests.map((req) => (
              <motion.div
                key={req.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-2xl border border-white/[0.04] bg-zinc-900/30 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/[0.08] transition-all"
              >
                {/* Detalhes do Aluno */}
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-[13px] text-white shadow-inner shrink-0"
                    style={{ background: req.profiles?.color || "#7A8F6B" }}
                  >
                    {req.profiles?.avatar_url ? (
                      <img
                        src={req.profiles.avatar_url}
                        alt={req.profiles.full_name || "Avatar"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      req.profiles?.initials || "ST"
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold text-white truncate">
                      {req.profiles?.full_name || "Estudante sem nome"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-zinc-500 font-light">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {formatDate(req.created_at)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-700 hidden sm:inline" />
                      <span className="text-[#9EBF8A] font-medium bg-[#7A8F6B]/10 px-2 py-0.5 rounded-full">
                        Turma: {req.turmas?.name || "Desconhecida"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processingId === req.id}
                    className="h-10 px-4 rounded-xl flex items-center gap-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-[12px] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    <X size={14} />
                    <span>Rejeitar</span>
                  </button>

                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processingId === req.id}
                    className="h-10 px-4 rounded-xl flex items-center gap-1.5 text-zinc-950 bg-[#7A8F6B] hover:bg-[#8da77c] text-[12px] font-semibold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-md shadow-[#7A8F6B]/10"
                  >
                    <Check size={14} />
                    <span>Aprovar</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
