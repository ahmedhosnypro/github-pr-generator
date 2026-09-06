// Unit tests for the five background handlers: handleGenerate (PR-creation
// combined flow), handleGenerateTitle / handleGenerateDescription (opened-PR
// two-phase review gate: generate proposes, apply PATCHes), and
// handleGenerateMergeTitle / handleGenerateMergeDescription
// — plus the shared gather/validation paths in handlers/shared.ts. Chrome APIs
// and fetch are mocked by tests/handlers-harness.ts, installed BEFORE any
// background module is imported (config.ts loads config.local.json at module
// scope). No real network, no real extension APIs.
import type { GenerateData, OpenedPRData } from "../src/types";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import {
  captureRejection,
  chainHandlers,
  DEFAULT_PR_DETAILS,
  githubPrHandler,
  installBackgroundHarness,
  llmCallCount,
  llmResponder,
  type PrMockSpec,
  patchCalls,
  resetHarness,
} from "./handlers-harness";

const harness = installBackgroundHarness();

const { handleGenerate } = await import("../src/background/handlers/generate");
const { handleApplyTitleUpdate, handleGenerateTitle } = await import("../src/background/handlers/title");
const { handleApplyDescriptionUpdate, handleGenerateDescription } = await import(
  "../src/background/handlers/description"
);
const { handleGenerateMergeTitle, handleGenerateMergeDescription } = await import("../src/background/handlers/merge");

const OPENED_PR: OpenedPRData = { owner: "octo", repo: "demo", prNumber: "123" };

const GENERATE_DATA: GenerateData = {
  commits: [{ message: "Add widget rendering support" }],
  fileChanges: [{ path: "src/widget.ts", type: "added", additions: 2, deletions: 0, diffAnchor: "" }],
  stats: { files: 1, additions: 2, deletions: 0 },
  branchContext: { owner: "octo", repo: "demo", baseBranch: "main", headBranch: "feature" },
};

async function testGenerateHappyPath(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(
    harness,
    {},
    chainHandlers(
      llmResponder(
        ["Refactor Widget Rendering\n\n## Summary\nMock generated description body for the combined flow."],
        prompts,
      ),
      githubPrHandler(),
    ),
  );
  const chunks: string[] = [];
  const result = await handleGenerate(GENERATE_DATA, (chunk) => chunks.push(chunk));
  expectMatch("generate returns parsed title", result.title, "Refactor Widget Rendering");
  expectIncludes("generate returns parsed description", result.description, "Mock generated description body");
  expectIncludes("generate forwards chunks to onChunk", chunks.join(""), "Mock generated description body");
  expectIncludes("generate prompt carries commit message", prompts[0] ?? "", "Add widget rendering support");
  expectMatch(
    "generate fetches the compare diff",
    harness.fetchCalls.some((c) => c.url.includes("/compare/main...feature")),
    true,
  );
}

async function testGenerateInvalidConfig(): Promise<void> {
  resetHarness(harness, { apiKey: "" }, githubPrHandler());
  const message = await captureRejection(() => handleGenerate(GENERATE_DATA));
  expectMatch(
    "generate rejects on missing API key",
    message,
    "API key is not configured. Set it in the extension popup.",
  );
  expectMatch("invalid config means the LLM is never called", llmCallCount(harness), 0);
}

async function testGenerateApiAuthFailure(): Promise<void> {
  resetHarness(
    harness,
    {},
    chainHandlers(
      (url) => (url.endsWith("/chat/completions") ? new Response("unauthorized", { status: 401 }) : undefined),
      githubPrHandler(),
    ),
  );
  const message = await captureRejection(() => handleGenerate(GENERATE_DATA));
  expectIncludes("generate surfaces 401 auth failure", message ?? "", "API authentication failed (status 401)");
}

async function testTitleHappyPath(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(harness, {}, chainHandlers(llmResponder(["Polished Widget Title"], prompts), githubPrHandler()));
  const result = await handleGenerateTitle(OPENED_PR);
  expectMatch("title returns the proposal", result.title, "Polished Widget Title");
  // Two-phase review gate: generate proposes, nothing is written to the PR.
  expectMatch("title generate reports not updated", result.updated, false);
  expectMatch("title generate performs no PATCH", patchCalls(harness).length, 0);
  expectIncludes("title prompt carries commit message", prompts[0] ?? "", "Fix widget crash");
  expectIncludes("title prompt carries linked issue from commit", prompts[0] ?? "", "#42");
}

