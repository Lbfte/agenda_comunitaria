"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Hash, Lock, AlertCircle } from "lucide-react";
import { useMessages } from "../hooks/useMessages";
import { useAuth } from "../contexts/AuthContext";

const userColors: Record<string, string> = {};
const colorPalette = ["#E85D5D", "#5B8DEF", "#E8C84A", "#7A8F6B", "#C77DFF", "#FF8C42", "#6ECFBD"];
let colorIndex = 0;

function getUserColor(name: string): string {
  if (!userColors[name]) {
    userColors[name] = colorPalette[colorIndex % colorPalette.length];
    colorIndex++;
  }
  return userColors[name];
}

import { supabase } from "@/lib/supabase";

export function Social() {
  const [channel, setChannel] = useState<"class" | "private">("class");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useAuth();
  const isAdmin = user?.email === "morcegosnaodormem@gmail.com";
  
  const [adminTurmas, setAdminTurmas] = useState<{ id: string; name: string }[]>([]);
  const [selectedAdminTurmaId, setSelectedAdminTurmaId] = useState<string>("");

  useEffect(() => {
    if (isAdmin && user) {
      supabase
        .from("turmas")
        .select("id, name")
        .eq("created_by", user.id)
        .order("name", { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setAdminTurmas(data);
            setSelectedAdminTurmaId(data[0].id);
          }
        });
    }
  }, [isAdmin, user]);

  const activeTurmaId = isAdmin ? selectedAdminTurmaId : profile?.turma_id;
  const { messages, loading, sendMessage } = useMessages(channel, activeTurmaId);

  const hasNoTurma = channel === "class" && !activeTurmaId;

  // Auto-scroll ao receber novas mensagens ou mudar de canal
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, channel]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input, activeTurmaId);
    setInput("");
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-hidden">
      {/* Header with channel buttons */}
      <div className="flex flex-col px-6 pt-7 pb-3 gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-2xl bg-[#7A8F6B]/10 border border-[#7A8F6B]/20 flex items-center justify-center text-[#7A8F6B] shrink-0">
              {channel === "class" ? <Hash size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white leading-tight">
                {channel === "class" ? "Chat da Turma" : "Notas Pessoais"}
              </h2>
              <p className="text-[11px] text-[#707070] mt-0.5">
                {channel === "class"
                  ? "Compartilhado com seus colegas"
                  : "Bloco de notas privado"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setChannel("class")}
              className={`h-[32px] px-3.5 rounded-2xl text-[12px] font-medium transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                channel === "class"
                  ? "bg-[#7A8F6B] border-[#7A8F6B] text-white shadow-[0_0_12px_rgba(122,143,107,0.25)]"
                  : "bg-[rgba(58,58,58,0.25)] border-[#3a3a3a]/45 text-[rgba(255,255,255,0.4)] hover:text-white"
              }`}
            >
              <Hash size={11} /> Turma
            </button>
            <button
              onClick={() => setChannel("private")}
              className={`h-[32px] px-3.5 rounded-2xl text-[12px] font-medium transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                channel === "private"
                  ? "bg-[#7A8F6B] border-[#7A8F6B] text-white shadow-[0_0_12px_rgba(122,143,107,0.25)]"
                  : "bg-[rgba(58,58,58,0.25)] border-[#3a3a3a]/45 text-[rgba(255,255,255,0.4)] hover:text-white"
              }`}
            >
              <Lock size={11} /> Notas
            </button>
          </div>
        </div>

        {/* Informativo de privacidade da aba / Seletor do Admin */}
        {isAdmin && channel === "class" && adminTurmas.length > 0 ? (
          <div className="rounded-2xl p-4 text-[11px] backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border bg-zinc-900/40 border-[#7A8F6B]/20">
            <div>
              <p className="text-[12px] font-semibold text-white flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7A8F6B]" />
                Painel do Administrador Geral
              </p>
              <p className="text-[11px] text-zinc-500 font-light leading-relaxed">
                Você não está associado a nenhuma turma pessoalmente, mas tem acesso a todos os chats das turmas que criou.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <span className="text-[11px] text-zinc-400 font-medium">Chat Ativo:</span>
              <select
                value={selectedAdminTurmaId}
                onChange={(e) => setSelectedAdminTurmaId(e.target.value)}
                className="h-8 px-2.5 rounded-xl bg-zinc-950 border border-white/[0.06] hover:border-white/[0.1] text-[11px] text-zinc-300 font-medium focus:outline-none focus:border-[#7A8F6B]/40 cursor-pointer min-w-[140px]"
              >
                {adminTurmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="rounded-xl px-3.5 py-2 text-[11px] backdrop-blur-md flex items-center gap-2 border"
            style={{
              background: channel === "class" ? "rgba(91,141,239,0.03)" : "rgba(122,143,107,0.03)",
              borderColor: channel === "class" ? "rgba(91,141,239,0.08)" : "rgba(122,143,107,0.08)",
              color: channel === "class" ? "#8fb3f5" : "#acc59b",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: channel === "class" ? "#5B8DEF" : "#7A8F6B" }} />
            <p className="leading-relaxed">
              {channel === "class"
                ? "Mensagens públicas. Elas são visíveis para qualquer colega que pertença à sua mesma turma."
                : "Anotações pessoais. Tudo o que você escrever aqui fica guardado de forma totalmente privada e segura."}
            </p>
          </div>
        )}
      </div>
      <div className="mx-4 h-[1px] bg-[#222]/80 mb-3" />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-6 lg:px-12 space-y-3 mb-3">
        <div className="max-w-[720px] mx-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#222] border-t-[#7A8F6B] rounded-full animate-spin" />
            </div>
          ) : hasNoTurma ? (
            <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-[400px] mx-auto space-y-4">
              <div className="w-[54px] h-[54px] rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-1">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-[14px] font-semibold text-white">
                {isAdmin ? "Nenhuma Turma Criada" : "Sem Turma Associada"}
              </h3>
              <p className="text-[12px] text-[#666] leading-relaxed">
                {isAdmin
                  ? "Você entrou como Administrador Geral. Para interagir ou visualizar chats de turmas, primeiro crie uma turma na aba 'Turmas'."
                  : "Você ainda não está associado a nenhuma turma. Por favor, acesse a aba 'Turmas' para escolher uma turma e solicitar ingresso."}
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[13px] text-[#555]">
                {channel === "class"
                  ? "Nenhuma mensagem na turma ainda. Seja o primeiro!"
                  : "Sua folha de anotações está em branco. Comece a digitar abaixo!"}
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.isSelf ? "justify-end" : "justify-start"}`}>
                <div className="flex gap-2.5 max-w-[85%] lg:max-w-[70%]">
                  {/* Avatar — left side for others */}
                  {!m.isSelf && (
                    <div
                      className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-white/5 font-semibold text-white"
                      style={{ background: m.profile?.color || getUserColor(m.profile?.full_name || "?") }}
                    >
                      <span className="text-[10px] select-none">{m.profile?.initials || m.profile?.full_name?.charAt(0).toUpperCase() || "?"}</span>
                    </div>
                  )}
                  <div
                    className="rounded-2xl px-4 py-2.5 backdrop-blur-md border border-[#3a3a3a]/30 transition-all"
                    style={{
                      background: m.isSelf ? "rgba(122,143,107,0.12)" : "rgba(42,42,42,0.45)",
                      borderColor: m.isSelf ? "rgba(122,143,107,0.22)" : "rgba(58,58,58,0.4)",
                      borderBottomRightRadius: m.isSelf ? "4px" : undefined,
                      borderBottomLeftRadius: !m.isSelf ? "4px" : undefined,
                    }}
                  >
                    {!m.isSelf && (
                      <span
                        className="text-[11px] block mb-1 font-semibold"
                        style={{ color: m.profile?.color || getUserColor(m.profile?.full_name || "?") }}
                      >
                        {m.profile?.full_name || "Membro"}
                      </span>
                    )}
                    <p className="text-[13px] text-[rgba(255,255,255,0.85)] leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>
                    <span className="text-[9px] text-[#555] block text-right mt-1.5 font-medium select-none">
                      {formatTime(m.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Input */}
      {!hasNoTurma && (
        <div className="px-5 lg:px-12 flex gap-2">
          <div className="flex gap-2.5 w-full max-w-[720px] mx-auto items-center">
            <div className="relative flex-1 flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={channel === "class" ? "Mensagem para a turma..." : "Nova anotação pessoal..."}
                rows={1}
                className="w-full rounded-2xl pl-4 pr-12 py-3 text-[13px] text-white placeholder-[#555] outline-none border border-[#3a3a3a]/40 focus:border-[#7A8F6B]/40 focus:ring-1 focus:ring-[#7A8F6B]/20 transition-all resize-none max-h-[120px] min-h-[44px]"
                style={{ background: "rgba(42,42,42,0.35)", backdropFilter: "blur(8px)" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="absolute right-2 w-8 h-8 rounded-xl bg-[#7A8F6B] hover:bg-[#6b7e5d] text-white flex items-center justify-center active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 disabled:bg-[#7A8F6B]"
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

