import { Cloud, CloudOff, RefreshCw } from 'lucide-react';

interface SyncStatusBadgeProps {
  isOnline?: boolean;
  pendingCount?: number;
  syncStatus?: 'synced' | 'pending' | 'local';
}

/**
 * Badge visual de status de sincronização.
 * - Verde: Sincronizado
 * - Amarelo: Pendente (há itens na fila offline)
 * - Vermelho: Offline
 */
export function SyncStatusBadge({ isOnline, pendingCount, syncStatus }: SyncStatusBadgeProps) {
  // Inline badge para itens individuais
  if (syncStatus) {
    const config = {
      synced: { text: 'Sincronizado', color: '#7A8F6B', bg: 'rgba(122,143,107,0.15)' },
      pending: { text: 'Pendente', color: '#E8C84A', bg: 'rgba(232,200,74,0.15)' },
      local: { text: 'Local', color: '#E85D5D', bg: 'rgba(232,93,93,0.15)' },
    }[syncStatus];

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px]"
        style={{ color: config.color, background: config.bg }}
      >
        {syncStatus === 'synced' && <Cloud size={10} />}
        {syncStatus === 'local' && <CloudOff size={10} />}
        {syncStatus === 'pending' && <RefreshCw size={10} className="animate-spin" />}
        {config.text}
      </span>
    );
  }

  // Badge global de status
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex items-center gap-1.5 h-[26px] px-3 rounded-2xl text-[11px]"
        style={{
          background: isOnline ? 'rgba(122,143,107,0.15)' : 'rgba(232,93,93,0.15)',
          color: isOnline ? '#7A8F6B' : '#E85D5D',
        }}
      >
        {isOnline ? <Cloud size={12} /> : <CloudOff size={12} />}
        {isOnline ? 'Online' : 'Offline'}
      </div>
      {(pendingCount ?? 0) > 0 && (
        <div
          className="flex items-center gap-1.5 h-[26px] px-3 rounded-2xl text-[11px]"
          style={{ background: 'rgba(232,200,74,0.15)', color: '#E8C84A' }}
        >
          <RefreshCw size={12} className="animate-spin" />
          {pendingCount} pendente{(pendingCount ?? 0) > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
