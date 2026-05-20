import { useState, useRef, useEffect } from "react";
import { Send, Hash, Lock } from "lucide-react";
import { useMessages } from "../hooks/useMessages";

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

export function Social() {
  const [channel, setChannel] = useState<"class" | "private">("class");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, loading, sendMessage } = useMessages(channel);

  // Auto-scroll ao receber novas mensagens
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
    setInput("");
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-hidden">
      {/* Header with channel buttons */}
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        <div className="md:hidden">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="0" y="0" width="13" height="13" rx="5.85" fill="#FFFFD3" />
            <rect x="14" y="0" width="13" height="13" rx="5.85" fill="#3A3A3A" />
            <rect x="0" y="14" width="13" height="13" rx="5.85" fill="#7A8F6B" />
          </svg>
        </div>
        <div className="hidden md:block" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChannel("class")}
            className={`h-[33px] px-4 rounded-2xl text-[13px] transition-all border flex items-center gap-1.5 ${
              channel === "class"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.4)]"
            }`}
          >
            <Hash size={12} /> Turma
          </button>
          <button
            onClick={() => setChannel("private")}
            className={`h-[33px] px-4 rounded-2xl text-[13px] transition-all border flex items-center gap-1.5 ${
              channel === "private"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.4)]"
            }`}
          >
            <Lock size={12} /> Notas
          </button>
        </div>
      </div>
      <div className="mx-4 h-[1px] bg-[#222] mb-4" />

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-7 lg:px-12 space-y-3 mb-3">
        <div className="max-w-[720px] mx-auto space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#333] border-t-[#7A8F6B] rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[14px] text-[#555]">
                {channel === "class"
                  ? "Nenhuma mensagem na turma ainda. Seja o primeiro!"
                  : "Suas anotações pessoais aparecerão aqui."}
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.isSelf ? "justify-end" : "justify-start"}`}>
                <div className="flex gap-2 max-w-[80%] lg:max-w-[60%]">
                  {/* Avatar — left side for others */}
                  {!m.isSelf && (
                    <div
                      className="w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 mt-1"
                      style={{ background: m.profile?.color || getUserColor(m.profile?.full_name || "?") }}
                    >
                      <span className="text-[9px] text-white">{m.profile?.initials || "?"}</span>
                    </div>
                  )}
                  <div
                    className="rounded-[12px] px-4 py-2.5"
                    style={{
                      background: m.isSelf ? "rgba(122,143,107,0.2)" : "rgba(42,42,42,0.6)",
                      borderBottomRightRadius: m.isSelf ? "4px" : undefined,
                      borderBottomLeftRadius: !m.isSelf ? "4px" : undefined,
                    }}
                  >
                    {!m.isSelf && (
                      <span
                        className="text-[10px] block mb-1 font-medium"
                        style={{ color: m.profile?.color || getUserColor(m.profile?.full_name || "?") }}
                      >
                        {m.profile?.full_name || "Membro"}
                      </span>
                    )}
                    <p className="text-[13px] text-white leading-relaxed">{m.text}</p>
                    <span className="text-[9px] text-[#666] block text-right mt-1">
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
      <div className="px-5 lg:px-12 flex gap-2">
        <div className="flex gap-2 w-full max-w-[720px] mx-auto">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={channel === "class" ? "Mensagem para a turma..." : "Nova anotação..."}
            className="flex-1 rounded-[12px] px-4 py-3 text-[13px] text-white placeholder-[#555] outline-none"
            style={{ background: "rgba(42,42,42,0.6)" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-[12px] bg-[#7A8F6B] flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
          >
            <Send size={15} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
