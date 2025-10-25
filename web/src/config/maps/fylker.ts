import type { MapConfigWithMetadata } from './types';

export const fylkerMapConfig: MapConfigWithMetadata = {
  id: 'fylker',
  dataPath: '/data/fylker_simplified.geo.json',
  center: [10.7522, 65.0],
  initialZoom: 4.5,
  bounds: [
    [4.5, 57.96],
    [31.17, 71.19],
  ],
  language: 'no',
  nameKey: 'maps.fylker.name',
  descriptionKey: 'maps.fylker.description',
  featureCount: 15,
  difficulty: 'easy',
  color: '#f39c12',
};
