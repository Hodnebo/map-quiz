"use client";

import { useRouter } from "next/navigation";
import { Button, AppBar, Toolbar, Typography, Box, IconButton, Container } from "@mui/material";
import { DarkMode as DarkModeIcon, LightMode as LightModeIcon } from "@mui/icons-material";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllMapConfigs } from "@/config/maps";
import { t } from "@/i18n";
import { useState, useEffect, useMemo } from "react";
import type { Locale } from "@/i18n/config";
import { detectBrowserLocale } from "@/i18n/utils";
import MapCategory from "@/components/MapCategory";
import type { MapConfigWithMetadata } from "@/config/maps/types";

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

  // Group maps by category
  const categorizedMaps = useMemo(() => {
    const categories = {
      global: maps.filter(map => map.category === 'global'),
      norway: maps.filter(map => map.category === 'norway'),
      usa: maps.filter(map => map.category === 'usa'),
      europe: maps.filter(map => map.category === 'europe'),
      asia: maps.filter(map => map.category === 'asia'),
    };
    return categories;
  }, [maps]);

  // Category configuration
  const categoryConfig = {
    global: {
      title: t('categories.global', locale),
      icon: '🌍',
      description: t('categories.globalDescription', locale),
      defaultExpanded: true
    },
    norway: {
      title: t('categories.norway', locale),
      icon: '🇳🇴',
      description: t('categories.norwayDescription', locale),
      defaultExpanded: false
    },
    usa: {
      title: t('categories.usa', locale),
      icon: '🇺🇸',
      description: t('categories.usaDescription', locale),
      defaultExpanded: false
    },
    europe: {
      title: t('categories.europe', locale),
      icon: '🇪🇺',
      description: t('categories.europeDescription', locale),
      defaultExpanded: false
    },
    asia: {
      title: t('categories.asia', locale),
      icon: '🇦🇸',
      description: t('categories.asiaDescription', locale),
      defaultExpanded: false
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 grid grid-rows-[auto_1fr]">
      <AppBar
        position="static"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderBottom: 'none',
        }}
      >
        <Toolbar sx={{
          pt: 'env(safe-area-inset-top)',
          pl: 'env(safe-area-inset-left)',
          pr: 'env(safe-area-inset-right)'
        }}>
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

      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6, md: 8 }, overflowY: 'auto', height: '100%' }}>
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

        {/* Categorized Maps */}
        {Object.entries(categorizedMaps).map(([categoryKey, categoryMaps]) => {
          if (categoryMaps.length === 0) return null;
          
          const config = categoryConfig[categoryKey as keyof typeof categoryConfig];
          return (
            <MapCategory
              key={categoryKey}
              title={config.title}
              icon={config.icon}
              description={config.description}
              maps={categoryMaps}
              defaultExpanded={config.defaultExpanded}
              locale={locale}
            />
          );
        })}

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
