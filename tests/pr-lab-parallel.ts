// Parallel PR lab: pick one good merged PR from each of the ten most-starred
// open-source repos (via the gh CLI), run the full generate → refine → rubric
// pipeline for all of them concurrently, and collect a summary report.
// Read-only — never touches any PR. Usage: bun run tests/pr-lab-parallel.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { type LabRunResult, labConfig, runPrLab } from "./pr-lab-run";

const TOP_REPO_COUNT = 10;
// Bounds for "a good PR": enough real code to describe, small enough that the
// diff endpoint (>300-file limit) and context budget stay safe.
const MIN_CHANGED_FILES = 2;
const MAX_CHANGED_FILES = 60;
const MIN_TOTALLINES = 10;
const MAX_TOTALLINES = 5000;

interface GhPrRow {
  number: number;
  title: string;
  author: { login: string };
  additions: number;
  deletions: number;
  changedFiles: number;
  mergedAt: string;
}

function gh(args: string[]): string {
  const proc = Bun.spawnSync(["gh", ...args], { stdout: "pipe", stderr: "pipe" });
  if (proc.exitCode !== 0) {
    throw new Error("gh " + args.join(" ") + " failed: " + proc.stderr.toString().slice(0, 200));
  }
  return proc.stdout.toString();
}

function topRepos(): string[] {
  // Code-heavy mega-repos: high stars, push activity, exclude list-style repos.
  // gh search repos mangles query strings with multiple qualifiers → use the API.
  const out = gh([
    "api",
    "search/repositories?q=stars:%3E50000+pushed:%3E2026-01-01+-topic:awesome+-topic:awesome-list+-topic:list+-topic:books+-topic:roadmap+-topic:learning+-topic:tutorial&sort=stars&order=desc&per_page=" +
      String(TOP_REPO_COUNT),
    "--jq",
    ".items[].full_name",
  ]);
  return out.split("\n").filter((l) => l.trim().length > 0);
}

function goodMergedPr(repo: string): GhPrRow | null {
  const out = gh([
    "pr",
    "list",
    "--repo",
    repo,
    "--state",
    "merged",
    "--limit",
    "40",
    "--json",
    "number,title,author,additions,deletions,changedFiles,mergedAt",
  ]);
  const rows = JSON.parse(out) as GhPrRow[];
  // Most recently merged first; take the first that looks like a real PR.
  return (
    rows.find(
      (r) =>
        !r.author.login.endsWith("[bot]") &&
        r.changedFiles >= MIN_CHANGED_FILES &&
        r.changedFiles <= MAX_CHANGED_FILES &&
        r.additions + r.deletions >= MIN_TOTALLINES &&
        r.additions + r.deletions <= MAX_TOTALLINES,
    ) ?? null
  );
}

function renderSummary(results: LabRunResult[]): string {
  const lines = [
    "# Parallel PR-lab summary",
    "",
    "| Repo | PR | Rubric | Refinement | Files | Diff chars | Anchors | Time |",
    "|---|---|---|---|---|---|---|---|",
  ];
  for (const r of results) {
    if (r.error) {
      lines.push(
        `| ${r.owner}/${r.repo} | #${String(r.pr)} | ❌ error | — | — | — | — | ${(r.durationMs / 1000).toFixed(0)}s |`,
      );
      continue;
    }
    lines.push(
      `| ${r.owner}/${r.repo} | #${String(r.pr)} | ${String(r.score)}/10 ${r.score === 10 ? "✅" : "⚠️"} | ${String(r.refinementScore)} (${String(r.iterations)} iters) | ${String(r.fileCount)} | ${String(r.diffChars)} | ${String(r.anchors)} | ${(r.durationMs / 1000).toFixed(0)}s |`,
    );
  }
  const scored = results.filter((r) => !r.error);
  const perfect = scored.filter((r) => r.score === 10).length;
  lines.push(
    "",
    `**${String(perfect)}/${String(scored.length)} repos at rubric 10/10.** ` +
      (results.length - scored.length > 0 ? `${String(results.length - scored.length)} run(s) errored.` : ""),
  );
  return lines.join("\n");
}

const started = Date.now();
const config = labConfig();

console.log("Discovering top repos via gh…");
const repos = topRepos();
console.log(`Repos: ${repos.join(", ")}`);

const picks: Array<{ owner: string; repo: string; pr: GhPrRow }> = [];
for (const fullName of repos) {
  const [owner, repo] = fullName.split("/") as [string, string];
  const pick = goodMergedPr(fullName);
  if (pick) {
    picks.push({ owner, repo, pr: pick });
    console.log(`${fullName} → PR #${String(pick.number)} "${pick.title}" (${String(pick.changedFiles)} files)`);
  } else {
    console.warn(`${fullName} — no suitable merged PR found, skipping`);
  }
}

console.log(`\nRunning ${String(picks.length)} lab runs in parallel…\n`);
const results = await Promise.all(picks.map(({ owner, repo, pr }) => runPrLab(owner, repo, pr.number, config, true)));

const summary = renderSummary(results);
console.log("\n" + summary);

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = `scratch/pr-lab/parallel-${stamp}`;
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/summary.md`, summary + "\n", "utf-8");
writeFileSync(`${dir}/results.json`, JSON.stringify(results, null, 2), "utf-8");
console.log(`\nSummary written to ${dir} (total ${((Date.now() - started) / 60000).toFixed(1)} min)`);

const allPerfect = results.every((r) => !r.error && r.score === 10);
process.exit(allPerfect ? 0 : 1);
