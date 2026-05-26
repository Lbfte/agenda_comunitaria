import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Message, Profile } from '@/lib/database.types';

export interface MessageWithProfile extends Message {
  profile?: Pick<Profile, 'full_name' | 'initials' | 'color'> | null;
  isSelf: boolean;
}

export function useMessages(channel: 'class' | 'private', turmaId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<MessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const profileCache = useRef(new Map<string, Pick<Profile, 'full_name' | 'initials' | 'color'>>());

  const enrichMessages = useCallback(async (msgs: Message[]): Promise<MessageWithProfile[]> => {
    // Buscar perfis que ainda não estão no cache
    const missingIds = [...new Set(msgs.map((m) => m.user_id))]
      .filter((id) => !profileCache.current.has(id));

    if (missingIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, initials, color')
        .in('id', missingIds);

      (profiles || []).forEach((p) => {
        profileCache.current.set(p.id, p);
      });
    }

    return msgs.map((m) => ({
      ...m,
      profile: profileCache.current.get(m.user_id) || null,
      isSelf: m.user_id === user?.id,
    }));
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from('messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .limit(100);

    if (channel === 'private') {
      query = query.eq('user_id', user.id);
    } else if (channel === 'class' && turmaId) {
      query = query.eq('turma_id', turmaId);
    } else if (channel === 'class' && !turmaId) {
      // Se não houver turmaId em canal de turma, retorna vazio
      setMessages([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar mensagens:', error.message);
      setLoading(false);
      return;
    }

    const enriched = await enrichMessages(data || []);
    setMessages(enriched);
    setLoading(false);
  }, [user, channel, turmaId, enrichMessages]);

  // ─── Send Message ──────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, customTurmaId?: string) => {
    if (!user || !text.trim()) return null;

    const activeTurmaId = customTurmaId || turmaId;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        channel,
        text: text.trim(),
        turma_id: channel === 'class' ? activeTurmaId : undefined,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      return null;
    }

    // Optimistic — adicionar localmente
    const enriched = await enrichMessages([data]);
    setMessages((prev) => [...prev, ...enriched]);
    return data;
  }, [user, channel, turmaId, enrichMessages]);

  // ─── Initial fetch ─────────────────────────────────────────

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── Realtime subscription ─────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const sub = supabase
      .channel(`messages-${channel}-${turmaId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          // Não duplicar se já adicionamos optimisticamente
          if (newMsg.user_id === user.id) return;
          // Filtrar mensagens da turma específica se estiver ativo o filtro
          if (channel === 'class' && turmaId && newMsg.turma_id !== turmaId) return;
          const enriched = await enrichMessages([newMsg]);
          setMessages((prev) => [...prev, ...enriched]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user, channel, turmaId, enrichMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refresh: fetchMessages,
  };
}
