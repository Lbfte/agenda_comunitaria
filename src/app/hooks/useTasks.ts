import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNetworkStatus } from './useNetworkStatus';
import {
  syncCreateTask,
  syncUpdateTask,
  syncCompleteTask,
  syncDeleteTask,
  processOfflineQueue,
} from '@/lib/sync-engine';
import { getQueueSize, getCacheData, setCacheData } from '@/lib/local-storage';
import type { Task, InsertDTO, UpdateDTO } from '@/lib/database.types';

type TaskFilter = {
  period?: 'manha' | 'tarde' | 'noite' | null;
  completed?: boolean;
  date?: string;       // 'YYYY-MM-DD'
  type?: 'turma' | 'pessoal';
};

export function useTasks(channel: 'geral' | 'pessoal') {
  const { user, profile } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(getQueueSize());

  // ─── Fetch tasks ───────────────────────────────────────────

  const fetchTasks = useCallback(async (filter?: TaskFilter) => {
    if (!user) return;

    // Tentar cache primeiro se offline
    const filterKey = filter ? `p${filter.period || ''}_c${filter.completed ?? ''}_d${filter.date || ''}` : 'all';
    const cacheKey = `tasks_${channel}_${filterKey}`;
    if (!isOnline) {
      const cached = getCacheData<Task[]>(cacheKey, 30 * 60 * 1000); // 30 min cache
      if (cached) {
        setTasks(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);

    let query = supabase
      .from('tasks')
      .select('*')
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true, nullsFirst: false });

    // Filtrar por canal
    if (channel === 'pessoal') {
      query = query.eq('type', 'pessoal').eq('created_by', user.id);
    } else {
      query = query.eq('type', 'turma');
      if (profile?.turma_id) {
        query = query.eq('turma_id', profile.turma_id);
      } else if (user.email !== "morcegosnaodormem@gmail.com") {
        // Usuário normal sem turma não vê tarefas de turma
        query = query.eq('turma_id', '00000000-0000-0000-0000-000000000000');
      }
    }

    // Filtros adicionais
    if (filter?.period) {
      query = query.eq('period', filter.period);
    }
    if (filter?.completed !== undefined) {
      query = query.eq('completed', filter.completed);
    }
    if (filter?.date) {
      query = query.eq('due_date', filter.date);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar tarefas:', error.message);
      // Fallback para cache
      const cached = getCacheData<Task[]>(cacheKey);
      if (cached) setTasks(cached);
    } else {
      setTasks(data || []);
      setCacheData(cacheKey, data || []);
    }

    setLoading(false);
  }, [user, profile?.turma_id, channel, isOnline]);

  // ─── Create ────────────────────────────────────────────────

  const createTask = useCallback(async (
    input: Pick<InsertDTO<'tasks'>, 'title' | 'description' | 'due_date' | 'due_time' | 'period' | 'shape' | 'shape_color'>,
    turmaId?: string
  ) => {
    if (!user) return null;

    const taskData: InsertDTO<'tasks'> = {
      ...input,
      type: channel === 'pessoal' ? 'pessoal' : 'turma',
      turma_id: channel === 'geral' ? turmaId : undefined,
      created_by: user.id,
    };

    const localTempId = crypto.randomUUID();
    const optimistic: Task = {
      id: localTempId,
      title: input.title,
      description: input.description || null,
      type: taskData.type,
      turma_id: taskData.turma_id || null,
      created_by: user.id,
      due_date: input.due_date || null,
      due_time: input.due_time || null,
      period: input.period || null,
      shape: input.shape || 'triangle',
      shape_color: input.shape_color || '#666',
      completed: false,
      completed_at: null,
      google_calendar_event_id: null,
      sync_status: isOnline ? 'pending' : 'local',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Adicionar à lista local imediatamente (verdadeiro optimistic update)
    setTasks((prev) => [...prev, optimistic]);
    setPendingCount(getQueueSize() + (isOnline ? 0 : 1));

    const result = await syncCreateTask(taskData, isOnline);

    if (result.success && result.taskId) {
      setTasks((prev) => prev.map(t => t.id === localTempId ? { ...t, id: result.taskId!, sync_status: result.syncStatus } : t));
      setPendingCount(getQueueSize());
    } else {
      // rollback em caso de falha severa
      setTasks((prev) => prev.filter(t => t.id !== localTempId));
    }

    return result;
  }, [user, channel, isOnline]);

  // ─── Update ────────────────────────────────────────────────

  const updateTask = useCallback(async (
    taskId: string,
    updates: UpdateDTO<'tasks'>
  ) => {
    if (!user) return null;

    const task = tasks.find((t) => t.id === taskId);

    // Optimistic update imediato
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, ...updates, sync_status: isOnline ? 'pending' : 'local' }
          : t
      )
    );
    setPendingCount(getQueueSize() + (isOnline ? 0 : 1));

    const result = await syncUpdateTask(
      taskId, updates, isOnline, user.id,
      task?.turma_id, task?.google_calendar_event_id
    );

    if (result.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, sync_status: result.syncStatus } : t
        )
      );
    } else {
      fetchTasks(); // rollback via refetch
    }
    setPendingCount(getQueueSize());

    return result;
  }, [user, tasks, isOnline, fetchTasks]);

  // ─── Complete ──────────────────────────────────────────────

  const completeTask = useCallback(async (taskId: string) => {
    if (!user) return null;

    const task = tasks.find((t) => t.id === taskId);

    // Optimistic update imediato
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completed: true, completed_at: new Date().toISOString(), sync_status: isOnline ? 'pending' : 'local' }
          : t
      )
    );
    setPendingCount(getQueueSize() + (isOnline ? 0 : 1));

    const result = await syncCompleteTask(
      taskId, isOnline, user.id,
      task?.turma_id, task?.title
    );

    if (result.success) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, sync_status: result.syncStatus } : t
        )
      );
    } else {
      fetchTasks(); // rollback via refetch
    }
    setPendingCount(getQueueSize());

    return result;
  }, [user, tasks, isOnline, fetchTasks]);

  // ─── Delete ────────────────────────────────────────────────

  const deleteTask = useCallback(async (taskId: string) => {
    if (!user) return null;

    const task = tasks.find((t) => t.id === taskId);

    // Optimistic: remover imediatamente
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setPendingCount(getQueueSize() + (isOnline ? 0 : 1));

    const result = await syncDeleteTask(
      taskId, isOnline, user.id,
      task?.turma_id, task?.google_calendar_event_id, task?.title
    );

    if (!result.success) {
      fetchTasks(); // rollback
    }
    setPendingCount(getQueueSize());

    return result;
  }, [user, tasks, isOnline, fetchTasks]);

  // ─── Sync on reconnect ────────────────────────────────────

  useEffect(() => {
    if (isOnline && getQueueSize() > 0) {
      processOfflineQueue().then((count) => {
        if (count > 0) {
          setPendingCount(getQueueSize());
          fetchTasks(); // Refresh após sync
        }
      });
    }
  }, [isOnline, fetchTasks]);

  // ─── Initial fetch ────────────────────────────────────────

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    isOnline,
    pendingCount,
    fetchTasks,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
  };
}
