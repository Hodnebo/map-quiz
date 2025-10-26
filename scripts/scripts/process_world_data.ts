import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as turf from '@turf/turf';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface WorldFeature {
  type: 'Feature';
  properties: {
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface WorldGeoJSON {
  type: 'FeatureCollection';
  features: WorldFeature[];
}

interface ProcessedFeature {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    name: string;
    slug: string;
    area_km2: number;
    centroid: [number, number];
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function processWorldData() {
  const inputPath = path.join(__dirname, '../../web/public/data/world.json');
  const outputPath = path.join(__dirname, '../../web/public/data/world_simplified.geo.json');
  
  console.log('Reading world.json...');
  const rawData: WorldGeoJSON = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Processing ${rawData.features.length} features...`);
  
  const processedFeatures: ProcessedFeature[] = rawData.features.map((feature, index) => {
    const name = feature.properties.name;
    const id = String(index + 1);
    
    // Calculate centroid and area using turf
    let centroid: [number, number] = [0, 0];
    let areaKm2 = 0;
    
    try {
      const centroidResult = turf.centroid(feature);
      const coords = centroidResult.geometry.coordinates as [number, number];
      
      // Validate coordinates
      const [lng, lat] = coords;
      if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        centroid = coords;
      } else {
        console.warn(`Invalid coordinates for ${name}: [${lng}, ${lat}], using [0, 0]`);
        centroid = [0, 0];
      }
      
      const areaResult = turf.area(feature);
      areaKm2 = Number((areaResult / 1000000).toFixed(3)); // Convert m² to km²
    } catch (error) {
      console.warn(`Error processing feature ${name}:`, error);
      centroid = [0, 0];
    }
    
    return {
      type: 'Feature',
      id,
      properties: {
        id,
        name,
        slug: slugify(name),
        area_km2: areaKm2,
        centroid,
      },
      geometry: feature.geometry,
    };
  });
  
  const processedGeoJSON = {
    type: 'FeatureCollection' as const,
    features: processedFeatures,
  };
  
  console.log('Writing processed data...');
  fs.writeFileSync(outputPath, JSON.stringify(processedGeoJSON, null, 2));
  
  console.log(`✅ Processed ${processedFeatures.length} features`);
  console.log(`✅ Output written to ${outputPath}`);
}

processWorldData();