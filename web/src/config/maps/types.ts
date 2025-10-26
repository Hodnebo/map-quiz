import type { MapConfig } from '@/lib/types';

export interface MapConfigWithMetadata extends MapConfig {
  descriptionKey: string;
  nameKey: string;
  featureCount: number;
  previewImage?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  color?: string;
  category: 'global' | 'norway' | 'usa' | 'europe' | 'asia';
  subcategory?: string;
}

export type MapId = 'oslo' | 'kommuner' | 'fylker' | 'world' | 'europe' | 'africa' | 'north_america' | 'south_america' | 'oceania_asia';
