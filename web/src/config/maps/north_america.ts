import { MapConfigWithMetadata } from './types';

export const northAmericaMapConfig: MapConfigWithMetadata = {
  id: 'north_america',
  name: 'North America',
  dataPath: '/data/north_america.geo.json',
  center: [-100, 40],
  initialZoom: 3,
  bounds: [[-180, 15], [-50, 85]],
  language: 'en',
  descriptionKey: 'maps.north_america.description',
  nameKey: 'maps.north_america.name',
  featureCount: 18,
  difficulty: 'medium',
  color: '#3498db',
  category: 'global',
  subcategory: 'continents'
};
