// Reusable single-PR lab run, extracted from pr-lab.ts so the parallel runner
// (pr-lab-parallel.ts) and the one-shot CLI share one code path. Read-only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { parseHunkLineRanges, truncateDiff } from "../src/background/github/diff-parse";
import { discoverRepoStyle } from "../src/background/github/discovery";
import { callAPI } from "../src/background/llm";
import { countDiffAnchors, parseDescriptionOnlyResponse } from "../src/background/parse";
import { buildDescriptionOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { refineDescription } from "../src/background/refinement";
import type { RepoStyle } from "../src/background/repo-style";
import { buildChangesSummary } from "../src/background/summary";
import type { ExtensionConfig, ThinkingEffort } from "../src/types";
import { THINKING_EFFORTS } from "../src/types";
import {
  fetchPrCommitMessages,
  fetchPrDiffText,
  fetchPrDiffTextDirect,
  fetchPrFiles,
  fetchPrInfo,
  prApiBase,
} from "./pr-lab-fetch";
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

// CLI/lab runs may dial the reasoning effort independently of the extension:
// PR_LAB_EFFORT env wins, then the optional "labEffort" config field.
function resolveLabEffort(cfg: { labEffort?: string }): ThinkingEffort {
  const raw = process.env.PR_LAB_EFFORT ?? cfg.labEffort ?? "low";
  return (THINKING_EFFORTS as string[]).includes(raw) ? (raw as ThinkingEffort) : "low";
}

export function labConfig(): ExtensionConfig {
  const cfg = loadConfig();
  if (!cfg.githubToken || !cfg.apiEndpoint || !cfg.apiKey || !cfg.model) {
    throw new Error("config.local.json must provide githubToken, apiEndpoint, apiKey, model");
  }
  return {
    apiEndpoint: cfg.apiEndpoint,
    apiKey: cfg.apiKey,
    // CLI/lab runs may target a faster model than the extension's: explicit
    // PR_LAB_MODEL env wins, then the optional "labModel" config field.
    model: process.env.PR_LAB_MODEL ?? cfg.labModel ?? cfg.model,
    githubToken: cfg.githubToken,
    diffEnabled: true,
    diffMaxLines: 3000,
    diffMaxBytes: 100000,
    thinkingEffort: resolveLabEffort(cfg),
  };
}

// The extension caches repo styles in chrome.storage.session, which does not
// exist under Bun — the lab caches them on disk instead (same 6h TTL), saving
// a couple of GitHub REST round trips per run and sparing the rate limit.
const STYLE_CACHE_FILE = "scratch/.repo-style-cache.json";
const STYLE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

type StyleCacheTable = Record<string, { at: number; style: RepoStyle }>;

function readStyleCache(): StyleCacheTable {
  try {
    return JSON.parse(readFileSync(STYLE_CACHE_FILE, "utf-8")) as StyleCacheTable;
  } catch {
    return {};
  }
}

async function discoverRepoStyleCached(config: ExtensionConfig, owner: string, repo: string): Promise<RepoStyle> {
  const key = owner.toLowerCase() + "/" + repo.toLowerCase();
  const table = readStyleCache();
  const hit = table[key];
  if (hit && Date.now() - hit.at < STYLE_CACHE_TTL_MS) return hit.style;
  const style = await discoverRepoStyle(config, owner, repo);
  table[key] = { at: Date.now(), style };
  try {
    writeFileSync(STYLE_CACHE_FILE, JSON.stringify(table));
  } catch {
    // cache writes are best-effort — a read-only workspace just skips caching
  }
  return style;
}

async function gather(owner: string, repo: string, pr: number, config: ExtensionConfig) {
  const base = prApiBase(owner, repo, pr);
  const [info, commits, files, directDiff] = await Promise.all([
    fetchPrInfo(base, config.githubToken),
    fetchPrCommitMessages(base, config.githubToken),
    fetchPrFiles(base, config.githubToken),
    fetchPrDiffTextDirect(config, owner, repo, pr),
  ]);
  const rawDiff = directDiff ?? (await fetchPrDiffText(config, owner, repo, info.baseBranch, info.headBranch, pr));
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
  // Style discovery (GitHub REST) overlaps the PR data gather — they are
  // independent and both sit on the critical path before the LLM call.
  const [{ info, commits, files, diffText, hunks }, style] = await Promise.all([
    gather(owner, repo, pr, config),
    discoverRepoStyleCached(config, owner, repo),
  ]);
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
    // Stop refining the moment the description passes the lab's own acceptance
    // rubric — the internal loop targets a stricter 12-point scale whose extra
    // points cost minutes of LLM time without changing the lab verdict.
    (desc) => {
      const r = scoreDescription(desc, info.title, commits, { expectAnchors: hasAnchors, fileCount: files.length });
      if (r.score === 10) return true;
      say(
        "rubric " +
          String(r.score) +
          "/10, still failing: " +
          r.checks
            .filter((c) => !c.ok)
            .map((c) => c.name + " (" + c.detail + ")")
            .join("; "),
      );
      return false;
    },
  );
  return {
    info,
    commits,
    files,
    diffText,
    prompt,
    style,
    draftDescription: description,
    refinedDescription,
    finalScore,
    iterations,
    hasAnchors,
  };
}

function writeArtifacts(
  dir: string,
  prompt: string,
  draftDescription: string,
  description: string,
  payload: { score: number; refinementScore: number; iterations: number; style: unknown; checks: unknown },
): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + "/prompt.txt", prompt, "utf-8");
  writeFileSync(dir + "/description-draft.md", draftDescription, "utf-8");
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
    const {
      info,
      commits,
      files,
      diffText,
      prompt,
      style,
      draftDescription,
      refinedDescription,
      finalScore,
      iterations,
      hasAnchors,
    } = await generateAndRefine(owner, repo, pr, config, say, quiet);

    const { score, checks } = scoreDescription(refinedDescription, info.title, commits, {
      expectAnchors: hasAnchors,
      fileCount: files.length,
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dir = `${artifactBase}-${stamp}`;
    writeArtifacts(dir, prompt, draftDescription, refinedDescription, {
      score,
      refinementScore: finalScore,
      iterations,
      style,
      checks,
    });
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
