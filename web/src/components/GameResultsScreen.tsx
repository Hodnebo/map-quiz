'use client';

import { useMemo } from 'react';
import { Box, Card, CardContent, Typography, Button, Fade, Zoom } from '@mui/material';
import { Refresh as RefreshIcon, Settings as SettingsIcon, EmojiEvents as TrophyIcon, Star as StarIcon } from '@mui/icons-material';
import { t } from '@/i18n';
import type { Locale } from '@/i18n/config';

interface GameResultsScreenProps {
  score: number;
  correctAnswers: number;
  totalRounds: number;
  onRestart: () => void;
  onNewGame: () => void;
  locale: Locale;
}

export default function GameResultsScreen({
  score,
  correctAnswers,
  totalRounds,
  onRestart,
  onNewGame,
  locale,
}: GameResultsScreenProps) {
  // Calculate percentage
  const percentage = useMemo(() => {
    if (totalRounds === 0) return 0;
    return Math.round((correctAnswers / totalRounds) * 100);
  }, [correctAnswers, totalRounds]);

  // Determine congratulations message based on percentage
  const congratulationsKey = useMemo(() => {
    if (percentage >= 90) return 'results.congratulations.excellent';
    if (percentage >= 75) return 'results.congratulations.great';
    if (percentage >= 60) return 'results.congratulations.good';
    if (percentage >= 40) return 'results.congratulations.notBad';
    return 'results.congratulations.keepPracticing';
  }, [percentage]);

  // Calculate star rating (1-5 stars)
  const starCount = useMemo(() => {
    if (percentage >= 90) return 5;
    if (percentage >= 75) return 4;
    if (percentage >= 60) return 3;
    if (percentage >= 40) return 2;
    return 1;
  }, [percentage]);

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 2, sm: 3 },
        }}
      >
        <Zoom in timeout={400}>
          <Card
            sx={{
              maxWidth: 500,
              width: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              borderRadius: 4,
              overflow: 'visible',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              {/* Trophy Icon */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <TrophyIcon sx={{ fontSize: 48, color: 'white' }} />
                </Box>
              </Box>

              {/* Title */}
              <Typography
                variant="h4"
                sx={{
                  color: 'white',
                  fontWeight: 700,
                  mb: 1,
                  fontSize: { xs: '1.75rem', sm: '2.125rem' },
                }}
              >
                {t('results.title', locale)}
              </Typography>

              {/* Congratulations Message */}
              <Typography
                variant="h6"
                sx={{
                  color: 'rgba(255, 255, 255, 0.95)',
                  fontWeight: 500,
                  mb: 3,
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                }}
              >
                {t(congratulationsKey, locale)}
              </Typography>

              {/* Star Rating */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 3 }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon
                    key={i}
                    sx={{
                      fontSize: { xs: 28, sm: 36 },
                      color: i < starCount ? '#FFD700' : 'rgba(255, 255, 255, 0.3)',
                      filter: i < starCount ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none',
                    }}
                  />
                ))}
              </Box>

              {/* Stats Card */}
              <Box
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: 3,
                  p: 3,
                  mb: 3,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Score */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}
                    >
                      {t('results.score', locale)}
                    </Typography>
                    <Typography
                      variant="h3"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        fontSize: { xs: '2rem', sm: '2.5rem' },
                      }}
                    >
                      {score}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Box
                    sx={{
                      height: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />

                  {/* Correct Answers */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}
                    >
                      {t('results.correctAnswers', locale)}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' },
                      }}
                    >
                      {correctAnswers} {t('results.outOf', locale)} {totalRounds}
                    </Typography>
                  </Box>

                  {/* Divider */}
                  <Box
                    sx={{
                      height: 1,
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    }}
                  />

                  {/* Accuracy */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem', mb: 0.5 }}
                    >
                      {t('results.accuracy', locale)}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: { xs: '1.5rem', sm: '1.75rem' },
                      }}
                    >
                      {percentage}%
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<RefreshIcon />}
                  onClick={onRestart}
                  sx={{
                    backgroundColor: 'white',
                    color: '#667eea',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '1rem',
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                    },
                  }}
                >
                  {t('results.restart', locale)}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<SettingsIcon />}
                  onClick={onNewGame}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    color: 'white',
                    fontWeight: 600,
                    py: 1.5,
                    fontSize: '1rem',
                    textTransform: 'none',
                    borderWidth: 2,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderWidth: 2,
                    },
                  }}
                >
                  {t('results.newGame', locale)}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Zoom>
      </Box>
    </Fade>
  );
}
