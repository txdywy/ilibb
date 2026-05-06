import fs from 'fs';
import path from 'path';
import { getAiScore } from '../utils';
import pLimit from 'p-limit';

const limit = pLimit(1); // AI API usually has lower rate limits or costs more

async function processScoring() {
  const libPath = path.join(process.cwd(), 'data/libraries.json');
  if (!fs.existsSync(libPath)) {
    console.error('libraries.json not found');
    return;
  }

  const libraries = JSON.parse(fs.readFileSync(libPath, 'utf-8'));
  console.log(`Scoring ${libraries.length} libraries...`);

  const scoredLibraries = await Promise.all(
    libraries.map((lib: any) =>
      limit(async () => {
        if (lib.score) return lib; // Skip already scored
        try {
          const score = await getAiScore(lib);
          return { ...lib, score };
        } catch (error) {
          console.error(`Failed to score ${lib.name}:`, error);
          return lib;
        }
      })
    )
  );

  fs.writeFileSync(
    libPath,
    JSON.stringify(scoredLibraries, null, 2)
  );
  console.log('Scoring complete.');
}

processScoring().catch(console.error);
