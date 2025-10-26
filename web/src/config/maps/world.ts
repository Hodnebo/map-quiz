import { MapConfigWithMetadata } from './types';

export const worldMapConfig: MapConfigWithMetadata = {
  id: 'world',
  name: 'World Countries',
  dataPath: '/data/world_simplified.geo.json',
  center: [0, 20],
  initialZoom: 2,
  bounds: [[-180, -90], [180, 90]],
  language: 'en',
  descriptionKey: 'maps.world.description',
  nameKey: 'maps.world.name',
  featureCount: 177,
  difficulty: 'expert',
  color: '#2ecc71',
  category: 'global',
  subcategory: 'countries'
};