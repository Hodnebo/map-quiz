'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardContent, CardActions, Typography, Box } from '@mui/material';
import { MapConfigWithMetadata } from '@/config/maps/types';
import { t } from '@/i18n';
import { MapPreview } from './MapPreview';
import type { Locale } from '@/i18n/config';

interface MapCardProps {
  map: MapConfigWithMetadata;
  locale?: Locale;
}

const MapCard: React.FC<MapCardProps> = ({ map, locale = 'no' }) => {
  const router = useRouter();

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
    <Card
      data-testid="map-card"
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
      {map.color && (
        <MapPreview
          featureCount={map.featureCount}
          color={map.color}
          height={120}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }} data-testid="map-name">
          {t(map.nameKey, locale)}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph data-testid="map-description">
          {t(map.descriptionKey, locale)}
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
            {t('landing.regions', locale, { count: String(map.featureCount) })}
          </Typography>
          {map.difficulty && (
            <Typography
              variant="caption"
              sx={{
                px: 1.5,
                py: 0.5,
                backgroundColor: getDifficultyColor(map.difficulty).bg,
                borderRadius: 1,
                color: getDifficultyColor(map.difficulty).color,
                fontWeight: 600,
                border: `1px solid ${getDifficultyColor(map.difficulty).border}`,
              }}
            >
              {t(`modal.${map.difficulty}`, locale)}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => handleMapSelect(map.id)}
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
  );
};

export default MapCard;
