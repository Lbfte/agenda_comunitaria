import { supabase } from './supabase';
import {
  getOfflineQueue,
  removeFromOfflineQueue,
  addToOfflineQueue,
  type OfflineOperation,
} from './local-storage';
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from './google-calendar';
import type { InsertDTO, UpdateDTO } from './database.types';

/**
 * Motor de Sincronização
 * 
 * Fluxo:
 *   1. Operação chega (create/update/delete)
 *   2. Se online → envia para Supabase + Google Calendar → marca "synced"
 *   3. Se offline → salva no LocalStorage com flag "local" → exibe badge
 *   4. Ao reconectar → processa a fila offline (FIFO)
 */

export type SyncResult = {
  success: boolean;
  syncStatus: 'synced' | 'local' | 'pending';
  error?: string;
};

// ─── Task Operations ─────────────────────────────────────────

export async function syncCreateTask(
  task: InsertDTO<'tasks'>,
  isOnline: boolean
): Promise<SyncResult & { taskId?: string }> {
  if (!isOnline) {
    // Offline: salvar no LocalStorage
    const localId = crypto.randomUUID();
    addToOfflineQueue({
      type: 'create',
      entity: 'task',
      payload: { ...task, id: localId },
    });
    return { success: true, syncStatus: 'local', taskId: localId };
  }

  // Online: enviar para Supabase
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...task, sync_status: 'synced' })
    .select('id, title, due_date, due_time')
    .single();

  if (error || !data) {
    // Falha no Supabase → salvar offline como fallback
    const localId = crypto.randomUUID();
    addToOfflineQueue({
      type: 'create',
      entity: 'task',
      payload: { ...task, id: localId },
    });
    return { success: false, syncStatus: 'local', error: error?.message, taskId: localId };
  }

  // Tentar criar no Google Calendar (não-bloqueante de verdade)
  if (data.due_date) {
    createCalendarEvent({
      title: data.title,
      date: data.due_date,
      time: data.due_time || undefined,
    }).then(gcalResult => {
      if (gcalResult?.id) {
        supabase
          .from('tasks')
          .update({ google_calendar_event_id: gcalResult.id })
          .eq('id', data.id)
          .then(); // Ignorar promessa para não bloquear
      }
    }).catch(console.error);
  }

  // Registrar no histórico
  await supabase.from('history').insert({
    turma_id: task.turma_id || null,
    user_id: task.created_by,
    action: 'add',
    entity_type: 'task',
    entity_id: data.id,
    description: `add em ${task.due_date || 'sem data'} - ${task.title}`,
  });

  return { success: true, syncStatus: 'synced', taskId: data.id };
}

export async function syncUpdateTask(
  taskId: string,
  updates: UpdateDTO<'tasks'>,
  isOnline: boolean,
  userId: string,
  turmaId?: string | null,
  googleEventId?: string | null
): Promise<SyncResult> {
  if (!isOnline) {
    addToOfflineQueue({
      type: 'update',
      entity: 'task',
      payload: { id: taskId, ...updates },
    });
    return { success: true, syncStatus: 'local' };
  }

  const { error } = await supabase
    .from('tasks')
    .update({ ...updates, sync_status: 'synced' })
    .eq('id', taskId);

  if (error) {
    addToOfflineQueue({
      type: 'update',
      entity: 'task',
      payload: { id: taskId, ...updates },
    });
    return { success: false, syncStatus: 'local', error: error.message };
  }

  // Atualizar no Google Calendar se existir
  if (googleEventId) {
    await updateCalendarEvent(googleEventId, {
      title: updates.title,
      date: updates.due_date || undefined,
      time: updates.due_time || undefined,
    });
  }

  // Registrar no histórico
  await supabase.from('history').insert({
    turma_id: turmaId || null,
    user_id: userId,
    action: 'edit',
    entity_type: 'task',
    entity_id: taskId,
    description: `alt em ${updates.due_date || '?'} - ${updates.title || '?'}`,
  });

  return { success: true, syncStatus: 'synced' };
}

