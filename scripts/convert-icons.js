import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, "..", "icons");

const conversions = [
  { svg: "icon16.svg", png: "icon16.png", size: 16 },
  { svg: "icon48.svg", png: "icon48.png", size: 48 },
  { svg: "icon.svg", png: "icon128.png", size: 128 },
];

for (const { svg, png, size } of conversions) {
  const svgBuffer = readFileSync(resolve(iconsDir, svg));
  const outputPath = resolve(iconsDir, png);

  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);

  console.log(`${svg} -> ${png} (${size}x${size})`);
}

console.log("Done.");
