"use client";

import { useRouter } from "next/navigation";
import { Button, AppBar, Toolbar, Typography, Box, IconButton, Card, CardContent, CardActions, Grid, Container } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllMapConfigs } from "@/config/maps";
import { t } from "@/i18n";
import { useState } from "react";
import type { Locale } from "@/i18n/config";

export default function LandingPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [locale, setLocale] = useState<Locale>("no");
  const maps = getAllMapConfigs();

  const handleMapSelect = (mapId: string) => {
    router.push(`/game/${mapId}`);
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
            🗺️ {t('app.title', locale)}
          </Typography>
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
            Velg et kart å spille
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
            Test din geografikunne med interaktive kartkveiss. Velg et kart nedenfor for å begynne!
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
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  },
                }}
              >
                {mapConfig.previewImage && (
                  <Box
                    component="img"
                    src={mapConfig.previewImage}
                    alt={mapConfig.name}
                    sx={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {mapConfig.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {mapConfig.description}
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
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        borderRadius: 1,
                        color: '#667eea',
                        fontWeight: 500,
                      }}
                    >
                      {mapConfig.featureCount} områder
                    </Typography>
                    {mapConfig.difficulty && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          backgroundColor: 'rgba(118, 75, 162, 0.1)',
                          borderRadius: 1,
                          color: '#764ba2',
                          fontWeight: 500,
                        }}
                      >
                        {mapConfig.difficulty === 'easy'
                          ? 'Lett'
                          : mapConfig.difficulty === 'medium'
                          ? 'Middels'
                          : 'Vanskelig'}
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
                    Spill
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {maps.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Ingen kart tilgjengelig
            </Typography>
          </Box>
        )}
      </Container>
    </div>
  );
}
