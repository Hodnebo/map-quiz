import type { MapConfigWithMetadata } from './types';

export const osloMapConfig: MapConfigWithMetadata = {
  id: 'oslo',
  name: 'Oslo Bydeler',
  dataPath: '/data/bydeler_simplified.geo.json',
  center: [10.7522, 59.9139],
  initialZoom: 10,
  bounds: [
    [10.4, 59.7],
    [11.1, 60.1],
  ],
  language: 'no',
  description: 'Test your knowledge of Oslo districts (bydeler)',
  featureCount: 98,
  difficulty: 'hard',
};
