import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{error: Error | null}>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{error: Error | null}>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  });

  // Buscar perfil do usuário autenticado
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState((prev) => ({ ...prev, profile }));
  }, [state.user, fetchProfile]);

  // Inicializar sessão e escutar mudanças
  useEffect(() => {
    // Buscar sessão existente
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error("Erro na validação de token:", error.message);
        setState({ user: null, profile: null, session: null, loading: false });
        return;
      }
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, session, loading: false });
      } else {
        setState({ user: null, profile: null, session: null, loading: false });
      }
    }).catch((err) => {
      console.error("Erro fatal ao buscar sessão:", err);
      setState({ user: null, profile: null, session: null, loading: false });
    });

    // Escutar mudanças de auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, profile, session, loading: false });
        } else {
          setState({ user: null, profile: null, session: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // Login com Google OAuth
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/calendar',  // Scope do Google Calendar
        queryParams: {
          access_type: 'offline',   // Para obter refresh_token
          prompt: 'consent',        // Forçar consentimento para garantir refresh_token
        },
      },
    });
    if (error) {
      console.error('Erro no login Google:', error.message);
    }
  }, []);

  // Login com E-mail e Senha
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  // Cadastro com E-mail e Senha
  const signUpWithEmail = useCallback(async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, profile: null, session: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
