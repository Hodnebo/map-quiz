'use client';

import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { theme, darkTheme } from '@/lib/theme';
import { useEffect, useState } from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <MuiThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}