import type { MapConfig } from '@/lib/types';

export interface MapConfigWithMetadata extends MapConfig {
  descriptionKey: string;
  nameKey: string;
  featureCount: number;
  previewImage?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  color?: string;
}

export type MapId = 'oslo' | 'kommuner' | 'fylker' | 'world';
