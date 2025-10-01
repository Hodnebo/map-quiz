'use client';

import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { theme, darkTheme } from '@/lib/theme';
import { ThemeContextProvider, useTheme } from '@/contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function MuiThemeWrapper({ children }: ThemeProviderProps) {
  const { isDarkMode } = useTheme();

  return (
    <MuiThemeProvider theme={isDarkMode ? darkTheme : theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ThemeContextProvider>
      <MuiThemeWrapper>
        {children}
      </MuiThemeWrapper>
    </ThemeContextProvider>
  );
}