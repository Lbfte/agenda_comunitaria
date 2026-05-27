import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  calculateNextReview,
  type DifficultyButton,
  QUALITY_MAP,
} from '@/lib/spaced-repetition';
import type { FlashcardFolder, Flashcard, InsertDTO } from '@/lib/database.types';

export function useFlashcards(channel: 'geral' | 'pessoal') {
  const { user, profile } = useAuth();
  const [folders, setFolders] = useState<FlashcardFolder[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(true);

  const userRef = useRef(user);
  const profileRef = useRef(profile);

  useEffect(() => {
    userRef.current = user;
    profileRef.current = profile;
  }, [user, profile]);

  // ─── Folders ───────────────────────────────────────────────

  const fetchFolders = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return;
    
    const currentProfile = profileRef.current;
    const cacheKey = `flashcard_folders_${channel}_${currentUser.id}`;

    const cachedStr = localStorage.getItem(cacheKey);
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        setFolders(cached);
        setLoadingFolders(false); // SWR: Renderiza UI imediatamente se tiver cache
      } catch (e) {
        console.error('Falha ao ler cache de flashcards', e);
      }
    }

    if (!cachedStr) {
      setLoadingFolders(true);
    }

    let query = supabase
      .from('flashcard_folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (channel === 'pessoal') {
      query = query.eq('type', 'pessoal').eq('created_by', currentUser.id);
    } else {
      query = query.eq('type', 'turma');
      if (currentProfile?.turma_id) {
        query = query.eq('turma_id', currentProfile.turma_id);
      } else if (currentUser.email !== "morcegosnaodormem@gmail.com") {
        query = query.eq('turma_id', '00000000-0000-0000-0000-000000000000');
      }
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar pastas:', error.message);
    } else {
      const result = data || [];
      setFolders(result);
      localStorage.setItem(cacheKey, JSON.stringify(result));
    }
    
    setLoadingFolders(false);
  }, [channel]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const createFolder = useCallback(async (
    input: Pick<InsertDTO<'flashcard_folders'>, 'name' | 'letter' | 'color'>,
    turmaId?: string
  ) => {
    if (!user) return null;

    const folderData: InsertDTO<'flashcard_folders'> = {
      ...input,
      type: channel === 'pessoal' ? 'pessoal' : 'turma',
      turma_id: channel === 'geral' ? turmaId : undefined,
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('flashcard_folders')
      .insert(folderData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pasta:', error.message);
      return null;
    }

    setFolders((prev) => [data, ...prev]);
    return data;
  }, [user, channel]);

  const updateFolder = useCallback(async (
    folderId: string,
    updates: { name: string; letter: string; color: string }
  ) => {
    const { data, error } = await supabase
      .from('flashcard_folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar pasta:', error.message);
      return null;
    }

    setFolders((prev) => prev.map((f) => f.id === folderId ? data : f));
    return data;
  }, []);

  const deleteFolder = useCallback(async (folderId: string) => {
    const { error } = await supabase
      .from('flashcard_folders')
      .delete()
      .eq('id', folderId);

    if (!error) {
      setFolders((prev) => prev.filter((f) => f.id !== folderId));
    }
    return !error;
  }, []);

  // ─── Flashcards dentro de uma pasta ────────────────────────

  const fetchCards = useCallback(async (folderId: string): Promise<Flashcard[]> => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('folder_id', folderId)
      .order('next_review_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cards:', error.message);
      return [];
    }
    return data || [];
  }, []);

  const fetchDueCards = useCallback(async (folderId: string): Promise<Flashcard[]> => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('folder_id', folderId)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar cards pendentes:', error.message);
      return [];
    }
    return data || [];
  }, []);

  const createCard = useCallback(async (
    folderId: string,
    question: string,
    answer: string
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        folder_id: folderId,
        question,
        answer,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar card:', error.message);
      return null;
    }
    return data;
  }, [user]);

  const updateCard = useCallback(async (
    cardId: string,
    updates: { question?: string; answer?: string }
  ) => {
    const { error } = await supabase
      .from('flashcards')
      .update(updates)
      .eq('id', cardId);

    return !error;
  }, []);

  const deleteCard = useCallback(async (cardId: string) => {
    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', cardId);

    return !error;
  }, []);

  // ─── Revisão com SM-2 ─────────────────────────────────────

  const reviewCard = useCallback(async (
    card: Flashcard,
    difficulty: DifficultyButton
  ) => {
    const quality = QUALITY_MAP[difficulty];
    const nextState = calculateNextReview(
      {
        interval_days: card.interval_days,
        ease_factor: card.ease_factor,
        repetitions: card.repetitions,
      },
      quality
    );

    const { error } = await supabase
      .from('flashcards')
      .update({
        interval_days: nextState.interval_days,
        ease_factor: nextState.ease_factor,
        repetitions: nextState.repetitions,
        next_review_at: nextState.next_review_at,
      })
      .eq('id', card.id);

    if (error) {
      console.error('Erro ao atualizar revisão:', error.message);
      return null;
    }

    return nextState;
  }, []);

  return {
    folders,
    loadingFolders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    fetchCards,
    fetchDueCards,
    createCard,
    updateCard,
    deleteCard,
    reviewCard,
  };
}
