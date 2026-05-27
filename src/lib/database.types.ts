// ============================================================
// Tipos TypeScript gerados a partir do schema do Supabase
// Regenere com: npx supabase gen types typescript --project-id SEU_PROJECT_ID
// ============================================================

export interface Database {
  public: {
    Tables: {
      turmas: {
        Row: {
          id: string;
          name: string;
          code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          code?: string;
        };
      };

      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          initials: string | null;
          turma_id: string | null;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          turma_id?: string | null;
          color?: string;
        };
        Update: {
          full_name?: string | null;
          avatar_url?: string | null;
          turma_id?: string | null;
          color?: string;
        };
      };

      turma_members: {
        Row: {
          turma_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          turma_id: string;
          user_id: string;
          role?: 'admin' | 'member';
        };
        Update: {
          role?: 'admin' | 'member';
        };
      };

      turma_requests: {
        Row: {
          id: string;
          user_id: string;
          turma_id: string;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          turma_id: string;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'approved' | 'rejected';
        };
      };

      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          type: 'turma' | 'pessoal';
          turma_id: string | null;
          created_by: string;
          due_date: string | null;
          due_time: string | null;
          period: 'manha' | 'tarde' | 'noite' | null;
          shape: 'triangle' | 'invTriangle';
          shape_color: string;
          completed: boolean;
          completed_at: string | null;
          google_calendar_event_id: string | null;
          sync_status: 'synced' | 'pending' | 'local';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          type: 'turma' | 'pessoal';
          turma_id?: string | null;
          created_by: string;
          due_date?: string | null;
          due_time?: string | null;
          period?: 'manha' | 'tarde' | 'noite' | null;
          shape?: 'triangle' | 'invTriangle';
          shape_color?: string;
          completed?: boolean;
          google_calendar_event_id?: string | null;
          sync_status?: 'synced' | 'pending' | 'local';
        };
        Update: {
          title?: string;
          description?: string | null;
          due_date?: string | null;
          due_time?: string | null;
          period?: 'manha' | 'tarde' | 'noite' | null;
          shape?: 'triangle' | 'invTriangle';
          shape_color?: string;
          completed?: boolean;
          completed_at?: string | null;
          google_calendar_event_id?: string | null;
          sync_status?: 'synced' | 'pending' | 'local';
        };
      };

      flashcard_folders: {
        Row: {
          id: string;
          name: string;
          letter: string | null;
          color: string;
          type: 'turma' | 'pessoal';
          turma_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          letter?: string | null;
          color?: string;
          type: 'turma' | 'pessoal';
          turma_id?: string | null;
          created_by: string;
        };
        Update: {
          name?: string;
          letter?: string | null;
          color?: string;
        };
      };

      flashcards: {
        Row: {
          id: string;
          folder_id: string;
          question: string;
          answer: string;
          created_by: string;
          next_review_at: string;
          interval_days: number;
          ease_factor: number;
          repetitions: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id: string;
          question: string;
          answer: string;
          created_by: string;
          next_review_at?: string;
          interval_days?: number;
          ease_factor?: number;
          repetitions?: number;
        };
        Update: {
          question?: string;
          answer?: string;
          next_review_at?: string;
          interval_days?: number;
          ease_factor?: number;
          repetitions?: number;
        };
      };

      messages: {
        Row: {
          id: string;
          turma_id: string | null;
          user_id: string;
          channel: 'class' | 'private';
          text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id?: string | null;
          user_id: string;
          channel: 'class' | 'private';
          text: string;
        };
        Update: {
          text?: string;
        };
      };

      history: {
        Row: {
          id: string;
          turma_id: string | null;
          user_id: string;
          action: 'add' | 'edit' | 'delete' | 'complete';
          entity_type: 'task' | 'flashcard' | 'folder' | 'message' | 'turma';
          entity_id: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id?: string | null;
          user_id: string;
          action: 'add' | 'edit' | 'delete' | 'complete';
          entity_type: 'task' | 'flashcard' | 'folder' | 'message' | 'turma';
          entity_id?: string | null;
          description?: string | null;
        };
        Update: never;
      };

      mentions: {
        Row: {
          id: string;
          history_id: string;
          mentioned_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          history_id: string;
          mentioned_user_id: string;
        };
        Update: never;
      };
    };

    Functions: {
      is_turma_member: {
        Args: { p_turma_id: string };
        Returns: boolean;
      };
    };
  };
}

// ────────────────────────────────────────────────────────────
// Type helpers para uso nos componentes
// ────────────────────────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDTO<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Aliases convenientes
export type Profile = Tables<'profiles'>;
export type Turma = Tables<'turmas'>;
export type Task = Tables<'tasks'>;
export type FlashcardFolder = Tables<'flashcard_folders'>;
export type Flashcard = Tables<'flashcards'>;
export type Message = Tables<'messages'>;
export type HistoryEntry = Tables<'history'>;
export type Mention = Tables<'mentions'>;
export type TurmaRequest = Tables<'turma_requests'>;
