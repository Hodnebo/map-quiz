'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Drawer } from '@mui/material';
import { Settings as SettingsIcon, Close as CloseIcon } from '@mui/icons-material';
import GameSettings from './GameSettings';
import type { GameSettings as GameSettingsType, GameState } from '@/lib/types';

interface GameOverlayProps {
  state: GameState;
  settings: GameSettingsType;
  onSettingsChange: (settings: GameSettingsType) => void;
  allIdsLength: number;
  targetName?: string | null;
  attemptsLeft?: number;
}

export default function GameOverlay({
  state,
  settings,
  onSettingsChange,
  allIdsLength,
  targetName,
  attemptsLeft
}: GameOverlayProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Game Stats Overlay - Top Right */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          minWidth: 200,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Card sx={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1, color: '#666', fontWeight: 500 }}>
                Poeng
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1, color: '#1a1a1a' }}>
                {state.score}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', lineHeight: 1, color: '#666', fontWeight: 500 }}>
                Streak
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1, color: '#1a1a1a' }}>
                {state.streak}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}>
          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#666', fontWeight: 500 }}>
                Runde {state.currentRound}/{settings.rounds}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setSettingsOpen(true)}
                sx={{ p: 0.5 }}
              >
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        </Card>

        {/* Current Target Info */}
        {state.status === "playing" && targetName && (
          <Card sx={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(8px)' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body2" sx={{ fontSize: '0.7rem', mb: 0.5, color: '#666', fontWeight: 500 }}>
                Finn område
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                {targetName}
              </Typography>
              {attemptsLeft !== undefined && (
                <Typography variant="body2" sx={{ fontSize: '0.7rem', color: '#666' }}>
                  Forsøk igjen: {attemptsLeft} igjen
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {state.status === "ended" && (
          <Card sx={{ backgroundColor: 'rgba(76, 175, 80, 0.95)', backdropFilter: 'blur(8px)' }}>
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="body1" sx={{ fontWeight: 600, color: 'white', textAlign: 'center' }}>
                Ferdig! 🎉
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Settings Drawer */}
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        PaperProps={{
          sx: { width: 320, p: 2 }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Innstillinger</Typography>
          <IconButton onClick={() => setSettingsOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <GameSettings
          settings={settings}
          onSettingsChange={onSettingsChange}
          allIdsLength={allIdsLength}
          isGameActive={state.status !== 'idle'}
        />
      </Drawer>
    </>
  );
}