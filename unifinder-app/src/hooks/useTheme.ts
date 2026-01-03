// useTheme Hook
// Tema hook'u

import { useState, useCallback } from 'react';

type ThemeMode = 'light' | 'dark';

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>('light');

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme,
  };
};

export default useTheme;
