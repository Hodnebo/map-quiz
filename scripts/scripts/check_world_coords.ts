import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function checkCoordinates() {
  const inputPath = path.join(__dirname, '../../web/public/data/world_simplified.geo.json');
  
  console.log('Reading world_simplified.geo.json...');
  const data: WorldGeoJSON = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  
  console.log(`Checking ${data.features.length} features...`);
  
  let invalidCount = 0;
  
  for (const feature of data.features) {
    const name = feature.properties.name;
    let hasInvalidCoords = false;
    
    const walk = (coords: any) => {
      if (typeof coords[0] === 'number') {
        const [lng, lat] = coords as [number, number];
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90 || 
            isNaN(lng) || isNaN(lat) || !isFinite(lng) || !isFinite(lat)) {
          console.warn(`Invalid coordinates in ${name}: [${lng}, ${lat}]`);
          hasInvalidCoords = true;
        }
      } else {
        for (const c of coords) walk(c);
      }
    };
    
    walk(feature.geometry.coordinates);
    
    if (hasInvalidCoords) {
      invalidCount++;
    }
  }
  
  console.log(`✅ Found ${invalidCount} features with invalid coordinates`);
}

checkCoordinates();