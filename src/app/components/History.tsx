import { useState } from "react";
import { AppLogo } from "./AppLogo";

type LogEntry = {
  user: string;
  initials: string;
  color: string;
  action: string;
  date: string;
  detail: string;
};

const logs: LogEntry[] = [
  { user: "Laís Bembo", initials: "LB", color: "#8F6B8A", action: "add em", date: "20/03", detail: "Prova" },
  { user: "Albert William", initials: "AW", color: "#7A8F6B", action: "alt em", date: "20/03", detail: "Prova de..." },
  { user: "Albert William", initials: "AW", color: "#7A8F6B", action: "add em", date: "27/03", detail: "Programaçã..." },
  { user: "Laís Bembo", initials: "LB", color: "#8F6B8A", action: "del em", date: "21/03", detail: "evento n sei" },
];

type Mention = {
  user: string;
  action: string;
  target: string;
};

const mentions: Mention[] = [
  { user: "@Laís Bembo", action: "Marcou você em", target: '"Prova"' },
  { user: "@Prof Renato", action: "Marcou todos em", target: '"entreg"...' },
];

export function History() {
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");

  return (
    <div className="flex-1 flex flex-col pb-24 overflow-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 pt-7 pb-2">
        <AppLogo size={28} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("pessoal")}
            className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
              tab === "pessoal"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-[rgba(255,255,255,0.14)]"
            }`}
          >
            Pessoal
          </button>
          <button
            onClick={() => setTab("geral")}
            className={`h-[33px] px-5 rounded-2xl text-[14px] transition-all border ${
              tab === "geral"
                ? "bg-[#7A8F6B] border-[#7A8F6B] text-white"
                : "bg-[rgba(58,58,58,0.35)] border-[#3a3a3a] text-white"
            }`}
          >
            Geral
          </button>
        </div>
      </div>
      <div className="mx-4 h-[1px] bg-[#222] mb-6" />

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] text-white">Olá, Nome!</h2>
        <p className="text-[14px] text-[#707070]">
          você está em "Notificações: Ciencias da Comp"
        </p>
      </div>

      {/* Header */}
      <div className="px-7 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-[30px] px-4 rounded-[3px] flex items-center" style={{ background: "rgba(114,114,114,0.19)" }}>
            <span className="text-[14px] text-white">Ultimas alterações</span>
          </div>
          <span className="text-[13px] text-[rgba(255,255,255,0.37)]">18/03 - 0:45</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-7 mb-6">
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-[#333]" />

          {logs.map((log, i) => (
            <div key={i} className="relative flex items-center gap-3 mb-6">
              {/* Dot on timeline */}
              <div className="absolute -left-6 w-[22px] h-[22px] rounded-full border-2 border-[#333] bg-[#1E1E1E] flex items-center justify-center z-10">
                <div className="w-2 h-2 rounded-full" style={{ background: log.color }} />
              </div>

              {/* Avatar */}
              <div
                className="w-[30px] h-[28px] rounded-full flex items-center justify-center shrink-0 ml-2"
                style={{ background: log.color }}
              >
                <span className="text-[10px] text-white">{log.initials}</span>
              </div>

              {/* Content */}
              <span className="text-[12px] text-white">{log.user}</span>
              <span className="text-[12px] text-[rgba(255,255,255,0.37)]">
                {log.action} {log.date} - {log.detail}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mentions Section */}
      <div className="px-7 mb-4">
        <div className="rounded-[8px] p-5" style={{ background: "rgba(58,58,58,0.25)" }}>
          <h3 className="text-[16px] text-white mb-4">Menções</h3>
          <div className="h-[1px] bg-[#333] mb-4" />

          {mentions.map((m, i) => (
            <div key={i} className="flex items-center gap-2 mb-4 last:mb-0">
              <span
                className="text-[12px] text-white px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(122,143,107,0.25)", border: "1px solid rgba(122,143,107,0.3)" }}
              >
                {m.user}
              </span>
              <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{m.action}</span>
              <span className="text-[12px] text-white">{m.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
