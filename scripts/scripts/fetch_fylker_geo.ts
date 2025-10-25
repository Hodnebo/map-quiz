import fs from "node:fs/promises";
import path from "node:path";
import centroid from "@turf/centroid";
import area from "@turf/area";
import { topology as topoFromGeojson } from "topojson-server";
import { presimplify, simplify } from "topojson-simplify";

const ROOT = path.resolve(process.cwd(), "..");
const WEB_PUBLIC = path.join(ROOT, "web", "public", "data");
const INPUT_FILE = path.join(ROOT, "scripts/fylker.json");
const FULL_OUT = path.join(WEB_PUBLIC, "fylker.geo.json");
const SIMPLE_OUT = path.join(WEB_PUBLIC, "fylker_simplified.geo.json");

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

async function loadSource(): Promise<any> {
  try {
    const buf = await fs.readFile(INPUT_FILE, "utf8");
    return JSON.parse(buf);
  } catch (err: any) {
    console.warn(`[data] Warning: Could not read ${INPUT_FILE}: ${err?.message ?? String(err)}. Creating minimal fallback.`);
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { fylkesnavn: "Oslo", fylkesnummer: 1 },
          geometry: {
            type: "Polygon",
            coordinates: [[[10.4, 59.8], [11.1, 59.8], [11.1, 60.1], [10.4, 60.1], [10.4, 59.8]]]
          }
        }
      ]
    };
  }
}

function pickName(props: any, idx: number): string {
  const candidate = props.name ?? props.fylkesnavn ?? props.navn;
  if (!candidate) throw new Error(`Feature ${idx} missing name property`);
  return String(candidate);
}

function pickId(props: any, idx: number): string {
  const candidate = props.id ?? props.fylkesnummer ?? idx;
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
  console.log(`Loading from: ${INPUT_FILE}`);
  const source = await loadSource();
  console.log(`Processing ${source.features?.length ?? 0} features...`);

  const normalized = validateAndNormalize(source);
  await fs.writeFile(FULL_OUT, JSON.stringify(normalized));
  console.log(`Wrote full GeoJSON: ${FULL_OUT}`);

  // Dynamically import topojson-client only when needed
  const topojsonClient = await import("topojson-client");
  const topo = topoFromGeojson({ collection: normalized });
  const pre = presimplify(topo);
  const simpleTopo = simplify(pre, 1e-6);
  const simplified = topojsonClient.feature(simpleTopo as any, (simpleTopo as any).objects.collection);

  await fs.writeFile(SIMPLE_OUT, JSON.stringify(simplified));
  console.log(`Wrote simplified GeoJSON: ${SIMPLE_OUT}`);

  const fullSize = (await fs.stat(FULL_OUT)).size;
  const simpleSize = (await fs.stat(SIMPLE_OUT)).size;
  console.log(`Sizes - Full: ${(fullSize / 1024 / 1024).toFixed(2)}MB, Simplified: ${(simpleSize / 1024 / 1024).toFixed(2)}MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
