import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(scriptDir, "..", "icons");

const conversions = [
  { svg: "icon16.svg", png: "icon16.png", size: 16 },
  { svg: "icon48.svg", png: "icon48.png", size: 48 },
  { svg: "icon.svg", png: "icon128.png", size: 128 },
];

const tasks = conversions.map(async ({ svg, png, size }) => {
  const svgBuffer = readFileSync(resolve(iconsDir, svg));
  const outputPath = resolve(iconsDir, png);

  await sharp(svgBuffer).resize(size, size).png().toFile(outputPath);

  console.log(`${svg} -> ${png} (${String(size)}x${String(size)})`);
});

await Promise.all(tasks);

console.log("Done.");
