// Reusable single-PR lab run, extracted from pr-lab.ts so the parallel runner
// (pr-lab-parallel.ts) and the one-shot CLI share one code path. Read-only.
//
// The data side of the pipeline is the production opened-PR path verbatim:
// gatherPRData (src/background/handlers/shared.ts) fetches details → commits →
// files → diff via the same fetchGitHubDiff the extension uses (hunk ranges
// parsed from the FULL diff, only the prompt text truncated; compare endpoint
// with /pulls/<n> fallback for deleted head branches), and anchors are
// hydrated with hydrateMissingDiffAnchors exactly as handleGenerateDescription
// does before building the summary.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { hydrateMissingDiffAnchors } from "../src/background/anchor-hash";
import { discoverRepoStyle } from "../src/background/github/discovery";
import { buildStats, extractLinkedIssues, gatherPRData } from "../src/background/handlers/shared";
import { callAPI } from "../src/background/llm";
import { countDiffAnchors, parseDescriptionOnlyResponse } from "../src/background/parse";
import { buildDescriptionOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { refineDescription } from "../src/background/refinement";
import type { RepoStyle } from "../src/background/repo-style";
import { buildChangesSummary, countUsableAnchors, hasUsableAnchors } from "../src/background/summary";
import type { ExtensionConfig, ThinkingEffort } from "../src/types";
import { THINKING_EFFORTS } from "../src/types";
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

interface LabGeneration {
  title: string;
  commits: string[];
  fileCount: number;
  diffText: string | null;
  prompt: string;
  style: RepoStyle;
  draftDescription: string;
  refinedDescription: string;
  finalScore: number;
  iterations: number;
  hasAnchors: boolean;
}

// Stop refining the moment the description passes the lab's own acceptance
// rubric — the internal loop targets a stricter 12-point scale whose extra
// points cost minutes of LLM time without changing the lab verdict.
function makeLabEarlyAccept(
  say: (msg: string) => void,
  title: string,
  commits: string[],
  hasAnchors: boolean,
  fileCount: number,
): (desc: string) => boolean {
  return (desc) => {
    const r = scoreDescription(desc, title, commits, { expectAnchors: hasAnchors, fileCount });
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
  };
}

// Extracted from runPrLab to stay under the sonarjs max-lines-per-function cap.
async function generateAndRefine(
  owner: string,
  repo: string,
  pr: number,
  config: ExtensionConfig,
  say: (msg: string) => void,
  quiet: boolean,
): Promise<LabGeneration> {
  // Style discovery (GitHub REST) overlaps the PR data gather — they are
  // independent and both sit on the critical path before the LLM call.
  const [gathered, style] = await Promise.all([
    gatherPRData("pr-lab", config, { owner, repo, prNumber: String(pr) }),
    discoverRepoStyleCached(config, owner, repo),
  ]);
  const commits = gathered.commits.map((c) => c.message);

  // Hydrate missing anchors BEFORE building the summary so the prompt's
  // anchors section and the refinement anchor check see the same set —
  // mirrors handleGenerateDescription.
  await hydrateMissingDiffAnchors(gathered.fileChanges);

  const stats = buildStats(gathered.prDetails, gathered.fileChanges);
  const summary = buildChangesSummary(
    {
      commits: gathered.commits,
      fileChanges: gathered.fileChanges,
      stats,
      branchContext: gathered.branchContext,
      linkedIssues: extractLinkedIssues(gathered.commits),
      existingBody: gathered.prDetails.body,
    },
    gathered.diffText,
    gathered.hunkRanges,
  );
  const prompt = buildDescriptionOnlyPrompt(summary, gathered.prDetails.title, gathered.prDetails.body, style);
  say(`generating (prompt ${String(prompt.length)} chars)`);
  const raw = await callAPI(config, prompt, 0.3, quiet ? undefined : () => process.stdout.write("."));
  const draftDescription = parseDescriptionOnlyResponse(raw, { preserveAiDisclosure: style.aiDisclosure });

  say("refining");
  // Anchors demandable only when the summary actually carried any — the same
  // expression the production description handler passes to refineDescription.
  const hasAnchors = gathered.fileChanges.length > 0 && hasUsableAnchors(gathered.fileChanges, gathered.hunkRanges);
  const {
    description: refinedDescription,
    finalScore,
    iterations,
  } = await refineDescription(
    config,
    gathered.prDetails.title,
    draftDescription,
    commits,
    hasAnchors,
    3, // max iterations
    12, // target score — the lab is the acceptance gate; converge fully or report
    stats,
    makeLabEarlyAccept(say, gathered.prDetails.title, commits, hasAnchors, gathered.fileChanges.length),
    false, // preserveAuthoredBody — the lab judges a full regeneration
    undefined, // no abort signal in the lab
    countUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
  );
  return {
    title: gathered.prDetails.title,
    commits,
    fileCount: gathered.fileChanges.length,
    diffText: gathered.diffText,
    prompt,
    style,
    draftDescription,
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
    const gen = await generateAndRefine(owner, repo, pr, config, say, quiet);

    const { score, checks } = scoreDescription(gen.refinedDescription, gen.title, gen.commits, {
      expectAnchors: gen.hasAnchors,
      fileCount: gen.fileCount,
    });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dir = `${artifactBase}-${stamp}`;
    writeArtifacts(dir, gen.prompt, gen.draftDescription, gen.refinedDescription, {
      score,
      refinementScore: gen.finalScore,
      iterations: gen.iterations,
      style: gen.style,
      checks,
    });
    say(`rubric ${String(score)}/10, refinement ${String(gen.finalScore)} — ${dir}`);
    return {
      owner,
      repo,
      pr,
      title: gen.title,
      score,
      maxScore: 10,
      refinementScore: gen.finalScore,
      iterations: gen.iterations,
      anchors: countDiffAnchors(gen.refinedDescription),
      diffChars: gen.diffText?.length ?? 0,
      fileCount: gen.fileCount,
      commitCount: gen.commits.length,
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
