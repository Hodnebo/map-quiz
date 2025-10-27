'use client';

import { useState } from 'react';
import { Card, CardContent, Typography, Box, IconButton, Drawer } from '@mui/material';
import { Settings as SettingsIcon, Close as CloseIcon } from '@mui/icons-material';
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
  const [mobileStatsExpanded, setMobileStatsExpanded] = useState(false);

  return (
    <>
      {/* Mobile Stats - Expandable/Collapsible */}
      <Box
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'absolute',
          top: 80,
          right: 8,
          zIndex: 11,
          pr: 'env(safe-area-inset-right)',
          maxWidth: 180,
        }}
        onClick={() => setMobileStatsExpanded(!mobileStatsExpanded)}
      >
        <Card
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            },
          }}
        >
          {!mobileStatsExpanded ? (
            // Compact View
            <CardContent sx={{ p: 0.5, '&:last-child': { pb: 0.5 }, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {/* Score */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1, color: '#999', minWidth: 20 }}>
                  {t('game.points', locale).charAt(0).toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1, color: '#1a1a1a' }}>
                  {state.score}
                </Typography>
              </Box>
              
              {/* Correct Answers */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1, color: '#4caf50', minWidth: 20 }}>
                  ✓
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1, color: '#1a1a1a' }}>
                  {state.correctAnswers}/{state.currentRound}
                </Typography>
              </Box>
              
              {/* Round */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: '0.5rem', lineHeight: 1, color: '#999', minWidth: 20 }}>
                  {t('game.round', locale).charAt(0).toUpperCase()}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 700, lineHeight: 1, color: '#1a1a1a' }}>
                  {state.currentRound}/{settings.rounds}
                </Typography>
              </Box>
            </CardContent>
          ) : (
            // Expanded View
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 }, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Score & Streak Row */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1, backgroundColor: 'rgba(103, 126, 234, 0.1)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', fontWeight: 500 }}>
                    {t('game.points', locale)}
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
                    {state.score}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center', p: 1, backgroundColor: 'rgba(103, 126, 234, 0.1)', borderRadius: 1 }}>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#666', fontWeight: 500 }}>
                    {t('game.streak', locale)}
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.2 }}>
                    {state.streak}
                  </Typography>
                </Box>
              </Box>

              {/* Correct Answers */}
              <Box sx={{ p: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1, border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.25rem' }}>✓</Typography>
                    <Box>
                      <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#2e7d32', fontWeight: 500 }}>
                        {t('results.correctAnswers', locale)}
                      </Typography>
                      <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700, color: '#1b5e20', lineHeight: 1.2 }}>
                        {state.correctAnswers} / {state.currentRound}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h5" sx={{ fontSize: '1.5rem', fontWeight: 700, color: state.currentRound > 0 ? `rgba(76, 175, 80, ${Math.max(0.3, state.correctAnswers / state.currentRound)})` : 'rgba(76, 175, 80, 0.3)' }}>
                    {state.currentRound > 0 ? Math.round((state.correctAnswers / state.currentRound) * 100) : 0}%
                  </Typography>
                </Box>
              </Box>

              {/* Round Info */}
              <Box sx={{ textAlign: 'center', p: 0.5 }}>
                <Typography variant="body2" sx={{ fontSize: '0.75rem', color: '#666', fontWeight: 500 }}>
                  {t('game.round', locale)} {state.currentRound}/{settings.rounds}
                </Typography>
              </Box>
            </CardContent>
          )}
        </Card>
      </Box>

      {/* Game Stats Overlay - Top Right (Desktop only) */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          gap: 1,
          maxWidth: 250,
          minWidth: 200,
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
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '2px solid rgba(76, 175, 80, 0.3)',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: { xs: 0.75, sm: 1 }, '&:last-child': { pb: { xs: 0.75, sm: 1 } } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: { xs: 32, sm: 40 },
                  height: { xs: 32, sm: 40 },
                  borderRadius: '50%',
                  backgroundColor: 'rgba(76, 175, 80, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>✓</Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, lineHeight: 1, color: '#2e7d32', fontWeight: 500 }}>
                  {t('results.correctAnswers', locale)}
                </Typography>
                <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, fontWeight: 600, lineHeight: 1.2, color: '#1b5e20' }}>
                  {state.correctAnswers} / {state.currentRound}
                </Typography>
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '2rem' }, 
                  fontWeight: 700, 
                  color: state.currentRound > 0 ? 
                    `rgba(76, 175, 80, ${Math.max(0.3, state.correctAnswers / state.currentRound)})` : 
                    'rgba(76, 175, 80, 0.3)',
                  minWidth: { xs: 48, sm: 60 },
                  textAlign: 'right',
                }}
              >
                {state.currentRound > 0 ? Math.round((state.correctAnswers / state.currentRound) * 100) : 0}%
              </Typography>
            </Box>
          </CardContent>
        </Card>

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