// LIVE acceptance gate for description render quality (render-quality-plan.md).
// Uses the local LLM endpoint from config.local.json — intentionally NOT part of
// the default `bun run test` chain (requires a running model server).
import { callAPI } from "../src/background/llm";
import { countDiffAnchors, parseCombinedResponse } from "../src/background/parse";
import { buildCombinedPrompt } from "../src/background/prompts/combined";
import { buildChangesSummary } from "../src/background/summary";
import type { ExtensionConfig } from "../src/types";
import { expectMatch, getFailures } from "./expect-helpers";
import { loadConfig } from "./shared";

function fixtureSummary(): string {
  return buildChangesSummary(
    {
      commits: [
        { message: "feat(payroll): flip teacher dues to PAID on settlement completion" },
        { message: "fix(payroll): guard override idempotency against client retries" },
        { message: "feat(ui): add payroll report page with CSV export" },
      ],
      fileChanges: [
        {
          path: "backend/src/payroll/service.ts",
          type: "modified",
          additions: 120,
          deletions: 45,
          diffAnchor: "a".repeat(40),
        },
        {
          path: "backend/src/payroll/report.ts",
          type: "added",
          additions: 90,
          deletions: 0,
          diffAnchor: "b".repeat(40),
        },
        {
          path: "frontend/src/pages/payroll.tsx",
          type: "modified",
          additions: 60,
          deletions: 12,
          diffAnchor: "c".repeat(40),
        },
      ],
      stats: { files: 3, additions: 270, deletions: 57 },
      branchContext: { owner: "acme", repo: "demo", baseBranch: "main", headBranch: "feat/payroll" },
      linkedIssues: ["#412"],
      existingBody: "",
    },
    null,
    {
      "backend/src/payroll/service.ts": [{ rightStart: 42, rightCount: 18 }],
      "backend/src/payroll/report.ts": [{ rightStart: 1, rightCount: 60 }],
      "frontend/src/pages/payroll.tsx": [{ rightStart: 7, rightCount: 30 }],
    },
  );
}

async function callLocalModel(prompt: string): Promise<string> {
  const cfg = loadConfig();
  if (!cfg.apiEndpoint || !cfg.apiKey || !cfg.model) {
    throw new Error("config.local.json must define apiEndpoint, apiKey, and model for the live format test");
  }
  // Reuse the extension's own client so the request shape matches production
  // (including SSE-aggregating endpoints like NVIDIA NIM).
  const config: ExtensionConfig = {
    apiEndpoint: cfg.apiEndpoint,
    apiKey: cfg.apiKey,
    model: cfg.model,
    githubToken: cfg.githubToken ?? "",
    diffEnabled: false,
    diffMaxLines: 0,
    diffMaxBytes: 0,
    thinkingEffort: "none",
  };
  return callAPI(config, prompt, 0.3);
}

function longLineBreakerCount(text: string): number {
  return text.split("\n").filter((line) => line.length > 400).length;
}

function longestBulletWords(text: string): number {
  return text
    .split("\n")
    .filter((line) => /^[-*]\s/.test(line))
    .reduce((max, line) => Math.max(max, line.split(/\s+/).length), 0);
}

console.log("=== Live Render-Quality Acceptance (requires local LLM) ===\n");
const prompt = buildCombinedPrompt(fixtureSummary(), "");
const raw = await callLocalModel(prompt);
const { title, description } = parseCombinedResponse(raw);
console.log(`Title: ${title}\nDescription length: ${String(description.length)} chars\n`);

const fenceCount = (description.match(/```/g) ?? []).length;
expectMatch("description non-trivial", description.length > 300, true);
expectMatch("has fenced code blocks", fenceCount >= 2, true);
expectMatch("numbered verification steps", /\n\d+\.\s/.test(description), true);
expectMatch("contains diff-hunk anchor links", countDiffAnchors(description) > 0, true);
expectMatch("no prose-wall lines (>400 chars)", longLineBreakerCount(description), 0);
expectMatch("no bullet over 60 words", longestBulletWords(description) <= 60, true);

console.log(
  `\nMetrics: words=${String(description.split(/\s+/).length)}, fences=${String(fenceCount)}, anchors=${String(countDiffAnchors(description))}, longestBullet=${String(longestBulletWords(description))} words`,
);

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} acceptance check(s) FAILED`);
  console.log("\n--- raw LLM output ---\n" + raw.slice(0, 4000));
  process.exit(1);
}
console.log("\n✅ Live render-quality acceptance passed");
