import type { MapConfig } from '@/lib/types';

export interface MapConfigWithMetadata extends MapConfig {
  descriptionKey: string;
  nameKey: string;
  featureCount: number;
  previewImage?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export type MapId = 'oslo';
