import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from './env';

export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,       // Renovação automática do token
      persistSession: true,         // Persiste sessão no localStorage
      detectSessionInUrl: true,     // Detecta callback OAuth na URL
    },
  }
);
