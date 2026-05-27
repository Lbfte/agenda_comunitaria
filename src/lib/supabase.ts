import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas.\n' +
    'Crie um arquivo .env na raiz do projeto com:\n' +
    '  NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co\n' +
    '  NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key'
  );
}

export const supabase = createClient<Database>(
  supabaseUrl ?? '',
  supabaseAnonKey ?? '',
  {
    auth: {
      autoRefreshToken: true,       // Renovação automática do token
      persistSession: true,         // Persiste sessão no localStorage
      detectSessionInUrl: true,     // Detecta callback OAuth na URL
    },
  }
);
