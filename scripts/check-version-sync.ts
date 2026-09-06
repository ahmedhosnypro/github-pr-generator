import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8")) as { version?: string };
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version?: string };

if (typeof manifest.version !== "string" || typeof pkg.version !== "string") {
  console.error('manifest.json and package.json must both declare a string "version"');
  process.exit(1);
}

if (manifest.version !== pkg.version) {
  console.error(
    `version drift: manifest.json is ${manifest.version} but package.json is ${pkg.version} — bump both together`,
  );
  process.exit(1);
}

console.log(`version sync OK: ${pkg.version}`);
