// PR-lab: regenerate a real PR's description with the extension's actual
// pipeline (fresh body, streaming, low reasoning effort) and score it with the
// deterministic rubric. Read-only: never touches the PR.
// Usage: bun run tests/pr-lab.ts [--repo owner/name] [--pr 119]
import { mkdirSync, writeFileSync } from "node:fs";
import { parseHunkLineRanges, truncateDiff } from "../src/background/github/diff-parse";
import { discoverRepoStyle } from "../src/background/github/discovery";
import { callAPI } from "../src/background/llm";
import { countDiffAnchors, parseDescriptionOnlyResponse } from "../src/background/parse";
import { buildDescriptionOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { refineDescription } from "../src/background/refinement";
import { buildChangesSummary } from "../src/background/summary";
import type { ExtensionConfig } from "../src/types";
import { fetchPrCommitMessages, fetchPrDiffText, fetchPrFiles, fetchPrInfo, prApiBase } from "./pr-lab-fetch";
import { scoreDescription } from "./pr-lab-rubric";
import { loadConfig } from "./shared";

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

function labConfig(): ExtensionConfig {
  const cfg = loadConfig();
  if (!cfg.githubToken || !cfg.apiEndpoint || !cfg.apiKey || !cfg.model) {
    throw new Error("config.local.json must provide githubToken, apiEndpoint, apiKey, model");
  }
  return {
    apiEndpoint: cfg.apiEndpoint,
    apiKey: cfg.apiKey,
    model: cfg.model,
    githubToken: cfg.githubToken,
    diffEnabled: true,
    diffMaxLines: 3000,
    diffMaxBytes: 100000,
    thinkingEffort: "low",
  };
}

async function gather(owner: string, repo: string, pr: number, config: ExtensionConfig) {
  const base = prApiBase(owner, repo, pr);
  const [info, commits, files] = await Promise.all([
    fetchPrInfo(base, config.githubToken),
    fetchPrCommitMessages(base, config.githubToken),
    fetchPrFiles(base, config.githubToken),
  ]);
  const rawDiff = await fetchPrDiffText(config, owner, repo, info.baseBranch, info.headBranch);
  const diffText = rawDiff ? truncateDiff(rawDiff, config.diffMaxLines, config.diffMaxBytes) : null;
  const hunks = diffText ? parseHunkLineRanges(diffText) : null;
  return { info, commits, files, diffText, hunks };
}

async function generate(owner: string, repo: string, pr: number) {
  const config = labConfig();
  console.log(`Fetching ${owner}/${repo}#${String(pr)} ...`);
  const { info, commits, files, diffText, hunks } = await gather(owner, repo, pr, config);
  console.log(
    `PR "${info.title}" — ${String(commits.length)} commits, ${String(files.length)} files, diff ${String(diffText?.length ?? 0)} chars, hunks for ${String(Object.keys(hunks ?? {}).length)} files`,
  );
  const style = await discoverRepoStyle(config, owner, repo);
  const summary = buildChangesSummary(
    {
      commits: commits.map((message) => ({ message })),
      fileChanges: files,
      stats: { files: files.length, additions: info.additions, deletions: info.deletions },
      branchContext: { owner, repo, baseBranch: info.baseBranch, headBranch: info.headBranch },
      linkedIssues: [],
      existingBody: "",
    },
    diffText,
    hunks,
  );
  const prompt = buildDescriptionOnlyPrompt(summary, info.title, "", style);
  console.log(`Prompt built (${String(prompt.length)} chars). Generating (streaming)...`);
  const raw = await callAPI(config, prompt, 0.3, () => process.stdout.write("."));
  console.log("\nGeneration done, " + String(raw.length) + " chars");
  const description = parseDescriptionOnlyResponse(raw, { expectAnchors: true });
  return { prompt, description, title: info.title, commits, style, config };
}

const { owner, repo, pr } = args();
const { prompt, description, title, commits, style, config } = await generate(owner, repo, pr);

console.log("\nRunning refinement loop...");
const { description: refinedDescription, finalScore } = await refineDescription(
  config,
  title,
  description,
  commits,
  true,
  3, // max iterations
  10, // target score
);
console.log("Refinement complete: " + String(finalScore) + "/10");

const { score, checks } = scoreDescription(refinedDescription, title, commits);
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const dir = "scratch/pr-lab/" + String(pr) + "-" + stamp;
mkdirSync(dir, { recursive: true });
writeFileSync(dir + "/prompt.txt", prompt, "utf-8");
writeFileSync(dir + "/description.md", refinedDescription, "utf-8");
writeFileSync(
  dir + "/score.json",
  JSON.stringify({ score, anchors: countDiffAnchors(refinedDescription), style, checks }, null, 2),
  "utf-8",
);

console.log("\n=== Rubric (" + String(score) + "/10) ===");
for (const c of checks) console.log((c.ok ? "✅ " : "❌ ") + c.name + " — " + c.detail);
console.log("\nArtifacts: " + dir);
process.exit(score === 10 ? 0 : 1);
