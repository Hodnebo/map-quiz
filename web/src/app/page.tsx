"use client";

import { useRouter } from "next/navigation";
import { Button, AppBar, Toolbar, Typography, Box, IconButton, Card, CardContent, CardActions, Grid, Container } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllMapConfigs } from "@/config/maps";
import { t } from "@/i18n";
import { useState, useEffect } from "react";
import type { Locale } from "@/i18n/config";
import { detectBrowserLocale } from "@/i18n/utils";
import { MapPreview } from "@/components/MapPreview";

export default function LandingPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [locale, setLocale] = useState<Locale>(() => {
    // Initialize from localStorage or browser detection
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('landing_locale');
      if (stored === 'en' || stored === 'no') return stored;
      return detectBrowserLocale();
    }
    return 'no';
  });
  const maps = getAllMapConfigs();

  useEffect(() => {
    localStorage.setItem('landing_locale', locale);
  }, [locale]);

  const toggleLocale = () => {
    setLocale(locale === 'no' ? 'en' : 'no');
  };

  const handleMapSelect = (mapId: string) => {
    router.push(`/game/${mapId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return { bg: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', border: 'rgba(34, 197, 94, 0.2)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', border: 'rgba(245, 158, 11, 0.2)' };
      case 'hard':
        return { bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: 'rgba(239, 68, 68, 0.2)' };
      case 'expert':
        return { bg: 'rgba(220, 38, 127, 0.1)', color: '#be185d', border: 'rgba(220, 38, 127, 0.2)' };
      default:
        return { bg: 'rgba(102, 126, 234, 0.1)', color: '#667eea', border: 'rgba(102, 126, 234, 0.2)' };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 grid grid-rows-[auto_1fr]">
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: 'none',
        }}
      >
        <Toolbar>
          <Typography
            variant="h1"
            component="h1"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1.5rem', sm: '2rem' },
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
          >
            {t('app.title', locale)}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              onClick={toggleLocale}
              sx={{
                color: 'white',
                textTransform: 'uppercase',
                fontWeight: 600,
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {locale === 'no' ? 'EN' : 'NO'}
            </Button>
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              aria-label="toggle theme"
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.5rem' },
              fontWeight: 'bold',
              mb: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('landing.selectMap', locale)}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.125rem' },
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            {t('landing.subtitle', locale)}
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {maps.map((mapConfig) => (
            <Grid item xs={12} sm={6} md={4} key={mapConfig.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme => theme.palette.background.paper,
                  backdropFilter: 'blur(12px)',
                  boxShadow: theme => theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.3)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: theme => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme => theme.palette.mode === 'dark'
                      ? '0 12px 48px rgba(0, 0, 0, 0.4)'
                      : '0 12px 48px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                {/* Dynamic Preview */}
                {mapConfig.color && (
                  <MapPreview
                    featureCount={mapConfig.featureCount}
                    color={mapConfig.color}
                    height={120}
                  />
                )}
                
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {t(mapConfig.nameKey, locale)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t(mapConfig.descriptionKey, locale)}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      flexWrap: 'wrap',
                      mt: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        backgroundColor: theme => theme.palette.mode === 'dark'
                          ? 'rgba(102, 126, 234, 0.2)'
                          : 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 1,
                        color: theme => theme.palette.mode === 'dark' ? '#8aa5ff' : '#667eea',
                        fontWeight: 500,
                      }}
                    >
                      {t('landing.regions', locale, { count: String(mapConfig.featureCount) })}
                    </Typography>
                    {mapConfig.difficulty && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          backgroundColor: getDifficultyColor(mapConfig.difficulty).bg,
                          borderRadius: 1,
                          color: getDifficultyColor(mapConfig.difficulty).color,
                          fontWeight: 600,
                          border: `1px solid ${getDifficultyColor(mapConfig.difficulty).border}`,
                        }}
                      >
                        {t(`modal.${mapConfig.difficulty}`, locale)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleMapSelect(mapConfig.id)}
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      fontWeight: 600,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                      },
                    }}
                  >
                    {t('landing.play', locale)}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {maps.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              {t('landing.noMapsAvailable', locale)}
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}
