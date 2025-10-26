import { MapConfigWithMetadata } from './types';

export const africaMapConfig: MapConfigWithMetadata = {
  id: 'africa',
  name: 'Africa',
  dataPath: '/data/africa.geo.json',
  center: [20, 0],
  initialZoom: 3,
  bounds: [[-20, -35], [55, 37]],
  language: 'en',
  descriptionKey: 'maps.africa.description',
  nameKey: 'maps.africa.name',
  featureCount: 51,
  difficulty: 'hard',
  color: '#e67e22',
  category: 'global',
  subcategory: 'continents'
};
