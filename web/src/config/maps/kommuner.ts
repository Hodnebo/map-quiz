import type { MapConfigWithMetadata } from './types';

export const kommunerMapConfig: MapConfigWithMetadata = {
  id: 'kommuner',
  dataPath: '/data/kommuner_simplified.geo.json',
  center: [10.7522, 65.0],
  initialZoom: 4.5,
  bounds: [
    [4.5, 57.96],
    [31.17, 71.19],
  ],
  language: 'no',
  nameKey: 'maps.kommuner.name',
  descriptionKey: 'maps.kommuner.description',
  featureCount: 357,
  difficulty: 'expert',
};
