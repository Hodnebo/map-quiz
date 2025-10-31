import fs from "node:fs/promises";
import path from "node:path";
import fetch from "node-fetch";
import centroid from "@turf/centroid";
import area from "@turf/area";
import { topology as topoFromGeojson } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";

const ROOT = path.resolve(process.cwd(), "..");
const WEB_PUBLIC = path.join(ROOT, "web", "public", "data");
const FULL_OUT = path.join(WEB_PUBLIC, "bydeler.geo.json");
const SIMPLE_OUT = path.join(WEB_PUBLIC, "bydeler_simplified.geo.json");

// Prefer authoritative remote GeoJSON via DATA_URL; otherwise fall back to local placeholder file.
const DATA_URL = process.env.DATA_URL || "https://raw.githubusercontent.com/oslokart/kommune-og-bydelsfakta/main/geodata/bydeler.geo.json";

function slugify(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function loadLocalFallback(): Promise<any> {
  try {
    const buf = await fs.readFile(SIMPLE_OUT, "utf8");
    return JSON.parse(buf);
  } catch (err) {
    // If no local file exists, create a minimal fallback
    console.warn(`[data] No local fallback file found at ${SIMPLE_OUT}. Creating minimal fallback.`);
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { DELBYDELSN: "Gamle Oslo", bydelsnummer: 1 },
          geometry: {
            type: "Polygon",
            coordinates: [[[10.7, 59.9], [10.8, 59.9], [10.8, 60.0], [10.7, 60.0], [10.7, 59.9]]]
          }
        }
      ]
    };
  }
}

async function loadSource(): Promise<any> {
  // Remote fetch if http(s)
  if (DATA_URL && /^https?:\/\//i.test(DATA_URL)) {
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}: ${res.status}`);
      return await res.json();
    } catch (err: any) {
      console.warn(`[data] Warning: ${err?.message ?? String(err)}. Falling back to local placeholder.`);
      return loadLocalFallback();
    }
  }
  // If set but not http, treat as file path (absolute or relative to repo root)
  if (DATA_URL && !/^https?:\/\//i.test(DATA_URL)) {
    try {
      const filePath = path.isAbsolute(DATA_URL) ? DATA_URL : path.join(ROOT, DATA_URL);
      const buf = await fs.readFile(filePath, "utf8");
      return JSON.parse(buf);
    } catch (err: any) {
      console.warn(`[data] Warning: ${err?.message ?? String(err)}. Falling back to local placeholder.`);
      return loadLocalFallback();
    }
  }
  // Default local fallback: current simplified file
  return loadLocalFallback();
}

function pickName(props: any, idx: number): string {
  const candidate = props.DELBYDELSN
    ?? props.DELBYDEL
    ?? props.BYDELSNAVN
    ?? props.BYDEL
    ?? props.name
    ?? props.NAVN
    ?? props.bydel_navn
    ?? props.bydel
    ?? props.navn;
  if (!candidate) throw new Error(`Feature ${idx} missing name property`);
  return String(candidate);
}

function pickId(props: any, idx: number): string {
  const candidate = props.id
    ?? props.DELBYDEL
    ?? props.FID
    ?? props.BYDEL_NR
    ?? props.bydel_nr
    ?? props.number
    ?? idx;
  return String(candidate);
}

function validateAndNormalize(gj: any) {
  if (gj?.type !== "FeatureCollection" || !Array.isArray(gj.features)) {
    throw new Error("Input must be a GeoJSON FeatureCollection");
  }

  const features = gj.features.map((f: any, idx: number) => {
    if (!f || f.type !== "Feature") throw new Error(`Feature ${idx} is not a Feature`);
    const props = f.properties ?? {};
    const name = pickName(props, idx);
    const id = pickId(props, idx);

    // Compute centroid in WGS84
    const c = centroid(f as any);

    const areaKm2 = area(f as any) / 1_000_000;

    return {
      type: "Feature",
      id,
      properties: {
        id,
        name,
        slug: slugify(String(name)),
        area_km2: Number(areaKm2.toFixed(3)),
        centroid: c.geometry.coordinates,
      },
      geometry: f.geometry,
    };
  });

  return { type: "FeatureCollection", features };
}

async function main() {
  await ensureDir(WEB_PUBLIC);
  const source = await loadSource();
  const normalized = validateAndNormalize(source);
  await fs.writeFile(FULL_OUT, JSON.stringify(normalized));

  // Dynamically import topojson-client only when needed
  const topojsonClient = await import("topojson-client");
  const topo = topoFromGeojson({ collection: normalized });
  const pre = presimplify(topo);
  const simpleTopo = simplify(pre, 1e-6);
  const simplified = topojsonClient.feature(simpleTopo as any, (simpleTopo as any).objects.collection);

  await fs.writeFile(SIMPLE_OUT, JSON.stringify(simplified));
  console.log(`Wrote: ${FULL_OUT} and ${SIMPLE_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 