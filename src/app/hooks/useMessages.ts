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

  const userRef = useRef(user);
  const turmaIdRef = useRef(turmaId);
  const activeFetchRef = useRef<AbortController | null>(null);

  useEffect(() => {
    userRef.current = user;
    turmaIdRef.current = turmaId;
  }, [user, turmaId]);

  useEffect(() => {
    return () => {
      if (activeFetchRef.current) {
        activeFetchRef.current.abort();
      }
    };
  }, []);

  const enrichMessages = useCallback(async (msgs: Message[]): Promise<MessageWithProfile[]> => {
    const currentUser = userRef.current;
    // Buscar perfis que ainda não estão no cache
    const missingIds = Array.from(new Set(msgs.map((m) => m.user_id)))
      .filter((id) => !profileCache.current.has(id));

    if (missingIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, initials, color')
        .in('id', missingIds);

      (profiles || []).forEach((p: any) => {
        profileCache.current.set(p.id, p);
      });
    }

    return msgs.map((m) => ({
      ...m,
      profile: profileCache.current.get(m.user_id) || null,
      isSelf: m.user_id === currentUser?.id,
    }));
  }, []);

  const fetchMessages = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    const currentTurmaId = turmaIdRef.current;
    const cacheKey = `messages_${channel}_${currentTurmaId || 'all'}_${currentUser.id}`;

    // SWR: Tentar usar cache local primeiro
    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        setMessages(cached);
        setLoading(false); // UI exibe as mensagens instantaneamente
      } catch (e) {
        console.error('Falha ao ler cache de mensagens', e);
      }
    }

    if (!cachedStr) {
      setLoading(true);
    }

    if (activeFetchRef.current) {
      activeFetchRef.current.abort();
    }
    const controller = new AbortController();
    activeFetchRef.current = controller;

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true })
        .limit(100);

      if (channel === 'private') {
        query = query.eq('user_id', currentUser.id);
      } else if (channel === 'class' && currentTurmaId) {
        query = query.eq('turma_id', currentTurmaId);
      } else if (channel === 'class' && !currentTurmaId) {
        // Se não houver turmaId em canal de turma, retorna vazio
        setMessages([]);
        setLoading(false);
        return;
      }

      const { data, error } = await query.abortSignal(controller.signal);

      if (error) {
        console.error('Erro ao buscar mensagens:', error.message);
      } else {
        const enriched = await enrichMessages(data || []);
        setMessages(enriched);
        localStorage.setItem(cacheKey, JSON.stringify(enriched));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Erro inesperado ao buscar mensagens:', err);
    } finally {
      if (activeFetchRef.current === controller) {
        activeFetchRef.current = null;
        setLoading(false);
      }
    }
  }, [channel, turmaId, enrichMessages]);

  // Atualizar o cache sempre que as mensagens mudarem
  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser || messages.length === 0) return;
    
    const currentTurmaId = turmaIdRef.current;
    const cacheKey = `messages_${channel}_${currentTurmaId || 'all'}_${currentUser.id}`;
    
    localStorage.setItem(cacheKey, JSON.stringify(messages));
  }, [messages, channel]);

  // ─── Send Message ──────────────────────────────────────────

  const sendMessage = useCallback(async (text: string, customTurmaId?: string) => {
    const currentUser = userRef.current;
    if (!currentUser || !text.trim()) return null;

    const activeTurmaId = customTurmaId || turmaIdRef.current;
    
    // Optimistic Update: Criar e adicionar localmente antes do Supabase
    const tempId = crypto.randomUUID();
    const optimisticMsg: Message = {
      id: tempId,
      user_id: currentUser.id,
      channel,
      text: text.trim(),
      turma_id: channel === 'class' ? (activeTurmaId || null) : null,
      created_at: new Date().toISOString()
    };
    
    const enriched = await enrichMessages([optimisticMsg]);
    setMessages((prev) => [...prev, ...enriched]);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        user_id: currentUser.id,
        channel,
        text: text.trim(),
        turma_id: channel === 'class' ? activeTurmaId : undefined,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      // Rollback em caso de erro severo (opcional)
      // setTasks((prev) => prev.filter(m => m.id !== tempId));
      return null;
    }
    
    // Substituir o ID temporário pelo ID real do banco
    setMessages((prev) => prev.map(m => m.id === tempId ? { ...m, ...(data as any), isSelf: true } : m));

    return data;
  }, [channel, enrichMessages]);

  // ─── Initial fetch ─────────────────────────────────────────

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── Realtime subscription ─────────────────────────────────

  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    const currentTurmaId = turmaIdRef.current;

    const sub = supabase
      .channel(`messages-${channel}-${currentTurmaId || 'all'}`)
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
          if (newMsg.user_id === userRef.current?.id) return;
          // Filtrar mensagens da turma específica se estiver ativo o filtro
          if (channel === 'class' && turmaIdRef.current && newMsg.turma_id !== turmaIdRef.current) return;
          const enriched = await enrichMessages([newMsg]);
          setMessages((prev) => [...prev, ...enriched]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [channel, enrichMessages]);

  return {
    messages,
    loading,
    sendMessage,
    refresh: fetchMessages,
  };
}
