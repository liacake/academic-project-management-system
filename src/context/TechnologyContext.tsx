import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Technology } from '../types';
import { useAuth } from './AuthContext';

interface TechnologyContextType {
  technologies: Technology[];
  loading: boolean;
}

const TechnologyContext = createContext<TechnologyContextType>({ technologies: [], loading: false });

export const TechnologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    supabase
      .from('technologies')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setTechnologies(
          (data ?? []).map(t => ({
            id: t.id,
            name: t.name,
            category: t.category as Technology['category'],
            color: t.color,
          }))
        );
        setLoading(false);
      });
  }, [isAuthenticated]);

  return (
    <TechnologyContext.Provider value={{ technologies, loading }}>
      {children}
    </TechnologyContext.Provider>
  );
};

export const useTechnologies = () => useContext(TechnologyContext);
