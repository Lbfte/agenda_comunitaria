import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Reminder {
  id: string;
  title: string;
  shape_color: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

export function useLocalReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const getStorageKey = useCallback(() => {
    return user ? `agenda_turma_reminders_${user.id}` : 'agenda_turma_reminders_guest';
  }, [user]);

  // Carregar lembretes iniciais do localStorage
  useEffect(() => {
    setLoading(true);
    const key = getStorageKey();
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setReminders(JSON.parse(stored));
      } else {
        setReminders([]);
      }
    } catch (e) {
      console.error("Erro ao carregar lembretes locais:", e);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [getStorageKey]);

  // Salvar no localStorage
  const saveReminders = useCallback((newReminders: Reminder[]) => {
    const key = getStorageKey();
    try {
      localStorage.setItem(key, JSON.stringify(newReminders));
      setReminders(newReminders);
    } catch (e) {
      console.error("Erro ao salvar lembretes locais:", e);
    }
  }, [getStorageKey]);

  const addReminder = useCallback((title: string, color: string = '#5B8DEF') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title,
      shape_color: color,
      due_date: todayStr,
      completed: false,
      created_at: new Date().toISOString(),
    };
    setReminders((prev) => {
      const updated = [...prev, newReminder];
      // Salvar de forma assíncrona
      const key = getStorageKey();
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar lembretes locais:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  const completeReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const updated = prev.map(r => 
        r.id === id ? { ...r, completed: true } : r
      );
      const key = getStorageKey();
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar lembretes locais:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  const deleteReminder = useCallback((id: string) => {
    setReminders((prev) => {
      const updated = prev.filter(r => r.id !== id);
      const key = getStorageKey();
      try {
        localStorage.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.error("Erro ao salvar lembretes locais:", e);
      }
      return updated;
    });
  }, [getStorageKey]);

  return {
    reminders,
    loading,
    addReminder,
    completeReminder,
    deleteReminder,
  };
}
