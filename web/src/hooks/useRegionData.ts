import { useEffect, useState } from 'react';
import type { Region } from '@/lib/types';
import { getAssetUrl } from '@/lib/basePath';
import { getMapConfig } from '@/config/maps';
import type { MapId } from '@/config/maps';

import type { GeoJSON } from 'geojson';

interface GeoFeatureProperties {
  id: string;
  name: string;
  bydel_number?: string | number;
  area_km2?: number;
  slug?: string;
  centroid?: [number, number];
}

interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  properties: GeoFeatureProperties;
  geometry: GeoJSON.Geometry;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export function useRegionData(mapId: MapId) {
  const [regions, setRegions] = useState<Region[] | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const mapConfig = getMapConfig(mapId);
        const res = await fetch(getAssetUrl(mapConfig.dataPath), {
          cache: 'force-cache',
        });
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        const gj: GeoJSON = await res.json();
        if (cancelled) return;
        setGeojson(gj);
        const mapped: Region[] = gj.features.map((f, idx) => ({
          id: f.properties.id ?? String(f.id ?? idx),
          name: f.properties.name,
          centroid: (f.properties.centroid ?? [0, 0]) as [number, number],
          areaKm2: Number(f.properties.area_km2 ?? 0),
          slug: f.properties.slug ?? String(f.properties.name).toLowerCase().replace(/\s+/g, '-'),
        }));
        setRegions(mapped);
      } catch (e: unknown) {
        if (!cancelled) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mapId]);

  return { regions, geojson, error, loading } as const;
}
