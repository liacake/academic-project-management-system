import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ThemePreference,
  EffectiveTheme,
  applyThemePreference,
  cycleThemePreference,
  getStoredThemePreference,
} from '../lib/theme';

interface ThemeContextType {
  preference: ThemePreference;
  effectiveTheme: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
  cyclePreference: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredThemePreference());
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>(() =>
    applyThemePreference(getStoredThemePreference())
  );

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    setEffectiveTheme(applyThemePreference(next));
    try {
      localStorage.setItem('apms-theme', next);
    } catch {
      /* ignore */
    }
  }, []);

  const cyclePreference = useCallback(() => {
    setPreferenceState(prev => {
      const next = cycleThemePreference(prev);
      setEffectiveTheme(applyThemePreference(next));
      try {
        localStorage.setItem('apms-theme', next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setEffectiveTheme(applyThemePreference('system'));
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference]);

  return (
    <ThemeContext.Provider value={{ preference, effectiveTheme, setPreference, cyclePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
