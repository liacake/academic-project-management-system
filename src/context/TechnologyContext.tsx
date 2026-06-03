import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Technology } from '../types';
import { useAuth } from './AuthContext';

type TechnologyInput = Pick<Technology, 'name' | 'category' | 'color'>;

interface TechnologyContextType {
  technologies: Technology[];
  loading: boolean;
  refreshTechnologies: () => Promise<void>;
  addTechnology: (tech: TechnologyInput) => Promise<{ success: boolean; error?: string }>;
  updateTechnology: (id: string, tech: TechnologyInput) => Promise<{ success: boolean; error?: string }>;
  deleteTechnology: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const noop = async () => ({ success: false as const });

const TechnologyContext = createContext<TechnologyContextType>({
  technologies: [], loading: false,
  refreshTechnologies: async () => {},
  addTechnology: noop,
  updateTechnology: noop,
  deleteTechnology: noop,
});

function mapRow(t: { id: string; name: string; category: string; color: string }): Technology {
  return {
    id: t.id,
    name: t.name,
    category: t.category as Technology['category'],
    color: t.color,
  };
}

export const TechnologyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTechnologies = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('technologies').select('*').order('name');
    if (!error) setTechnologies((data ?? []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setTechnologies([]); return; }
    refreshTechnologies();
  }, [isAuthenticated, refreshTechnologies]);

  const addTechnology = useCallback(async (tech: TechnologyInput) => {
    const { data, error } = await supabase
      .from('technologies')
      .insert({ name: tech.name.trim(), category: tech.category, color: tech.color })
      .select()
      .single();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to add technology' };
    setTechnologies(prev => [...prev, mapRow(data)].sort((a, b) => a.name.localeCompare(b.name)));
    return { success: true };
  }, []);

  const updateTechnology = useCallback(async (id: string, tech: TechnologyInput) => {
    const { data, error } = await supabase
      .from('technologies')
      .update({ name: tech.name.trim(), category: tech.category, color: tech.color })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) return { success: false, error: error?.message ?? 'Failed to update technology' };
    const updated = mapRow(data);
    setTechnologies(prev => prev.map(t => t.id === id ? updated : t).sort((a, b) => a.name.localeCompare(b.name)));
    return { success: true };
  }, []);

  const deleteTechnology = useCallback(async (id: string) => {
    const { error } = await supabase.from('technologies').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    setTechnologies(prev => prev.filter(t => t.id !== id));
    return { success: true };
  }, []);

  return (
    <TechnologyContext.Provider value={{
      technologies, loading, refreshTechnologies,
      addTechnology, updateTechnology, deleteTechnology,
    }}>
      {children}
    </TechnologyContext.Provider>
  );
};

export const useTechnologies = () => useContext(TechnologyContext);
