import { useState } from "react";
import { PageHeader } from "./PageHeader";
import { useAuth } from "../contexts/AuthContext";
import { useHistory } from "../hooks/useHistory";

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
  const [tab, setTab] = useState<"geral" | "pessoal">("geral");
  const { profile } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "Usuário";
  const { entries, mentions, loading } = useHistory();

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

  return (
    <div className="flex-1 flex flex-col pb-24 md:pb-6 overflow-auto">
      <PageHeader tab={tab} onTabChange={setTab} />

      {/* Greeting */}
      <div className="px-7 mb-5">
        <h2 className="text-[16px] lg:text-[20px] text-white">Olá, {firstName}!</h2>
        <p className="text-[14px] text-[#707070]">
          você está em "Notificações: Ciencias da Comp"
        </p>
      </div>

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
