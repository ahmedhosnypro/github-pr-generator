import { existsSync } from "node:fs";
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const dist = join(root, "dist");

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
// Secret fields are stripped so dist/ can never carry a real API key or PAT into a zip,
// share, or accidental release; secrets must be set via the popup (chrome.storage).
const SECRET_CONFIG_FIELDS = ["apiKey", "githubToken"] as const;
const localConfig = join(root, "config.local.json");
if (existsSync(localConfig)) {
  const parsed = JSON.parse(await readFile(localConfig, "utf8")) as Record<string, unknown>;
  const stripped = SECRET_CONFIG_FIELDS.filter((field) => typeof parsed[field] === "string" && parsed[field]);
  const sanitized = Object.fromEntries(
    Object.entries(parsed).filter(([key]) => !(SECRET_CONFIG_FIELDS as readonly string[]).includes(key)),
  );
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
