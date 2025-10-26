import { MapConfigWithMetadata } from './types';

export const oceaniaAsiaMapConfig: MapConfigWithMetadata = {
  id: 'oceania_asia',
  name: 'Oceania & Asia',
  dataPath: '/data/oceania_asia.geo.json',
  center: [120, 10],
  initialZoom: 2,
  bounds: [[70, -50], [180, 60]],
  language: 'en',
  descriptionKey: 'maps.oceania_asia.description',
  nameKey: 'maps.oceania_asia.name',
  featureCount: 54,
  difficulty: 'expert',
  color: '#9b59b6',
  category: 'global',
  subcategory: 'continents'
};