async function testApplyTitleHappyPath(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const result = await handleApplyTitleUpdate({ ...OPENED_PR, title: "Approved Widget Title" });
  expectMatch("apply title reports the update happened", result.updated, true);
  const patches = patchCalls(harness);
  expectMatch("apply title PATCHes the PR", patches.length, 1);
  expectMatch("apply title PATCHes exactly the approved text", patches[0]?.body.title, "Approved Widget Title");
  expectMatch("apply title PATCH body does not touch body field", "body" in (patches[0]?.body ?? {}), false);
  expectMatch("apply title never calls the LLM", llmCallCount(harness), 0);
}

async function testTitleFreshModeRetries(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(
    harness,
    {},
    chainHandlers(
      llmResponder(["Original PR Title", "Completely Fresh Angle Title"], prompts),
      githubPrHandler({
        prDetails: { title: "Original PR Title", body: "", base: { ref: "main" }, head: { ref: "feature" } },
      }),
    ),
  );
  const result = await handleGenerateTitle({ ...OPENED_PR, titleMode: "fresh" });
  expectMatch("fresh mode retries until the title diverges", result.title, "Completely Fresh Angle Title");
  expectMatch("fresh mode spent exactly 2 LLM calls", llmCallCount(harness), 2);
  expectMatch(
    "fresh mode keeps the current title out of the prompt",
    prompts.every((p) => !p.includes("Original PR Title")),
    true,
  );
}

async function testTitleMissingToken(): Promise<void> {
  resetHarness(harness, { githubToken: "" }, chainHandlers(llmResponder(["Never Used"], []), githubPrHandler()));
  const message = await captureRejection(() => handleGenerateTitle(OPENED_PR));
  expectMatch(
    "title without a PAT rejects with the token-required message",
    message,
    "GitHub Personal Access Token is required to update PR title. Set it in the extension popup (needs 'repo' scope).",
  );
  expectMatch("missing token means the LLM is never called", llmCallCount(harness), 0);
  expectMatch("missing token means no PATCH is attempted", patchCalls(harness).length, 0);
}

async function testTitlePrDetailsFetchFailure(): Promise<void> {
  resetHarness(harness, {}, chainHandlers(llmResponder(["Never Used"], []), githubPrHandler({ prDetailsStatus: 404 })));
  const message = await captureRejection(() => handleGenerateTitle(OPENED_PR));
  expectMatch("PR details 404 fails the gather step", message, "Failed to fetch PR details: GITHUB_API_ERROR");
}

async function testDescriptionHappyPath(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(
    harness,
    {},
    chainHandlers(
      llmResponder(["## Summary\nMock description body from the description handler."], prompts),
      githubPrHandler(),
    ),
  );
  const result = await handleGenerateDescription(OPENED_PR);
  expectIncludes(
    "description returns refined proposal",
    result.body,
    "Mock description body from the description handler.",
  );
  // Two-phase review gate: generate proposes, nothing is written to the PR.
  expectMatch("description generate reports not updated", result.updated, false);
  expectMatch("description generate performs no PATCH", patchCalls(harness).length, 0);
}

async function testApplyDescriptionHappyPath(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const result = await handleApplyDescriptionUpdate({ ...OPENED_PR, body: "## Approved\nby the reviewer" });
  expectMatch("apply description reports the update happened", result.updated, true);
  const patches = patchCalls(harness);
  expectMatch("apply description PATCHes the PR", patches.length, 1);
  const patchBody = patches[0]?.body.body;
  expectMatch(
    "apply description PATCHes exactly the approved text",
    typeof patchBody === "string" ? patchBody : "",
    "## Approved\nby the reviewer",
  );
  expectMatch("apply description PATCH body does not touch title", "title" in (patches[0]?.body ?? {}), false);
  expectMatch("apply description never calls the LLM", llmCallCount(harness), 0);
}

async function testApplyDescriptionUpdateFailure(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler({ patchStatus: 403 }));
  const message = await captureRejection(() =>
    handleApplyDescriptionUpdate({ ...OPENED_PR, body: "Approved body that will not land." }),
  );
  expectMatch(
    "apply description surfaces the 403 update failure",
    message,
    "Failed to update PR description: GitHub PAT may lack repo scope or insufficient permissions.",
  );
}

async function testApplyRejectsEmptyText(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const titleMessage = await captureRejection(() => handleApplyTitleUpdate({ ...OPENED_PR, title: "  " }));
  expectMatch("apply title rejects blank text", titleMessage, "Cannot apply an empty title to the PR.");
  const bodyMessage = await captureRejection(() => handleApplyDescriptionUpdate({ ...OPENED_PR, body: "" }));
  expectMatch("apply description rejects empty text", bodyMessage, "Cannot apply an empty description to the PR.");
  expectMatch("rejected apply performs no PATCH", patchCalls(harness).length, 0);
}

