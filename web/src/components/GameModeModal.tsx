'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';
import { GameMode, GameSettings } from '@/lib/types';
import { gameModeRegistry } from '@/lib/gameModeRegistry';
import '@/lib/modes'; // Import to ensure modes are registered
import { t } from '@/i18n';
import type { Locale } from '@/i18n/config';

interface GameModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartGame: (mode: GameMode, settings: GameSettings) => void;
  currentMode?: string;
  currentSettings?: GameSettings;
  totalEntries?: number;
  locale?: Locale;
}

export function GameModeModal({
  open,
  onClose,
  onStartGame,
  currentMode,
  currentSettings,
  totalEntries = 15,
  locale = 'no',
}: GameModeModalProps) {
  const [selectedMode, setSelectedMode] = useState<string>('classic');
  const [settings, setSettings] = useState<GameSettings>(() => ({
    gameMode: currentMode ?? 'classic',
    rounds: currentSettings?.rounds ?? 10,
    maxAttempts: currentSettings?.maxAttempts ?? 3,
    difficulty: currentSettings?.difficulty ?? 'normal',
    alternativesCount: currentSettings?.alternativesCount ?? 4,
  }));

  // Initialize with current values if provided
  useEffect(() => {
    if (currentMode) {
      setSelectedMode(currentMode);
    }
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentMode, currentSettings]);

  const handleModeChange = (modeId: string) => {
    setSelectedMode(modeId);
    // Reset settings to defaults for the new mode, but preserve existing fields
    const modeStrategy = gameModeRegistry.getMode(modeId);
    const defaultSettings = modeStrategy.getDefaultSettings();
    setSettings(prev => ({
      ...prev,
      gameMode: modeId,
      ...defaultSettings,
    }));
  };

  const handleSettingChange = (key: keyof GameSettings, value: unknown) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStartGame = () => {
    const modeStrategy = gameModeRegistry.getMode(selectedMode);
    if (modeStrategy) {
      // Convert the strategy to GameMode format expected by onStartGame
      const mode: GameMode = {
        id: modeStrategy.id,
        name: modeStrategy.name,
        description: modeStrategy.description,
        settings: modeStrategy.getDefaultSettings() as any,
      };
      onStartGame(mode, settings);
      onClose();
    }
  };

  const selectedModeStrategy = gameModeRegistry.getMode(selectedMode);
  const settingsProps = selectedModeStrategy.getSettingsProps();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      data-testid="game-mode-modal"
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ fontSize: '2rem', fontWeight: 'bold', mb: 1 }}>
          {t('modal.title', locale)}
        </Box>
        <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
          {t('modal.subtitle', locale)}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Game Mode Selection */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {t('modal.gameMode', locale)}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {gameModeRegistry.getAllModes().map((strategy) => {
              const isSelected = selectedMode === strategy.id;
              return (
                <Chip
                  key={strategy.id}
                  label={t(strategy.name, locale)}
                  onClick={() => handleModeChange(strategy.id)}
                  variant={isSelected ? 'filled' : 'outlined'}
                  data-testid={`game-mode-${strategy.id}`}
                  sx={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : 'transparent',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                />
              );
            })}
          </Stack>

          <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

          {/* Settings */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            {t('modal.settings', locale)}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Rounds */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>{t('modal.rounds', locale)}</InputLabel>
              <Select
                value={settings.rounds}
                onChange={(e) => handleSettingChange('rounds', Number(e.target.value))}
                label={t('modal.rounds', locale)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              >
                {[5, 15, 30, 60, totalEntries].map((rounds, idx) => {
                  const isDisabled = rounds > totalEntries;
                  const isFull = rounds === totalEntries;
                  return (
                    <MenuItem key={idx} value={rounds} disabled={isDisabled}>
                      {isFull ? t('modal.full', locale, { count: totalEntries }) : t('modal.rounds_plural', locale, { count: rounds })}
                    </MenuItem>
                  );
                })}
              </Select>
              <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.8, fontSize: '0.75rem' }}>
                {t('game.totalRegions', locale, { count: totalEntries })}
              </Typography>
            </FormControl>

            {/* Max Attempts */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>{t('modal.maxAttempts', locale)}</InputLabel>
              <Select
                value={settings.maxAttempts}
                onChange={(e) => handleSettingChange('maxAttempts', Number(e.target.value))}
                label={t('modal.maxAttempts', locale)}
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255,255,255,0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'white',
                  },
                }}
              >
                {[1, 2, 3, 4, 5].map((attempts) => (
                  <MenuItem key={attempts} value={attempts}>
                    {t('modal.attempts_plural', locale, { count: attempts })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Difficulty (only show if the mode supports it) */}
            {settingsProps.showDifficulty && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>{t('modal.difficulty', locale)}</InputLabel>
                <Select
                  value={settings.difficulty}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                  label={t('modal.difficulty', locale)}
                  data-testid="difficulty-select"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                  }}
                >
                  <MenuItem value="training">{t('modal.training', locale)}</MenuItem>
                  <MenuItem value="easy">{t('modal.easy', locale)}</MenuItem>
                  <MenuItem value="normal">{t('modal.normal', locale)}</MenuItem>
                  <MenuItem value="hard">{t('modal.hard', locale)}</MenuItem>
                  <MenuItem value="expert">{t('modal.expert', locale)}</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Alternatives Count (only show if the mode supports it) */}
            {settingsProps.showAlternatives && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>{t('modal.alternatives', locale)}</InputLabel>
                <Select
                  data-testid="alternatives-select"
                  value={settings.alternativesCount}
                  onChange={(e) => handleSettingChange('alternativesCount', Number(e.target.value))}
                  label={t('modal.alternatives', locale)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                  }}
                >
                  {[2, 3, 4, 5, 6].map((count) => (
                    <MenuItem key={count} value={count}>
                      {t('modal.alternatives_plural', locale, { count })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            '&:hover': {
              borderColor: 'rgba(255,255,255,0.5)',
              backgroundColor: 'rgba(255,255,255,0.1)',
            },
          }}
        >
          {t('modal.cancel', locale)}
        </Button>
        <Button
          onClick={handleStartGame}
          variant="contained"
          data-testid="start-game-button"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          {t('modal.start', locale)}
        </Button>
      </DialogActions>
    </Dialog>
  );
}