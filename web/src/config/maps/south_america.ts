import { MapConfigWithMetadata } from './types';

export const southAmericaMapConfig: MapConfigWithMetadata = {
  id: 'south_america',
  name: 'South America',
  dataPath: '/data/south_america.geo.json',
  center: [-60, -15],
  initialZoom: 3,
  bounds: [[-85, -55], [-35, 15]],
  language: 'en',
  descriptionKey: 'maps.south_america.description',
  nameKey: 'maps.south_america.name',
  featureCount: 13,
  difficulty: 'easy',
  color: '#27ae60',
  category: 'global',
  subcategory: 'continents'
};
