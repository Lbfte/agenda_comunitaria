import { useState, useEffect, useCallback, useRef } from 'react';
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

  const userRef = useRef(user);
  const activeFetchRef = useRef<AbortController | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    return () => {
      if (activeFetchRef.current) {
        activeFetchRef.current.abort();
      }
    };
  }, []);

  const fetchHistory = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    const cacheKey = `history_mentions_${currentUser.id}`;
    
    // Tentar obter dados em cache antes de mostrar o spinner de loading (Padrão SWR)
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (cached.entries && cached.mentions) {
          setEntries(cached.entries);
          setMentions(cached.mentions);
          setLoading(false); // UI renderiza na hora se tiver cache
        }
      } catch (e) {
        console.error('Falha ao ler cache de histórico', e);
      }
    }
    
    // Se não há cache, o loading inicia ou continua
    if (!cachedStr) {
      setLoading(true);
    }

    if (activeFetchRef.current) {
      activeFetchRef.current.abort();
    }
    const controller = new AbortController();
    activeFetchRef.current = controller;

    try {
      // Buscar histórico com perfil do autor
      const { data: historyData, error: historyError } = await supabase
        .from('history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
        .abortSignal(controller.signal);

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
        .in('id', userIds)
        .abortSignal(controller.signal);

      const profileMap = new Map(
        (profiles || []).map((p) => [p.id, p])
      );

      const enriched: HistoryEntryWithProfile[] = (historyData || []).map((h) => ({
        ...h,
        profile: profileMap.get(h.user_id) || null,
      }));

      // Buscar menções do usuário
      const { data: mentionData } = await supabase
        .from('mentions')
        .select('*')
        .eq('mentioned_user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .abortSignal(controller.signal);

      let enrichedMentions: MentionWithContext[] = [];

      if (mentionData && mentionData.length > 0) {
        const historyIds = mentionData.map((m) => m.history_id);
        const { data: relatedHistory } = await supabase
          .from('history')
          .select('*')
          .in('id', historyIds)
          .abortSignal(controller.signal);

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
          .in('id', mentionerIds)
          .abortSignal(controller.signal);

        const mentionerMap = new Map(
          (mentionerProfiles || []).map((p) => [p.id, p])
        );

        enrichedMentions = mentionData.map((m) => {
          const hist = histMap.get(m.history_id);
          return {
            ...m,
            history: hist || null,
            mentioner: hist ? mentionerMap.get(hist.user_id) || null : null,
          };
        });
      }
      
      // Atualizar React State
      setEntries(enriched);
      setMentions(enrichedMentions);
      
      // Atualizar Cache LocalStorage
      localStorage.setItem(cacheKey, JSON.stringify({
        entries: enriched,
        mentions: enrichedMentions,
        timestamp: Date.now()
      }));

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Erro inesperado ao buscar histórico/menções:', err);
    } finally {
      if (activeFetchRef.current === controller) {
        activeFetchRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser) return;

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
  }, [fetchHistory]);

  return {
    entries,
    mentions,
    loading,
    refresh: fetchHistory,
  };
}
