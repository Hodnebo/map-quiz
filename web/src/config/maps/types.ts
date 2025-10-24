import type { MapConfig } from '@/lib/types';

export interface MapConfigWithMetadata extends MapConfig {
  description: string;
  featureCount: number;
  previewImage?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export type MapId = 'oslo';
