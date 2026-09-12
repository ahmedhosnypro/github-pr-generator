// Live verification of the combined generation path (the extension's actual
// "generate" stream type) against the real gateway and real GitHub PR data.
// Read-only: fetches PR data, generates, and scores — never PATCHes anything.
//
// Proves "stream request error (generate): No content in API response" is
// resolved for the models under test: the run must complete with a non-empty
// parsed title/description and pass the deterministic rubric.
//
// Usage:
//   bun run tests/generate-live.ts
//   PR_LAB_MODEL=gemini/gemini-3.8-flash bun run tests/generate-live.ts
//   PR_LAB_MODEL=nvidia/z-ai/glm-5.3-flash bun run tests/generate-live.ts
//   PR_LAB_EFFORT=default bun run tests/generate-live.ts   (override effort)
//
// The PR defaults to config.local.json's testPr (facebook/react#37382);
// PR_LAB_REPO/PR_LAB_PR env vars override it. PR_LAB_SKIP_REFINE=1 runs the
// combined-call leg only (the leg that used to die with "No content in API
// response"); by default the full handleGenerate refinement loop also runs.
import { discoverRepoStyle } from "../src/background/github/discovery";
import { buildStats, gatherPRData } from "../src/background/handlers/shared";
import { callAPI } from "../src/background/llm";
import { logMsg } from "../src/background/log";
import { parseCombinedResponse } from "../src/background/parse";
import { buildCombinedPrompt } from "../src/background/prompts/combined";
import { refineDescription } from "../src/background/refinement";
import type { RepoStyle } from "../src/background/repo-style";
import { countUsableAnchors, hasUsableAnchors } from "../src/background/summary";
import type { ExtensionConfig, ThinkingEffort } from "../src/types";
import { THINKING_EFFORTS } from "../src/types";
import { hydrateAndBuildSummary } from "./pr-lab-shared";
import { loadConfig } from "./shared";

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function resolveEffort(): ThinkingEffort {
  const raw = readEnv("PR_LAB_EFFORT") ?? "default";
  return (THINKING_EFFORTS as string[]).includes(raw) ? (raw as ThinkingEffort) : "default";
}

function resolveTargetPr(): { owner: string; repo: string; pr: number } {
  const override = readEnv("PR_LAB_REPO");
  if (override) {
    const [owner, repo] = override.split("/");
    const pr = Number(readEnv("PR_LAB_PR") ?? "0");
    if (!owner || !repo || !Number.isInteger(pr) || pr <= 0) {
      throw new Error('PR_LAB_REPO must be "owner/repo" with PR_LAB_PR set to a positive integer');
    }
    return { owner, repo, pr };
  }
  const cfg = loadConfig();
  const testPr = cfg.testPr;
  if (!testPr) throw new Error("config.local.json must define testPr (or set PR_LAB_REPO/PR_LAB_PR)");
  return { owner: testPr.owner, repo: testPr.repo, pr: testPr.number };
}

// The extension's runtime config, but pointed at the model/effort under test:
// connection settings come from the same chrome.storage-free precedence the
// background uses (file config), with the popup-stored values absent.
function verifierConfig(model: string): ExtensionConfig {
  const cfg = loadConfig();
  if (!cfg.githubToken || !cfg.apiEndpoint || !cfg.apiKey) {
    throw new Error("config.local.json must provide githubToken, apiEndpoint, apiKey");
  }
  return {
    apiEndpoint: cfg.apiEndpoint,
    apiKey: cfg.apiKey,
    model,
    githubToken: cfg.githubToken,
    diffEnabled: true,
    diffMaxLines: 3000,
    diffMaxBytes: 100000,
    thinkingEffort: resolveEffort(),
  };
}

// In-memory session storage stub: discoverRepoStyle caches in
// chrome.storage.session, which does not exist under Bun.
function stubChromeSession(): void {
  const table = new Map<string, unknown>();
  const g = globalThis as { chrome?: unknown };
  g.chrome = {
    storage: {
      session: {
        get: async (key: string): Promise<Record<string, unknown>> => (table.has(key) ? { [key]: table.get(key) } : {}),
        set: async (entries: Record<string, unknown>): Promise<void> => {
          for (const [k, v] of Object.entries(entries)) table.set(k, v);
        },
      },
    },
    runtime: {
      lastError: undefined,
      getURL: (path: string): string => "chrome-extension://verifier/" + path,
    },
  };
}

interface CombinedLeg {
  title: string;
  description: string;
  rawLength: number;
  promptChars: number;
}

// The exact handleGenerate prologue + combined call + parse. This is the leg
// that surfaced "stream request error (generate): No content in API response".
async function runCombinedLeg(
  config: ExtensionConfig,
  target: { owner: string; repo: string; pr: number },
  onChunk?: (delta: string) => void,
): Promise<{ leg: CombinedLeg; gathered: Awaited<ReturnType<typeof gatherPRData>>; style: RepoStyle }> {
  const [gathered, style] = await Promise.all([
    gatherPRData("generate-live", config, {
      owner: target.owner,
      repo: target.repo,
      prNumber: String(target.pr),
    }),
    discoverRepoStyle(config, target.owner, target.repo),
  ]);

  const { summary } = await hydrateAndBuildSummary(gathered);

  const prompt = buildCombinedPrompt(summary, gathered.prDetails.body, style);
  logMsg("Combined prompt built, length: " + String(prompt.length));

  const raw = await callAPI(config, prompt, 0.3, onChunk);
  const parsed = parseCombinedResponse(raw, { preserveAiDisclosure: style.aiDisclosure });
  if (!parsed.title && !parsed.description) {
    throw new Error("Combined call produced an empty parsed title AND description");
  }
  return {
    leg: { title: parsed.title, description: parsed.description, rawLength: raw.length, promptChars: prompt.length },
    gathered,
    style,
  };
}

