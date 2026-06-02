import { RefreshCw, Calendar } from "lucide-react";

interface GCalSyncButtonProps {
  onSync: () => void;
  isSyncing: boolean;
}

export function GCalSyncButton({ onSync, isSyncing }: GCalSyncButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className={`flex items-center justify-center gap-1.5 h-8 px-3 rounded-full text-[11px] font-semibold border backdrop-blur-md transition-all active:scale-95 ${
        isSyncing 
          ? "bg-amber-500/10 text-amber-500 border-amber-500/20 cursor-wait"
          : "bg-white/[0.03] text-zinc-400 border-white/[0.05] hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {isSyncing ? (
        <>
          <RefreshCw size={11} className="animate-spin" />
          Sincronizando...
        </>
      ) : (
        <>
          <Calendar size={11} />
          Sincronizar Agenda
        </>
      )}
    </button>
  );
}