async function testMergeTitleHappyPath(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(harness, {}, chainHandlers(llmResponder(["Squash-Merge Mock Title"], prompts), githubPrHandler()));
  const result = await handleGenerateMergeTitle(OPENED_PR);
  expectMatch("merge title returns parsed title", result.title, "Squash-Merge Mock Title");
  expectMatch("merge title never PATCHes the PR", patchCalls(harness).length, 0);
  expectIncludes("merge title prompt carries commit message", prompts[0] ?? "", "Fix widget crash");
}

async function testMergeDescriptionHappyPath(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(
    harness,
    {},
    chainHandlers(
      llmResponder(["## Summary\nMock merge description body for the squash commit."], prompts),
      githubPrHandler(),
    ),
  );
  const result = await handleGenerateMergeDescription(OPENED_PR);
  expectIncludes("merge description returns refined body", result.description, "Mock merge description body");
  expectMatch("merge description never PATCHes the PR", patchCalls(harness).length, 0);
}

async function testGenerateHeadingOnlyResponse(): Promise<void> {
  // A body-only answer (leading "## Summary") leaves the title empty so the content script keeps the user's title.
  resetHarness(harness, {}, chainHandlers(llmResponder(["## Summary\nBody only."]), githubPrHandler()));
  const result = await handleGenerate(GENERATE_DATA);
  expectMatch("heading-only LLM answer yields an empty title", result.title, "");
  expectIncludes("heading-only body still fills the description", result.description, "Body only.");
}

const DANGLING_FENCE_MERGE_ANSWER =
  "## Summary\nMock merge body with a dangling fence.\n\n- **Note** — " +
  "this deliberately padded bullet rambles on far past the sixty word limit with filler after filler after filler " +
  "so the bullet-length check joins the dangling fence and the uncovered commit as a third failure and the " +
  "refinement loop is guaranteed at least one iteration regardless of how lenient the other polish checks are" +
  "\n\n```bash\nnpm test";

// The dangling fence forces a refinement iteration, so the second recorded
// LLM prompt exposes which rubric the loop selected.
function mergeObservationPrompts(prSpec: PrMockSpec): Promise<string[]> {
  const prompts: string[] = [];
  const handler = chainHandlers(llmResponder([DANGLING_FENCE_MERGE_ANSWER], prompts), githubPrHandler(prSpec));
  resetHarness(harness, {}, handler);
  return handleGenerateMergeDescription(OPENED_PR).then(() => prompts);
}

async function testMergeDescriptionPreserveAuthoredParity(): Promise<void> {
  // An authored (non-template) body switches merge refinement to preserve-authored mode (parity with description.ts).
  const authored = await mergeObservationPrompts({
    prDetails: { ...DEFAULT_PR_DETAILS, body: "Hand-written context from the author." },
  });
  expectMatch("authored: dangling fence forces a refinement iteration", authored.length >= 2, true);
  expectIncludes("merge prompt carries the authored body", authored[0] ?? "", "Hand-written context from the author.");
  expectIncludes("authored body selects the preserve-authored rubric", authored[1] ?? "", "REDUCED RUBRIC");
  expectMatch("preserve-authored prompt drops the full rubric", (authored[1] ?? "").includes("12-point rubric"), false);
  expectIncludes("merge refinement keeps anchors disabled", authored[1] ?? "", "ANCHORS: false");
  const plain = await mergeObservationPrompts({});
  expectMatch("empty body still force-iterates", plain.length >= 2, true);
  expectIncludes("empty body keeps the full rubric", plain[1] ?? "", "12-point rubric");
  expectIncludes("empty-body refinement keeps anchors disabled", plain[1] ?? "", "ANCHORS: false");
}

async function main(): Promise<void> {
  console.log("=== Background Handler Tests ===\n");
  await testGenerateHappyPath();
  await testGenerateHeadingOnlyResponse();
  await testGenerateInvalidConfig();
  await testGenerateApiAuthFailure();
  await testTitleHappyPath();
  await testApplyTitleHappyPath();
  await testTitleFreshModeRetries();
  await testTitleMissingToken();
  await testTitlePrDetailsFetchFailure();
  await testDescriptionHappyPath();
  await testApplyDescriptionHappyPath();
  await testApplyDescriptionUpdateFailure();
  await testApplyRejectsEmptyText();
  await testMergeTitleHappyPath();
  await testMergeDescriptionHappyPath();
  await testMergeDescriptionPreserveAuthoredParity();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All handler tests passed");
}

await main();
