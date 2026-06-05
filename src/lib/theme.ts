export const THEME_STORAGE_KEY = 'apms-theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type EffectiveTheme = 'light' | 'dark';

const CYCLE: ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function getStoredThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'system';
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyThemePreference(preference: ThemePreference): EffectiveTheme {
  const effective = resolveEffectiveTheme(preference);
  document.documentElement.setAttribute('data-theme', effective);
  document.documentElement.setAttribute('data-theme-preference', preference);
  return effective;
}

export function cycleThemePreference(current: ThemePreference): ThemePreference {
  const idx = CYCLE.indexOf(current);
  return CYCLE[(idx + 1) % CYCLE.length];
}
