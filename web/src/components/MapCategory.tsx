'use client';

import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, Collapse, IconButton, Chip, Grid } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { MapConfigWithMetadata } from '@/config/maps/types';
import { t } from '@/i18n';
import MapCard from './MapCard';
import type { Locale } from '@/i18n/config';

interface MapCategoryProps {
  title: string;
  icon: string;
  maps: MapConfigWithMetadata[];
  defaultExpanded?: boolean;
  description?: string;
  locale?: Locale;
}

const MapCategory: React.FC<MapCategoryProps> = ({
  title,
  icon,
  maps,
  defaultExpanded = false,
  description,
  locale = 'no'
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const difficultyCounts = maps.reduce((acc, map) => {
    const difficulty = map.difficulty || 'medium';
    acc[difficulty] = (acc[difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFeatures = maps.reduce((sum, map) => sum + map.featureCount, 0);

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
      sx={{
        mb: 3,
        backgroundColor: theme => theme.palette.background.paper,
        backdropFilter: 'blur(12px)',
        boxShadow: theme => theme.palette.mode === 'dark'
          ? '0 8px 32px rgba(0, 0, 0, 0.3)'
          : '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: theme => theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <CardContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 3,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            '&:hover': {
              backgroundColor: theme => theme.palette.action.hover,
            },
          }}
          onClick={handleToggle}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontSize: '2.5rem' }}>
              {icon}
            </Typography>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600,
                  color: 'text.primary',
                  mb: description ? 0.5 : 1,
                }}
              >
                {title}
              </Typography>
              {description && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  {description}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('landing.mapsCount', locale, { count: String(maps.length) })} • {t('landing.areasCount', locale, { count: String(totalFeatures) })}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(difficultyCounts).map(([difficulty, count]) => (
                    <Chip
                      key={difficulty}
                      label={`${t(`modal.${difficulty}`, locale)} (${count})`}
                      size="small"
                      sx={{
                        backgroundColor: getDifficultyColor(difficulty).bg,
                        color: getDifficultyColor(difficulty).color,
                        border: `1px solid ${getDifficultyColor(difficulty).border}`,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
          <IconButton 
            size="small" 
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: theme => theme.palette.action.hover,
              },
            }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
        
        <Collapse in={expanded}>
          <Box sx={{ p: 3, pt: 0 }}>
            <Grid container spacing={2}>
              {maps.map((map) => (
                <Grid item xs={12} md={6} lg={4} key={map.id}>
                  <MapCard map={map} locale={locale} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default MapCategory;
