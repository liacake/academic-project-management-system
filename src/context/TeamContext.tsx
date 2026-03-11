import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { useAuth } from './AuthContext';

interface TeamContextType {
  users: User[];
  loading: boolean;
}

const TeamContext = createContext<TeamContextType>({ users: [], loading: false });

export const TeamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setUsers(
          (data ?? []).map(p => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            studentId: p.student_id ?? undefined,
            avatar: p.avatar ?? undefined,
          }))
        );
        setLoading(false);
      });
  }, [isAuthenticated]);

  return (
    <TeamContext.Provider value={{ users, loading }}>
      {children}
    </TeamContext.Provider>
  );
};

export const useTeam = () => useContext(TeamContext);
