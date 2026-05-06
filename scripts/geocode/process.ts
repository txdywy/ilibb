import fs from 'fs';
import path from 'path';
import { geocode } from '../utils';
import pLimit from 'p-limit';

const limit = pLimit(5); // AMap allows higher concurrency.

async function processGeocoding() {
  const rawPath = path.join(process.cwd(), 'data/raw_libraries.json');
  if (!fs.existsSync(rawPath)) {
    console.error('raw_libraries.json not found');
    return;
  }

  const libraries = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
  console.log(`Geocoding ${libraries.length} libraries...`);

  const processedLibraries = await Promise.all(
    libraries.map((lib: any) =>
      limit(async () => {
        try {
          if (lib.lat && lib.lng) {
            return {
              ...lib,
              id: Buffer.from(lib.name).toString('base64').substring(0, 10),
              update_time: new Date().toISOString(),
            };
          }
          await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1s delay
          const geo = await geocode(lib.address, lib.name);
          if (geo) {
            return {
              ...lib,
              lat: geo.lat,
              lng: geo.lng,
              district: lib.district || geo.district,
              id: Buffer.from(lib.name).toString('base64').substring(0, 10), // Simple ID
              update_time: new Date().toISOString(),
            };
          }
        } catch (error) {
          console.error(`Failed to geocode ${lib.name}:`, error);
        }
        return lib;
      })
    )
  );

  fs.writeFileSync(
    path.join(process.cwd(), 'data/libraries.json'),
    JSON.stringify(processedLibraries.filter((l: any) => l.lat), null, 2)
  );
  console.log('Geocoding complete.');
}

processGeocoding().catch(console.error);
