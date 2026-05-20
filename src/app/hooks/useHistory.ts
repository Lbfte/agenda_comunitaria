import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { HistoryEntry, Mention, Profile } from '@/lib/database.types';

export interface HistoryEntryWithProfile extends HistoryEntry {
  profile?: Pick<Profile, 'full_name' | 'initials' | 'color'> | null;
}

export interface MentionWithContext {
  id: string;
  mentioned_user_id: string;
  history_id: string;
  created_at: string;
  history?: HistoryEntry | null;
  mentioner?: Pick<Profile, 'full_name' | 'initials' | 'color'> | null;
}

export function useHistory() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<HistoryEntryWithProfile[]>([]);
  const [mentions, setMentions] = useState<MentionWithContext[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Buscar histórico com perfil do autor
    const { data: historyData, error: historyError } = await supabase
      .from('history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      console.error('Erro ao buscar histórico:', historyError.message);
      setLoading(false);
      return;
    }

    // Buscar perfis dos autores
    const userIds = [...new Set((historyData || []).map((h) => h.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, initials, color')
      .in('id', userIds);

    const profileMap = new Map(
      (profiles || []).map((p) => [p.id, p])
    );

    const enriched: HistoryEntryWithProfile[] = (historyData || []).map((h) => ({
      ...h,
      profile: profileMap.get(h.user_id) || null,
    }));

    setEntries(enriched);

    // Buscar menções do usuário
    const { data: mentionData } = await supabase
      .from('mentions')
      .select('*')
      .eq('mentioned_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (mentionData && mentionData.length > 0) {
      const historyIds = mentionData.map((m) => m.history_id);
      const { data: relatedHistory } = await supabase
        .from('history')
        .select('*')
        .in('id', historyIds);

      const histMap = new Map(
        (relatedHistory || []).map((h) => [h.id, h])
      );

      // Buscar perfis dos mencionadores
      const mentionerIds = [...new Set(
        (relatedHistory || []).map((h) => h.user_id)
      )];
      const { data: mentionerProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, initials, color')
        .in('id', mentionerIds);

      const mentionerMap = new Map(
        (mentionerProfiles || []).map((p) => [p.id, p])
      );

      const enrichedMentions: MentionWithContext[] = mentionData.map((m) => {
        const hist = histMap.get(m.history_id);
        return {
          ...m,
          history: hist || null,
          mentioner: hist ? mentionerMap.get(hist.user_id) || null : null,
        };
      });

      setMentions(enrichedMentions);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('history-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'history' },
        () => {
          fetchHistory(); // Refresh ao receber nova entrada
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchHistory]);

  return {
    entries,
    mentions,
    loading,
    refresh: fetchHistory,
  };
}