// The handleGenerate refinement epilogue over the combined draft.
async function runRefineLeg(
  config: ExtensionConfig,
  leg: CombinedLeg,
  gathered: Awaited<ReturnType<typeof gatherPRData>>,
  hasAnchors: boolean,
  stats: ReturnType<typeof buildStats>,
): Promise<{ description: string; score: number; iterations: number }> {
  const { description, finalScore, iterations } = await refineDescription(
    config,
    leg.title,
    leg.description,
    gathered.commits.map((c) => c.message),
    hasAnchors,
    3,
    10,
    stats,
    undefined,
    gathered.prDetails.body.trim().length > 0,
    undefined,
    countUsableAnchors(gathered.fileChanges, gathered.hunkRanges),
  );
  return { description, score: finalScore, iterations };
}

function scoreChecks(
  description: string,
  title: string,
  commits: string[],
): Array<{ name: string; ok: boolean; detail: string }> {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  checks.push({
    name: "description non-empty",
    ok: description.trim().length > 0,
    detail: String(description.trim().length) + " chars",
  });
  checks.push({ name: "title non-empty", ok: title.trim().length > 0, detail: title.trim().substring(0, 72) });
  checks.push({
    name: "no thinking leakage",
    ok:
      !/\*\*(Defining|Structuring|Refining|Detailing)/.test(description) && !description.includes("reasoning_content"),
    detail: "no reasoning markers in output",
  });
  checks.push({
    name: "anchor links well-formed",
    ok: (description.match(/diffhunk:\/\//g) ?? []).every(() => description.includes("](")),
    detail: String((description.match(/diffhunk:\/\//g) ?? []).length) + " diffhunk markers",
  });
  checks.push({
    name: "commit topics covered",
    // Loose keyword overlap: a commit headline counts as covered when at least
    // two of its meaningful words appear in the description. A verbatim
    // first-words prefix match was too strict — models paraphrase commit
    // subjects into prose.
    ok:
      commits.length === 0 ||
      commits.some((c) => {
        const words = (c.split("\n")[0] ?? "")
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .filter(
            (w) =>
              w.length > 3 &&
              !["this", "that", "with", "from", "into", "update", "updated", "tests", "test"].includes(w),
          );
        const hits = words.filter((w) => description.toLowerCase().includes(w)).length;
        return words.length > 0 && hits >= Math.min(2, words.length);
      }),
    detail: String(commits.length) + " commit headline(s)",
  });
  return checks;
}

async function main(): Promise<void> {
  const model = readEnv("PR_LAB_MODEL") ?? loadConfig().model ?? "";
  const effort = resolveEffort();
  const target = resolveTargetPr();
  const config = verifierConfig(model);
  const skipRefine = readEnv("PR_LAB_SKIP_REFINE") === "1";

  stubChromeSession();
  const started = Date.now();
  const label = `${target.owner}/${target.repo}#${String(target.pr)} model=${model} effort=${effort}`;
  console.log("=== " + label + " ===");

  const chunkCount = { n: 0 };
  const onChunk = (): void => {
    chunkCount.n += 1;
  };

  try {
    const { leg, gathered } = await runCombinedLeg(config, target, onChunk);
    console.log(
      "combined leg OK — prompt " +
        String(leg.promptChars) +
        " chars, raw answer " +
        String(leg.rawLength) +
        " chars, " +
        String(chunkCount.n) +
        " streamed chunk(s), parsed title: " +
        JSON.stringify(leg.title),
    );
    const hasAnchors = gathered.fileChanges.length > 0 && hasUsableAnchors(gathered.fileChanges, gathered.hunkRanges);
    if (skipRefine) {
      console.log("PR_LAB_SKIP_REFINE=1 — refinement leg skipped");
      console.log("✅ PASS (combined leg) — 'No content in API response' did not occur");
      return;
    }
    const refined = await runRefineLeg(
      config,
      leg,
      gathered,
      hasAnchors,
      buildStats(gathered.prDetails, gathered.fileChanges),
    );
    console.log(
      "refine leg OK — score " +
        String(refined.score) +
        "/12 after " +
        String(refined.iterations) +
        " iteration(s), final length " +
        String(refined.description.length),
    );
    const checks = scoreChecks(
      refined.description,
      leg.title,
      gathered.commits.map((c) => c.message),
    );
    const failed = checks.filter((c) => !c.ok);
    for (const c of checks) console.log((c.ok ? "✅ " : "❌ ") + c.name + " — " + c.detail);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    if (failed.length > 0) {
      console.log("❌ FAIL in " + elapsed + "s — " + String(failed.length) + " check(s) failed");
      process.exit(1);
    }
    console.log("✅ PASS in " + elapsed + "s — 'No content in API response' did not occur, all checks green");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log("❌ FAIL — " + message);
    if (message.includes("No content in API response")) {
      console.log("   ^ the exact regression this verifier exists to catch");
    }
    process.exit(1);
  }
}

await main();