export async function syncCompleteTask(
  taskId: string,
  isOnline: boolean,
  userId: string,
  turmaId?: string | null,
  title?: string
): Promise<SyncResult> {
  const completedAt = new Date().toISOString();

  if (!isOnline) {
    addToOfflineQueue({
      type: 'complete',
      entity: 'task',
      payload: { id: taskId, completed: true, completed_at: completedAt },
    });
    return { success: true, syncStatus: 'local' };
  }

  const { error } = await supabase
    .from('tasks')
    .update({ completed: true, completed_at: completedAt, sync_status: 'synced' })
    .eq('id', taskId);

  if (error) {
    addToOfflineQueue({
      type: 'complete',
      entity: 'task',
      payload: { id: taskId, completed: true, completed_at: completedAt },
    });
    return { success: false, syncStatus: 'local', error: error.message };
  }

  await supabase.from('history').insert({
    turma_id: turmaId || null,
    user_id: userId,
    action: 'complete',
    entity_type: 'task',
    entity_id: taskId,
    description: `concluiu - ${title || '?'}`,
  });

  return { success: true, syncStatus: 'synced' };
}

export async function syncDeleteTask(
  taskId: string,
  isOnline: boolean,
  userId: string,
  turmaId?: string | null,
  googleEventId?: string | null,
  title?: string
): Promise<SyncResult> {
  if (!isOnline) {
    addToOfflineQueue({
      type: 'delete',
      entity: 'task',
      payload: { id: taskId },
    });
    return { success: true, syncStatus: 'local' };
  }

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    return { success: false, syncStatus: 'pending', error: error.message };
  }

  // Deletar do Google Calendar
  if (googleEventId) {
    await deleteCalendarEvent(googleEventId);
  }

  await supabase.from('history').insert({
    turma_id: turmaId || null,
    user_id: userId,
    action: 'delete',
    entity_type: 'task',
    entity_id: taskId,
    description: `del - ${title || '?'}`,
  });

  return { success: true, syncStatus: 'synced' };
}

// ─── Processador da Fila Offline ─────────────────────────────

export async function processOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;

  let processed = 0;

  for (const op of queue) {
    try {
      const success = await processOperation(op);
      if (success) {
        removeFromOfflineQueue(op.id);
        processed++;
      }
    } catch (e) {
      console.error('Erro ao processar operação offline:', op.id, e);
      // Manter na fila para próxima tentativa
    }
  }

  return processed;
}

async function processOperation(op: OfflineOperation): Promise<boolean> {
  const payload = op.payload as Record<string, unknown>;

  switch (op.type) {
    case 'create': {
      const { id: _localId, ...taskData } = payload;
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...taskData, sync_status: 'synced' } as InsertDTO<'tasks'>)
        .select('id, title, due_date, due_time')
        .single();

      if (error || !data) {
        console.error('Sync create falhou:', error?.message);
        return false;
      }

      // Tentar criar no Google Calendar (non-blocking)
      if (data.due_date) {
        createCalendarEvent({
          title: data.title,
          date: data.due_date,
          time: data.due_time || undefined,
        }).then(gcalResult => {
          if (gcalResult?.id) {
            supabase
              .from('tasks')
              .update({ google_calendar_event_id: gcalResult.id })
              .eq('id', data.id)
              .then();
          }
        }).catch(console.error);
      }
      return true;
    }

    case 'update': {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('tasks')
        .update({ ...updates, sync_status: 'synced' })
        .eq('id', id as string);
      return !error;
    }

    case 'complete': {
      const { id, ...updates } = payload;
      const { error } = await supabase
        .from('tasks')
        .update({ ...updates, sync_status: 'synced' })
        .eq('id', id as string);
      return !error;
    }

    case 'delete': {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', payload.id as string);
      return !error;
    }

    default:
      return false;
  }
}
