'use client';

import { createTheme } from '@mui/material/styles';

// Create theme that works with your existing color scheme
export const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb', // Blue for primary actions (matches your existing blue)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#10b981', // Green for success/correct answers
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef4444', // Red for wrong answers
      contrastText: '#ffffff',
    },
    warning: {
      main: '#f59e0b', // Orange for hints/alternatives
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#171717',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), Arial, sans-serif',
    h1: {
      fontSize: '1.125rem', // 18px - matches your header
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem', // 14px - matches your UI
    },
    body2: {
      fontSize: '0.75rem', // 12px - for smaller text
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Keep original casing
          borderRadius: '6px', // Matches Tailwind rounded
          padding: '8px 12px', // Similar to your px-3 py-2
          '&.Mui-disabled': {
            backgroundColor: '#e0e0e0',
            color: '#757575', // Better contrast for disabled state
          },
        },
        contained: {
          '&.Mui-disabled': {
            backgroundColor: '#e0e0e0',
            color: '#757575',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

// Dark theme variant for dark mode support
export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    background: {
      default: '#0a0a0a',
      paper: '#1a1a1a',
    },
    text: {
      primary: '#ededed',
      secondary: '#9ca3af',
    },
  },
  components: {
    ...theme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '6px',
          padding: '8px 12px',
          '&.Mui-disabled': {
            backgroundColor: '#404040',
            color: '#b0b0b0', // Better contrast for disabled state in dark mode
          },
        },
        contained: {
          '&.Mui-disabled': {
            backgroundColor: '#404040',
            color: '#b0b0b0',
          },
        },
      },
    },
  },
});