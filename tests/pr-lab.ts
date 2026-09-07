// PR-lab: regenerate a real PR's description with the extension's actual
// pipeline and score it with the deterministic rubric. Read-only: never
// touches the PR. Usage: bun run tests/pr-lab.ts [--repo owner/name] [--pr 119]
// main() is guarded behind import.meta.main so the arg parser can be imported
// and checked offline without kicking off a live lab run.
import { labConfig, runPrLab } from "./pr-lab-run";

const USAGE = "usage: bun run tests/pr-lab.ts [--repo owner/name] [--pr 119]";

export function parsePrLabArgs(argv: string[]): { owner: string; repo: string; pr: number } {
  const repoIdx = argv.indexOf("--repo");
  const prIdx = argv.indexOf("--pr");
  const repoArg = repoIdx >= 0 ? (argv[repoIdx + 1] ?? "") : "";
  const parts = repoArg.split("/").filter(Boolean);
  let pr = 119;
  if (prIdx >= 0) {
    const raw = argv[prIdx + 1] ?? "";
    pr = Number(raw);
    // Number() swallows garbage ("abc" → NaN, "" → 0) that would only surface
    // later as a confusing GitHub fetch error — reject it up front.
    if (!Number.isInteger(pr) || pr <= 0) {
      throw new Error(`invalid --pr value "${raw}" — expected a positive integer PR number\n${USAGE}`);
    }
  }
  return {
    owner: parts[0] ?? "sirajLMS",
    repo: parts[1] ?? "siraj",
    pr,
  };
}

async function main(): Promise<void> {
  const { owner, repo, pr } = parsePrLabArgs(process.argv.slice(2));
  const result = await runPrLab(owner, repo, pr, labConfig());
  if (result.error) {
    console.error("\n❌ " + result.error);
    process.exit(1);
  }
  console.log("\n=== Rubric (" + String(result.score) + "/10) ===");
  for (const c of result.checks) console.log((c.ok ? "✅ " : "❌ ") + c.name + " — " + c.detail);
  if (result.score < 10) {
    const failing = result.checks.filter((c) => !c.ok);
    console.log("\nFailing checks (needs attention):");
    for (const c of failing) console.log("  → " + c.name + " — " + c.detail);
  }
  console.log("\nArtifacts: " + result.artifactDir);
  process.exit(result.score === 10 ? 0 : 1);
}

if (import.meta.main) {
  await main().catch((err: unknown) => {
    console.error("❌ " + (err instanceof Error ? err.message : String(err)));
    process.exit(1);
  });
}
