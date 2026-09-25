import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export const getStoredTheme = (): Theme => {
  try {
    const saved = localStorage.getItem('edu_theme_v2');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {}
  return 'light';
};

export const setStoredTheme = (theme: Theme) => {
  try {
    localStorage.setItem('edu_theme_v2', theme);
    localStorage.setItem('edu_theme', theme);
  } catch {}
  document.documentElement.setAttribute('data-theme', theme);
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
  };

  return { theme, toggleTheme, setTheme };
};
