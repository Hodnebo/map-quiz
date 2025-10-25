import type { MapConfigWithMetadata } from './types';
import type { MapId } from './types';
import { osloMapConfig } from './oslo';
import { kommunerMapConfig } from './kommuner';
import { fylkerMapConfig } from './fylker';

// Registry of all available maps
const mapRegistry: Record<MapId, MapConfigWithMetadata> = {
  oslo: osloMapConfig,
  kommuner: kommunerMapConfig,
  fylker: fylkerMapConfig,
};

/**
 * Get a specific map configuration by ID
 */
export function getMapConfig(mapId: MapId): MapConfigWithMetadata {
  const config = mapRegistry[mapId];
  if (!config) {
    throw new Error(`Map configuration not found for mapId: ${mapId}`);
  }
  return config;
}

/**
 * Get all available map configurations
 */
export function getAllMapConfigs(): MapConfigWithMetadata[] {
  return Object.values(mapRegistry);
}

/**
 * Get all available map IDs
 */
export function getAllMapIds(): MapId[] {
  return Object.keys(mapRegistry) as MapId[];
}

/**
 * Check if a map ID exists
 */
export function hasMapConfig(mapId: string): mapId is MapId {
  return mapId in mapRegistry;
}

/**
 * Get the default map ID (first one in registry)
 */
export function getDefaultMapId(): MapId {
  return 'oslo';
}

export type { MapId, MapConfigWithMetadata };
