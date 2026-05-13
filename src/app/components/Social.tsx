import { useState, useRef, useEffect } from "react";
import { Send, Hash, Lock } from "lucide-react";
import { AppLogo } from "./AppLogo";

type Message = { id: number; user: string; text: string; time: string; self?: boolean };

const classMessages: Message[] = [
  { id: 1, user: "Ana", text: "Alguém já começou o projeto de Algoritmos?", time: "10:30" },
  { id: 2, user: "Carlos", text: "Sim! Estou na parte de grafos.", time: "10:32" },
  { id: 3, user: "Você", text: "Posso ajudar com a documentação!", time: "10:35", self: true },
  { id: 4, user: "Maria", text: "Ótimo! Vamos criar um grupo no GitHub.", time: "10:37" },
  { id: 5, user: "Lucas", text: "Lembrem que a entrega é sexta 23:59 ⚠️", time: "10:40" },
];

const privateMessages: Message[] = [
  { id: 1, user: "Você", text: "Preciso revisar Cálculo antes da prova", time: "09:00", self: true },
  { id: 2, user: "Você", text: "Focar nos capítulos 3 e 4", time: "09:01", self: true },
  { id: 3, user: "Nota", text: "📚 Buscar livro na biblioteca amanhã", time: "14:20" },
];

const userColors: Record<string, string> = {
  Ana: "#E85D5D", Carlos: "#5B8DEF", Maria: "#E8C84A", Lucas: "#7A8F6B", Nota: "#C77DFF",
};

export function Social() {
  const [channel, setChannel] = useState<"class" | "private">("class");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState({ class: classMessages, private: privateMessages });
  const scrollRef = useRef<HTMLDivElement>(null);

  const current = messages[channel];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [current.length]);

  const send = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now(), user: "Você", text: input,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      self: true,
    };
    setMessages({ ...messages, [channel]: [...current, msg] });
    setInput("");
  };

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-hidden">
      {/* Top */}
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        <AppLogo size={28} />
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
      <div ref={scrollRef} className="flex-1 overflow-auto px-7 space-y-3 mb-3">
        {current.map((m) => (
          <div key={m.id} className={`flex ${m.self ? "justify-end" : "justify-start"}`}>
            <div
              className="max-w-[80%] rounded-[12px] px-4 py-2.5"
              style={{
                background: m.self ? "rgba(122,143,107,0.2)" : "rgba(42,42,42,0.6)",
                borderBottomRightRadius: m.self ? "4px" : undefined,
                borderBottomLeftRadius: !m.self ? "4px" : undefined,
              }}
            >
              {!m.self && (
                <span className="text-[10px] block mb-1" style={{ color: userColors[m.user] || "#7A8F6B" }}>
                  {m.user}
                </span>
              )}
              <p className="text-[13px] text-white leading-relaxed">{m.text}</p>
              <span className="text-[9px] text-[#666] block text-right mt-1">{m.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={channel === "class" ? "Mensagem para a turma..." : "Nova anotação..."}
          className="flex-1 rounded-[12px] px-4 py-3 text-[13px] text-white placeholder-[#555] outline-none"
          style={{ background: "rgba(42,42,42,0.6)" }}
        />
        <button onClick={send} className="w-11 h-11 rounded-[12px] bg-[#7A8F6B] flex items-center justify-center active:scale-95 transition-transform">
          <Send size={15} className="text-white" />
        </button>
      </div>
    </div>
  );
}
