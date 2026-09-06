import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizeConfig } from "./strip-config";

const root = join(import.meta.dir, "..");
const dist = join(root, "dist");

// The PNGs under icons/ are committed artifacts generated from the SVGs by
// scripts/convert-icons.ts. Regenerate only when they're missing (e.g. a
// checkout that excluded them) so day-to-day builds don't need sharp.
const REQUIRED_ICONS = ["icon16.png", "icon48.png", "icon128.png"];
const missingIcons = REQUIRED_ICONS.filter((name) => !existsSync(join(root, "icons", name)));
if (missingIcons.length > 0) {
  console.warn(`icons/ missing ${missingIcons.join(", ")} — running scripts/convert-icons.ts to regenerate`);
  const conversion = spawnSync(process.execPath, ["run", join(root, "scripts", "convert-icons.ts")], {
    stdio: "inherit",
  });
  const stillMissing = REQUIRED_ICONS.filter((name) => !existsSync(join(root, "icons", name)));
  if (conversion.status !== 0 || stillMissing.length > 0) {
    console.error(`icon conversion failed (still missing: ${stillMissing.join(", ") || "unknown"})`);
    process.exit(1);
  }
}

// Start from a clean slate so stale artifacts from previous builds never linger in dist/.
await rm(dist, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: [join(root, "src/background.ts"), join(root, "src/content.ts"), join(root, "src/popup/popup.ts")],
  outdir: dist,
  target: "browser",
  // self-contained single file per entry: content scripts can't be ESM,
  // and the MV3 service worker must not rely on chunk imports
  splitting: false,
  minify: false,
  sourcemap: "linked",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await mkdir(join(dist, "popup"), { recursive: true });

const files = ["manifest.json", "styles.css", "popup/popup.html", "popup/popup.css"];
await Promise.all(files.map((file) => copyFile(join(root, file), join(dist, file))));
await cp(join(root, "icons"), join(dist, "icons"), { recursive: true });

// Local dev config (gitignored) — copied only when present so a fresh checkout still builds.
// Secret fields are stripped (scripts/strip-config.ts) so dist/ can never carry a real
// API key or PAT into a zip, share, or accidental release; secrets are set via the popup.
const localConfig = join(root, "config.local.json");
if (existsSync(localConfig)) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(localConfig, "utf8"));
  } catch (error) {
    console.error(
      `failed to parse config.local.json: ${error instanceof Error ? error.message : String(error)} — fix or remove the file`,
    );
    process.exit(1);
  }
  const { sanitized, stripped } = sanitizeConfig(parsed);
  await writeFile(join(dist, "config.local.json"), `${JSON.stringify(sanitized, null, 2)}\n`);
  if (stripped.length > 0) {
    console.warn(
      `stripped ${stripped.join(", ")} from dist/config.local.json — set these via the extension popup instead`,
    );
  }
}

for (const output of result.outputs) {
  const relativePath = output.path.replace(`${root}/`, "");
  console.log(`built ${relativePath}`);
}
console.log("dist/ ready — load it as an unpacked extension");
