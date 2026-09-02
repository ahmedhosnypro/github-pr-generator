// PR-lab: regenerate a real PR's description with the extension's actual
// pipeline and score it with the deterministic rubric. Read-only: never
// touches the PR. Usage: bun run tests/pr-lab.ts [--repo owner/name] [--pr 119]
import { labConfig, runPrLab } from "./pr-lab-run";

function args(): { owner: string; repo: string; pr: number } {
  const argv = process.argv.slice(2);
  const repoIdx = argv.indexOf("--repo");
  const prIdx = argv.indexOf("--pr");
  const repoArg = repoIdx >= 0 ? (argv[repoIdx + 1] ?? "") : "";
  const parts = repoArg.split("/").filter(Boolean);
  return {
    owner: parts[0] ?? "sirajLMS",
    repo: parts[1] ?? "siraj",
    pr: prIdx >= 0 ? Number(argv[prIdx + 1]) : 119,
  };
}

const { owner, repo, pr } = args();
const result = await runPrLab(owner, repo, pr, labConfig());
if (result.error) {
  console.error("\n❌ " + result.error);
  process.exit(1);
}
console.log("\n=== Rubric (" + String(result.score) + "/10) ===");
for (const c of result.checks) console.log((c.ok ? "✅ " : "❌ ") + c.name + " — " + c.detail);
console.log("\nArtifacts: " + result.artifactDir);
process.exit(result.score === 10 ? 0 : 1);
