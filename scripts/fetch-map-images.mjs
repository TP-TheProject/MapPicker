#!/usr/bin/env node
/**
 * Downloads the `splash` image for each standard Valorant map from valorant-api.com and
 * writes a local, size-optimized webp fallback to public/maps/<slug>.webp.
 *
 * Re-run whenever the standard map pool changes (new map added/removed/renamed):
 *   node scripts/fetch-map-images.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "../public/maps");
const MAPS_API_URL = "https://valorant-api.com/v1/maps";
const TARGET_WIDTH = 960;
const WEBP_QUALITY = 75;

function slugify(name) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log(`Fetching map list from ${MAPS_API_URL}...`);
  const response = await fetch(MAPS_API_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching map list`);
  }
  const { data } = await response.json();

  const standardMaps = data.filter((map) => map.tacticalDescription !== null && map.splash);
  console.log(`Found ${standardMaps.length} standard maps.`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const map of standardMaps) {
    const slug = slugify(map.displayName);
    const outputPath = path.join(OUTPUT_DIR, `${slug}.webp`);

    console.log(`- ${map.displayName} -> ${path.relative(process.cwd(), outputPath)}`);
    const imageResponse = await fetch(map.splash);
    if (!imageResponse.ok) {
      console.warn(`  skipped: HTTP ${imageResponse.status} fetching splash`);
      continue;
    }
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    const webp = await sharp(buffer)
      .resize({ width: TARGET_WIDTH, height: Math.round((TARGET_WIDTH * 9) / 16), fit: "cover" })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await writeFile(outputPath, webp);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
