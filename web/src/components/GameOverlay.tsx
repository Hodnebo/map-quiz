'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Drawer, Collapse, Fab } from '@mui/material';
import { Settings as SettingsIcon, Close as CloseIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import GameSettings from './GameSettings';
import type { GameSettings as GameSettingsType, GameState } from '@/lib/types';
import { getEffectiveSettings } from '@/lib/gameModes';
import { t } from '@/i18n';
import type { Locale } from '@/i18n/config';

interface GameOverlayProps {
  state: GameState;
  settings: GameSettingsType;
  effectiveSettings: ReturnType<typeof getEffectiveSettings>;
  onSettingsChange: (settings: GameSettingsType) => void;
  allIdsLength: number;
  targetName?: string | null;
  attemptsLeft?: number;
  showSettings?: boolean;
  locale?: Locale;
}

export default function GameOverlay({
  state,
  settings,
  effectiveSettings,
  onSettingsChange,
  allIdsLength,
  targetName,
  attemptsLeft,
  showSettings = true,
  locale = 'no'
}: GameOverlayProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);

  return (
    <>
      {/* Compact toggle button for mobile */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 11,
          gap: 1,
          alignItems: 'center',
        }}
      >
        {/* Compact score badge */}
        {!statsExpanded && (
          <Card
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 3,
            }}
            onClick={() => setStatsExpanded(true)}
          >
            <CardContent sx={{ p: 0.75, '&:last-child': { pb: 0.75 }, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1, color: '#666', display: 'block' }}>
                  {t('game.points', locale)}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2, color: '#1a1a1a' }}>
                  {state.score}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1, color: '#666', display: 'block' }}>
                  {t('game.round', locale)}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2, color: '#1a1a1a' }}>
                  {state.currentRound}/{settings.rounds}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}
        <IconButton
          size="small"
          onClick={() => setStatsExpanded(!statsExpanded)}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            boxShadow: 2,
            width: 40,
            height: 40,
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          {statsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* Game Stats Overlay - Top Right */}
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 8, sm: 16 },
          right: { xs: 8, sm: 16 },
          left: { xs: 8, sm: 'auto' },
          zIndex: 10,
          display: { xs: statsExpanded ? 'flex' : 'none', sm: 'flex' },
          flexDirection: 'column',
          gap: 1,
          maxWidth: { xs: '100%', sm: 250 },
          minWidth: { xs: 'auto', sm: 200 },
          pt: { xs: 6, sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          <Card
            sx={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 0.75, sm: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 1 } } }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1, color: '#666', fontWeight: 500 }}>
                {t('game.points', locale)}
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600, lineHeight: 1, color: '#1a1a1a' }}>
                {state.score}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 0.75, sm: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 1 } } }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1, color: '#666', fontWeight: 500 }}>
                {t('game.streak', locale)}
              </Typography>
              <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600, lineHeight: 1, color: '#1a1a1a' }}>
                {state.streak}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: { xs: 0.75, sm: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 1 } } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: '#666', fontWeight: 500 }}>
                {t('game.round', locale)} {state.currentRound}/{settings.rounds}
              </Typography>
              {showSettings && (
                <IconButton
                  size="small"
                  onClick={() => setSettingsOpen(true)}
                  sx={{ p: { xs: 0.25, sm: 0.5 } }}
                >
                  <SettingsIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>


        {/* Current Target Info */}
        {state.status === "playing" && targetName && settings.gameMode !== 'reverse_quiz' && (
          <Card
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, mb: 0.5, color: '#666', fontWeight: 500 }}>
                {t('map.findArea', locale)}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 600, mb: 0.5, color: '#1a1a1a' }}>
                {targetName}
              </Typography>
              {attemptsLeft !== undefined && (
                <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, color: '#666' }}>
                  {t('map.attemptsLeft', locale, { count: attemptsLeft })}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {state.status === "ended" && (
          <Card
            sx={{
              backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: { xs: 1, sm: 1.5 }, '&:last-child': { pb: { xs: 1, sm: 1.5 } } }}>
              <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, fontWeight: 600, color: 'white', textAlign: 'center' }}>
                {t('game.finished', locale)}
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Settings Drawer */}
      {showSettings && (
        <Drawer
          anchor="right"
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          PaperProps={{
            sx: { width: 320, p: 2 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">{t('settings.title', locale)}</Typography>
            <IconButton onClick={() => setSettingsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <GameSettings
            settings={settings}
            effectiveSettings={effectiveSettings}
            onSettingsChange={onSettingsChange}
            allIdsLength={allIdsLength}
            isGameActive={state.status !== 'idle'}
          />
        </Drawer>
      )}
    </>
  );
}