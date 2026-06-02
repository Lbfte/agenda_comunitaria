import { useState } from "react";
import { syncAllWithGoogleCalendar } from "@/lib/sync-engine";

export function useGoogleCalendarSync(userId: string | undefined, onSyncComplete?: () => void) {
  const [syncingGCal, setSyncingGCal] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const handleSyncGCal = async () => {
    if (!userId) return;
    setSyncingGCal(true);
    setSyncMessage(null);

    try {
      const result = await syncAllWithGoogleCalendar(userId);
      if (result.success) {
        setSyncMessage(`Agenda integrada! ${result.syncedCount} evento(s) adicionado(s)/removido(s).`);
        setTimeout(() => setSyncMessage(null), 5000);
        if (onSyncComplete) onSyncComplete();
      } else {
        setSyncMessage(`Erro de sincronização: ${result.error || "Tente novamente."}`);
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (err) {
      console.error(err);
      setSyncMessage("Erro inesperado na conexão com o Google.");
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setSyncingGCal(false);
    }
  };

  return { syncingGCal, syncMessage, handleSyncGCal };
}
