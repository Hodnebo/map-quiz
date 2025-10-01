import { useEffect, useState } from "react";
import type { Bydel } from "@/src/lib/types";
import { getAssetUrl } from "@/lib/basePath";

interface GeoFeatureProperties {
  id: string;
  name: string;
  bydel_number?: string | number;
  area_km2?: number;
  slug?: string;
  centroid?: [number, number];
}

interface GeoJSONFeature {
  type: "Feature";
  id?: string | number;
  properties: GeoFeatureProperties;
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

export function useBydelerData() {
  const [bydeler, setBydeler] = useState<Bydel[] | null>(null);
  const [geojson, setGeojson] = useState<GeoJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(getAssetUrl("/data/bydeler_simplified.geo.json"), {
          cache: "force-cache",
        });
        if (!res.ok) throw new Error(`Failed to load data: ${res.status}`);
        const gj: GeoJSON = await res.json();
        if (cancelled) return;
        setGeojson(gj);
        const mapped: Bydel[] = gj.features.map((f, idx) => ({
          id: f.properties.id ?? String(f.id ?? idx),
          name: f.properties.name,
          centroid: (f.properties.centroid ?? [0, 0]) as [number, number],
          areaKm2: Number(f.properties.area_km2 ?? 0),
          slug: f.properties.slug ?? String(f.properties.name).toLowerCase().replace(/\s+/g, "-"),
        }));
        setBydeler(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { bydeler, geojson, error, loading } as const;
} 