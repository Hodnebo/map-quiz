'use client';

import { useState, useCallback } from 'react';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import AutocompleteInput from './AutocompleteInput';
import type { GameState, GameSettings, Region } from '@/lib/types';
// AnswerResult removed - not used

interface ReverseQuizOverlayProps {
  state: GameState;
  settings: GameSettings;
  targetName: string | null;
  targetId: string | null;
  attemptsLeft: number;
  lastCorrectAnswerName: string;
  regions: Region[];
  onAnswer: (answer: string, correctName: string) => void;
  feedback?: 'correct' | 'wrong' | null;
  feedbackMessage?: string;
  onClearFeedback?: () => void;
}

export default function ReverseQuizOverlay({
  state,
  // settings removed - not used
  targetName,
  targetId,
  attemptsLeft,
  lastCorrectAnswerName,
  regions,
  onAnswer,
  feedback,
  // feedbackMessage removed - not used
  onClearFeedback
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

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    // Clear feedback when user starts typing again
    if (value.length > 0 && feedback && onClearFeedback) {
      onClearFeedback();
    }
  }, [feedback, onClearFeedback]);

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
        zIndex: 1000,
        width: '100%',
        maxWidth: 400,
        px: 2,
      }}
    >
      <Card
        data-testid="reverse-quiz-overlay"
        sx={{
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          border: isDarkMode ? '2px solid rgba(255, 255, 255, 0.3)' : '2px solid rgba(0, 0, 0, 0.2)',
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
          
          {/* Feedback Message */}
          {feedback && (
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: feedback === 'correct' ? '#4caf50' : '#f44336',
                  backgroundColor: feedback === 'correct' 
                    ? (isDarkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)')
                    : (isDarkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)'),
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  border: `1px solid ${feedback === 'correct' ? '#4caf50' : '#f44336'}`,
                }}
              >
                {feedback === 'correct' 
                  ? '🎉 Riktig!' 
                  : attemptsLeft <= 0 
                    ? `❌ Feil - Riktig svar var ${lastCorrectAnswerName}`
                    : '❌ Feil'
                }
              </Typography>
            </Box>
          )}
          
          <AutocompleteInput
            data-testid="reverse-quiz-input"
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            suggestions={regions}
            placeholder="Skriv navnet på området..."
            disabled={state.status !== 'playing'}
            maxSuggestions={5}
            currentTargetId={targetId}
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