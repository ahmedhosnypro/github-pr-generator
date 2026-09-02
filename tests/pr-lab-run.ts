// Reusable single-PR lab run, extracted from pr-lab.ts so the parallel runner
// (pr-lab-parallel.ts) and the one-shot CLI share one code path. Read-only.
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

export interface LabRunResult {
  owner: string;
  repo: string;
  pr: number;
  title: string;
  score: number;
  maxScore: number;
  refinementScore: number;
  iterations: number;
  anchors: number;
  diffChars: number;
  fileCount: number;
  commitCount: number;
  checks: Array<{ name: string; ok: boolean; detail: string }>;
  durationMs: number;
  artifactDir: string;
  error?: string;
}

export function labConfig(): ExtensionConfig {
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
  const rawDiff = await fetchPrDiffText(config, owner, repo, info.baseBranch, info.headBranch, pr);
  const diffText = rawDiff ? truncateDiff(rawDiff, config.diffMaxLines, config.diffMaxBytes) : null;
  const hunks = diffText ? parseHunkLineRanges(diffText) : null;
  return { info, commits, files, diffText, hunks };
}

// Extracted from runPrLab to stay under the sonarjs max-lines-per-function cap.
async function generateAndRefine(
  owner: string,
  repo: string,
  pr: number,
  config: ExtensionConfig,
  say: (msg: string) => void,
  quiet: boolean,
) {
  const { info, commits, files, diffText, hunks } = await gather(owner, repo, pr, config);
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
  say(`generating (prompt ${String(prompt.length)} chars)`);
  const raw = await callAPI(config, prompt, 0.3, quiet ? undefined : () => process.stdout.write("."));
  const description = parseDescriptionOnlyResponse(raw, { expectAnchors: true });

  say("refining");
  // Anchors demandable only when the summary actually carried any. Stats feed
  // the small-diff leniency (compact outputs skip Changes/Testing scaffolding).
  const hasAnchors = (diffText !== null && hunks !== null) || files.some((f) => f.diffAnchor.length > 5);
  const labStats = { files: files.length, additions: info.additions, deletions: info.deletions };
  const {
    description: refinedDescription,
    finalScore,
    iterations,
  } = await refineDescription(
    config,
    info.title,
    description,
    commits,
    hasAnchors,
    3, // max iterations
    12, // target score — the lab is the acceptance gate; converge fully or report
    labStats,
  );
  return { info, commits, files, diffText, prompt, style, refinedDescription, finalScore, iterations, hasAnchors };
}

function writeArtifacts(
  dir: string,
  prompt: string,
  description: string,
  payload: { score: number; refinementScore: number; iterations: number; style: unknown; checks: unknown },
): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + "/prompt.txt", prompt, "utf-8");
  writeFileSync(dir + "/description.md", description, "utf-8");
  writeFileSync(
    dir + "/score.json",
    JSON.stringify(
      {
        score: payload.score,
        refinementScore: payload.refinementScore,
        iterations: payload.iterations,
        anchors: countDiffAnchors(description),
        style: payload.style,
        checks: payload.checks,
      },
      null,
      2,
    ),
    "utf-8",
  );
}

function failedResult(
  owner: string,
  repo: string,
  pr: number,
  artifactBase: string,
  started: number,
  message: string,
): LabRunResult {
  return {
    owner,
    repo,
    pr,
    title: "",
    score: 0,
    maxScore: 10,
    refinementScore: 0,
    iterations: 0,
    anchors: 0,
    diffChars: 0,
    fileCount: 0,
    commitCount: 0,
    checks: [],
    durationMs: Date.now() - started,
    artifactDir: artifactBase,
    error: message,
  };
}

/** Run the full generate → refine → rubric pipeline for one PR. Never throws. */
export async function runPrLab(
  owner: string,
  repo: string,
  pr: number,
  config: ExtensionConfig,
  quiet = false,
): Promise<LabRunResult> {
  const started = Date.now();
  const say = (msg: string): void => {
    if (!quiet) console.log(`[${owner}/${repo}#${String(pr)}]`, msg);
  };
  const artifactBase = `scratch/pr-lab/${owner}-${repo}-${String(pr)}`;
  try {
    say("fetching");
    const { info, commits, files, diffText, prompt, style, refinedDescription, finalScore, iterations, hasAnchors } =
      await generateAndRefine(owner, repo, pr, config, say, quiet);

    const { score, checks } = scoreDescription(refinedDescription, info.title, commits, {
      expectAnchors: hasAnchors,
      fileCount: files.length,
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dir = `${artifactBase}-${stamp}`;
    writeArtifacts(dir, prompt, refinedDescription, { score, refinementScore: finalScore, iterations, style, checks });
    say(`rubric ${String(score)}/10, refinement ${String(finalScore)} — ${dir}`);
    return {
      owner,
      repo,
      pr,
      title: info.title,
      score,
      maxScore: 10,
      refinementScore: finalScore,
      iterations,
      anchors: countDiffAnchors(refinedDescription),
      diffChars: diffText?.length ?? 0,
      fileCount: files.length,
      commitCount: commits.length,
      checks,
      durationMs: Date.now() - started,
      artifactDir: dir,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    say(`failed: ${message}`);
    return failedResult(owner, repo, pr, artifactBase, started, message);
  }
}
