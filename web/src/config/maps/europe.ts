import { MapConfigWithMetadata } from './types';

export const europeMapConfig: MapConfigWithMetadata = {
  id: 'europe',
  name: 'Europe Countries',
  dataPath: '/data/europe_simplified.geo.json',
  center: [10, 55],
  initialZoom: 4,
  bounds: [[-25, 35], [45, 75]],
  language: 'en',
  descriptionKey: 'maps.europe.description',
  nameKey: 'maps.europe.name',
  featureCount: 39,
  difficulty: 'hard',
  color: '#3498db',
  category: 'global',
  subcategory: 'countries'
};
