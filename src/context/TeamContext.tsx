import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { visibleStudentId } from '../lib/profileDisplay';
import { Role, User } from '../types';
import { useAuth } from './AuthContext';

interface TeamContextType {
  users: User[];
  loading: boolean;
  updateUserRole: (userId: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  refreshUsers: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  users: [], loading: false,
  updateUserRole: async () => ({ success: false }),
  refreshUsers: async () => {},
});

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (!error) {
      setUsers(
        (data ?? []).map(p => {
          const role = p.role as Role;
          return {
            id: p.id,
            name: p.name,
            email: p.email,
            role,
            studentId: visibleStudentId(role, p.student_id),
            avatar: p.avatar ?? undefined,
          };
        })
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setUsers([]); return; }
    refreshUsers();
  }, [isAuthenticated, refreshUsers]);

  const updateUserRole = async (userId: string, role: Role): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) return { success: false, error: error.message };
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    return { success: true };
  };

  return (
    <TeamContext.Provider value={{ users, loading, updateUserRole, refreshUsers }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => useContext(TeamContext);
