import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { topology as topoFromGeojson } from 'topojson-server';
import { presimplify, simplify } from 'topojson-simplify';
import * as turf from '@turf/centroid';
import * as turfArea from '@turf/area';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '../../web/public/data');
const DATA_URL = process.env.DATA_URL || 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson';

interface CountryFeature {
  type: 'Feature';
  properties: {
    name: string;
    [key: string]: any;
  };
  geometry: any;
}

interface ProcessedFeature {
  type: 'Feature';
  properties: {
    navn: string;
    centroid: [number, number];
    areal_km2: number;
  };
  geometry: any;
}

async function fetchData(): Promise<any> {
  try {
    console.log('Fetching world countries data...');
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function loadSource(): any {
  try {
    // Try to load from local file first
    const localFile = path.join(__dirname, '../../world.json');
    if (fs.existsSync(localFile)) {
      console.log('Loading from local file...');
      return JSON.parse(fs.readFileSync(localFile, 'utf8'));
    }
    
    // If no local file, return null to trigger fetch
    return null;
  } catch (error) {
    console.error('Error loading local file:', error);
    return null;
  }
}

function loadLocalFallback(): any {
  console.log('Creating minimal fallback GeoJSON...');
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          navn: 'Norway',
          centroid: [10.7522, 59.9139],
          areal_km2: 385207
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[[10.7522, 59.9139], [10.7522, 59.9139], [10.7522, 59.9139], [10.7522, 59.9139]]]
        }
      }
    ]
  };
}

function processFeatures(features: CountryFeature[]): ProcessedFeature[] {
  return features
    .filter(feature => {
      // Filter out very small countries and territories
      const area = turfArea.default(feature);
      return area > 1000; // At least 1 km²
    })
    .map(feature => {
      const centroid = turf.default(feature);
      const area = turfArea.default(feature);
      
      return {
        type: 'Feature',
        properties: {
          navn: feature.properties.name || 'Unknown',
          centroid: centroid.geometry.coordinates as [number, number],
          areal_km2: Math.round(area / 1000000) // Convert to km²
        },
        geometry: feature.geometry
      };
    })
    .sort((a, b) => b.properties.areal_km2 - a.properties.areal_km2); // Sort by area descending
}

async function simplifyGeoJSON(geojson: any): Promise<any> {
  console.log('Simplifying GeoJSON...');
  
  // Convert to TopoJSON for better simplification
  const topo = topoFromGeojson({ collection: geojson });
  
  // Simplify with different levels
  const pre = presimplify(topo);
  const simplified = simplify(pre, 1e-6); // More aggressive simplification for world map
  
  // Convert back to GeoJSON
  const topojsonClient = await import('topojson-client');
  const result = topojsonClient.feature(simplified as any, (simplified as any).objects.collection);
  
  return result;
}

async function main() {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let geojson = loadSource();
    
    if (!geojson) {
      geojson = await fetchData();
    }

    if (!geojson || !geojson.features || geojson.features.length === 0) {
      console.log('No valid data found, using fallback...');
      geojson = loadLocalFallback();
    }

    console.log(`Processing ${geojson.features.length} features...`);
    
    const processed = processFeatures(geojson.features);
    console.log(`Filtered to ${processed.length} countries`);

    const result = {
      type: 'FeatureCollection',
      features: processed
    };

    // Save full precision version
    const fullPath = path.join(OUTPUT_DIR, 'world.geo.json');
    fs.writeFileSync(fullPath, JSON.stringify(result, null, 2));
    console.log(`Saved full precision GeoJSON: ${fullPath}`);

    // Simplify and save
    const simplified = await simplifyGeoJSON(result);
    const simplifiedPath = path.join(OUTPUT_DIR, 'world_simplified.geo.json');
    fs.writeFileSync(simplifiedPath, JSON.stringify(simplified, null, 2));
    console.log(`Saved simplified GeoJSON: ${simplifiedPath}`);

    console.log('World countries data processing complete!');
    console.log(`Total countries: ${processed.length}`);
    console.log(`Largest country: ${processed[0]?.properties.navn} (${processed[0]?.properties.areal_km2} km²)`);

  } catch (error) {
    console.error('Error processing world countries data:', error);
    process.exit(1);
  }
}

main();