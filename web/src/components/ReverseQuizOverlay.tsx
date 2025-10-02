'use client';

import { useState, useCallback } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import AutocompleteInput from './AutocompleteInput';
import type { GameState, GameSettings, Bydel } from '@/lib/types';
import type { AnswerResult } from '@/lib/gameModeStrategy';

interface ReverseQuizOverlayProps {
  state: GameState;
  settings: GameSettings;
  targetName: string | null;
  attemptsLeft: number;
  bydeler: Bydel[];
  onAnswer: (answer: string, correctName: string) => void;
}

export default function ReverseQuizOverlay({
  state,
  settings,
  targetName,
  attemptsLeft,
  bydeler,
  onAnswer
}: ReverseQuizOverlayProps) {
  const [inputValue, setInputValue] = useState('');
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  const handleSubmit = useCallback((value: string) => {
    if (value.trim() && targetName) {
      onAnswer(value.trim(), targetName);
      setInputValue(''); // Clear input after submission
    }
  }, [targetName, onAnswer]);

  if (state.status !== 'playing' || !targetName) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        width: '100%',
        maxWidth: 400,
        px: 2,
      }}
    >
      <Card
        sx={{
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          boxShadow: 3,
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              textAlign: 'center',
              fontSize: '1rem',
              fontWeight: 600,
              color: isDarkMode ? '#ffffff' : '#1a1a1a'
            }}
          >
            Hva heter dette området?
          </Typography>
          
          <AutocompleteInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            suggestions={bydeler}
            placeholder="Skriv navnet på området..."
            disabled={state.status !== 'playing'}
            maxSuggestions={5}
          />
          
          {attemptsLeft !== undefined && attemptsLeft > 0 && (
            <Typography 
              variant="body2" 
              sx={{ 
                mt: 1, 
                textAlign: 'center',
                fontSize: '0.75rem',
                color: isDarkMode ? '#cccccc' : '#666'
              }}
            >
              Forsøk igjen: {attemptsLeft} igjen
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}