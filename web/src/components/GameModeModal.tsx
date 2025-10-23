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
  FormControlLabel,
  Switch,
  Chip,
  Stack,
} from '@mui/material';
import { GameMode, GameSettings } from '@/lib/types';
import { gameModeRegistry } from '@/lib/gameModeRegistry';

interface GameModeModalProps {
  open: boolean;
  onClose: () => void;
  onStartGame: (mode: GameMode, settings: GameSettings) => void;
  currentMode?: GameMode;
  currentSettings?: GameSettings;
}

export function GameModeModal({
  open,
  onClose,
  onStartGame,
  currentMode,
  currentSettings,
}: GameModeModalProps) {
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [settings, setSettings] = useState<GameSettings>({
    rounds: 10,
    maxAttempts: 3,
    difficulty: 'medium',
    alternativesCount: 4,
  });

  // Initialize with current values if provided
  useEffect(() => {
    if (currentMode) {
      setSelectedMode(currentMode);
    }
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentMode, currentSettings]);

  const handleModeChange = (mode: GameMode) => {
    setSelectedMode(mode);
    // Reset settings to defaults for the new mode
    const modeStrategy = gameModeRegistry.getMode(mode);
    const defaultSettings = modeStrategy.getDefaultSettings();
    setSettings(defaultSettings);
  };

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStartGame = () => {
    onStartGame(selectedMode, settings);
    onClose();
  };

  const selectedModeStrategy = gameModeRegistry.getMode(selectedMode);
  const settingsProps = selectedModeStrategy.getSettingsProps();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h4" component="h1" textAlign="center" fontWeight="bold">
          🗺️ Velg spillmodus
        </Typography>
        <Typography variant="body2" textAlign="center" sx={{ mt: 1, opacity: 0.9 }}>
          Velg hvordan du vil spille Oslo-kartet
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* Game Mode Selection */}
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Spillmodus
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
            {gameModeRegistry.getAllModes().map((strategy) => {
              const isSelected = selectedMode === strategy.id;
              return (
                <Chip
                  key={strategy.id}
                  label={strategy.name}
                  onClick={() => handleModeChange(strategy.id as GameMode)}
                  variant={isSelected ? 'filled' : 'outlined'}
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
            Innstillinger
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Rounds */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>Antall runder</InputLabel>
              <Select
                value={settings.rounds}
                onChange={(e) => handleSettingChange('rounds', Number(e.target.value))}
                label="Antall runder"
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
                {[5, 10, 15, 20, 25, 30].map((rounds) => (
                  <MenuItem key={rounds} value={rounds}>
                    {rounds} runder
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Max Attempts */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'white' }}>Maks forsøk per runde</InputLabel>
              <Select
                value={settings.maxAttempts}
                onChange={(e) => handleSettingChange('maxAttempts', Number(e.target.value))}
                label="Maks forsøk per runde"
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
                    {attempts} forsøk
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Difficulty (only show if the mode supports it) */}
            {settingsProps.showDifficulty && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Vanskelighet</InputLabel>
                <Select
                  value={settings.difficulty}
                  onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                  label="Vanskelighet"
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
                  <MenuItem value="easy">Lett</MenuItem>
                  <MenuItem value="medium">Middels</MenuItem>
                  <MenuItem value="hard">Vanskelig</MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Alternatives Count (only show if the mode supports it) */}
            {settingsProps.showAlternatives && (
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'white' }}>Antall alternativer</InputLabel>
                <Select
                  value={settings.alternativesCount}
                  onChange={(e) => handleSettingChange('alternativesCount', Number(e.target.value))}
                  label="Antall alternativer"
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
                      {count} alternativer
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
          Avbryt
        </Button>
        <Button
          onClick={handleStartGame}
          variant="contained"
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.3)',
            },
          }}
        >
          Start spill
        </Button>
      </DialogActions>
    </Dialog>
  );
}