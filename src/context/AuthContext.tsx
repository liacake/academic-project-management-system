import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { formatAuthError } from '../lib/authErrors';
import strings from '../components/ui/strings';
import { visibleStudentId } from '../lib/profileDisplay';
import { User, AuthState, Role } from '../types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, student_id, avatar')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  const role = data.role as Role;
  return {
    id: data.id, name: data.name, email: data.email,
    role,
    studentId: visibleStudentId(role, data.student_id),
    avatar: data.avatar ?? undefined,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false, token: null });
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (session: Session | null) => {
    if (!session) { setAuthState({ user: null, isAuthenticated: false, token: null }); return; }
    const profile = await fetchProfile(session.user.id);
    setAuthState({ user: profile, isAuthenticated: !!profile, token: session.access_token });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session).finally(() => setLoading(false));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { applySession(session); });
    return () => subscription.unsubscribe();
  }, [applySession]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: formatAuthError(error.message) };
    if (!data.session) return { success: false, error: strings.auth.loginError };
    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role: 'student' } },
    });
    if (error) return { success: false, error: formatAuthError(error.message) };
    return { success: true };
  }, []);

  const logout = useCallback(async () => { await supabase.auth.signOut(); }, []);

  const hasRole = useCallback((...roles: Role[]): boolean => {
    if (!authState.user) return false;
    return roles.includes(authState.user.role);
  }, [authState.user]);

  if (loading) {
    return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontSize:'1rem', color:'#555' }}>Loading…</div>;
  }

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
