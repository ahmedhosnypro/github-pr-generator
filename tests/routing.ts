// Message-routing tests for src/background.ts: the chrome.runtime.onMessage
// listener must dispatch every ExtensionMessage type to the right handler,
// relay results and failures through sendResponse, and answer keepalive pings
// synchronously without keeping the channel open. Chrome APIs and fetch are
// mocked by tests/handlers-harness.ts, installed BEFORE background.ts is
// imported (importing it registers the listener and loads config at module
// scope). No real network, no real extension APIs.
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import {
  chainHandlers,
  githubPrHandler,
  installBackgroundHarness,
  llmResponder,
  patchCalls,
  resetHarness,
} from "./handlers-harness";

const harness = installBackgroundHarness();

// Importing the entrypoint registers the onMessage listener on the stub.
await import("../src/background");

interface DispatchResult {
  keepAlive: boolean | string;
  response: unknown;
}

function messageListener() {
  const listener = harness.messageListeners[0];
  if (!listener) throw new Error("background.ts did not register an onMessage listener");
  return listener;
}

/**
 * Invoke the registered listener. sendResponse resolves the returned promise
 * (on a microtask, so a synchronous reply still observes the listener's return
 * value); a listener that returns false without responding resolves with no
 * response; a listener that never responds resolves via the timeout.
 */
function dispatch(message: unknown): Promise<DispatchResult> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve({ keepAlive: "timeout", response: undefined });
    }, 3000);
    const result: DispatchResult = { keepAlive: "pending", response: undefined };
    result.keepAlive = messageListener()(message, {}, (response: unknown) => {
      result.response = response;
      queueMicrotask(() => {
        clearTimeout(timer);
        resolve(result);
      });
    });
    if (!result.keepAlive) {
      queueMicrotask(() => {
        clearTimeout(timer);
        resolve(result);
      });
    }
  });
}

const OPENED_PR_MESSAGE = { owner: "octo", repo: "demo", prNumber: "123" };

async function testKeepalivePing(): Promise<void> {
  const { keepAlive, response } = await dispatch({ type: "__keepalive_ping__" });
  expectMatch("keepalive ping replies immediately with ok", JSON.stringify(response), JSON.stringify({ ok: true }));
  expectMatch("keepalive ping does not keep the channel open", keepAlive, false);
}

async function testGetConfig(): Promise<void> {
  resetHarness(harness, {}, null);
  const { keepAlive, response } = await dispatch({ type: "getConfig" });
  const r = response as { apiEndpoint?: string; model?: string; hasKey?: boolean; hasGithubToken?: boolean };
  expectMatch("getConfig stays alive for the async read", keepAlive, true);
  expectMatch("getConfig returns endpoint", r.apiEndpoint, "https://llm.invalid/v1");
  expectMatch("getConfig returns model", r.model, "test-model");
  expectMatch("getConfig reports the API key presence", r.hasKey, true);
  expectMatch("getConfig reports the PAT presence", r.hasGithubToken, true);
  expectMatch("getConfig never leaks the raw API key", "apiKey" in r, false);
}

async function testSaveConfig(): Promise<void> {
  resetHarness(harness, {}, null);
  const { keepAlive, response } = await dispatch({ type: "saveConfig", data: { model: "routed-model" } });
  expectMatch("saveConfig stays alive for the storage write", keepAlive, true);
  expectMatch("saveConfig reports success", JSON.stringify(response), JSON.stringify({ ok: true }));
  expectMatch("saveConfig wrote the model to storage", harness.storageSets[0]?.model, "routed-model");
}

async function testGenerateRouting(): Promise<void> {
  const prompts: string[] = [];
  resetHarness(harness, {}, llmResponder(["Routed Title\n\n## Summary\nRouted description body."], prompts));
  const { keepAlive, response } = await dispatch({
    type: "generate",
    data: { commits: [{ message: "routed commit" }] },
  });
  const r = response as { title?: string; description?: string };
  expectMatch("generate stays alive for the async task", keepAlive, true);
  expectMatch("router relays the generated title", r.title, "Routed Title");
  expectIncludes("router relays the generated description", r.description ?? "", "Routed description body.");
  expectIncludes("routed prompt carried the commit", prompts[0] ?? "", "routed commit");
}

async function testGenerateHeadingOnlyRouting(): Promise<void> {
  // A body-only LLM answer (leading "## Summary") routes through with an empty
  // title — the content script keeps the user's existing title in that case.
  resetHarness(harness, {}, chainHandlers(llmResponder(["## Summary\nHeading-only routed body."]), githubPrHandler()));
  const { response } = await dispatch({ type: "generate", data: { commits: [{ message: "routed commit" }] } });
  const r = response as { title?: string; description?: string };
  expectMatch("heading-only response routes an empty title", r.title, "");
  expectIncludes("heading-only response keeps the full body", r.description ?? "", "Heading-only routed body.");
}

async function testGenerateErrorRelay(): Promise<void> {
  resetHarness(harness, { apiKey: "" }, llmResponder(["unused"]));
  const { response } = await dispatch({ type: "generate", data: {} });
  const r = response as { error?: string };
  expectMatch(
    "handler rejections come back as { error }",
    r.error,
    "API key is not configured. Set it in the extension popup.",
  );
}

async function testGenerateTitleRouting(): Promise<void> {
  resetHarness(harness, {}, chainHandlers(llmResponder(["Routed PR Title"]), githubPrHandler()));
  const { keepAlive, response } = await dispatch({ type: "generateTitle", data: OPENED_PR_MESSAGE });
  const r = response as { title?: string; updated?: boolean };
  expectMatch("generateTitle stays alive", keepAlive, true);
  expectMatch("router relays the proposed title", r.title, "Routed PR Title");
  // Two-phase review gate: generate proposes, nothing is written to the PR.
  expectMatch("generator relays updated=false", r.updated, false);
  expectMatch("generateTitle performs no PATCH", patchCalls(harness).length, 0);
}

async function testGenerateDescriptionRouting(): Promise<void> {
  resetHarness(
    harness,
    {},
    chainHandlers(llmResponder(["## Summary\nRouted PR description body."]), githubPrHandler()),
  );
  const { response } = await dispatch({ type: "generateDescription", data: OPENED_PR_MESSAGE });
  const r = response as { body?: string; updated?: boolean };
  expectIncludes("router relays the proposed body", r.body ?? "", "Routed PR description body.");
  expectMatch("generator relays updated=false", r.updated, false);
  expectMatch("generateDescription performs no PATCH", patchCalls(harness).length, 0);
}

async function testApplyTitleRouting(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const { keepAlive, response } = await dispatch({
    type: "applyTitleUpdate",
    data: { ...OPENED_PR_MESSAGE, title: "Approved Routed Title" },
  });
  const r = response as { title?: string; updated?: boolean };
  expectMatch("applyTitleUpdate stays alive", keepAlive, true);
  expectMatch("router relays the apply updated flag", r.updated, true);
  const patches = patchCalls(harness);
  expectMatch("applyTitleUpdate PATCHes exactly the approved title", patches[0]?.body.title, "Approved Routed Title");
  expectMatch("applyTitleUpdate does not PATCH the body", "body" in (patches[0]?.body ?? {}), false);
}

async function testApplyDescriptionRouting(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const { response } = await dispatch({
    type: "applyDescriptionUpdate",
    data: { ...OPENED_PR_MESSAGE, body: "Approved routed body" },
  });
  const r = response as { body?: string; updated?: boolean };
  expectMatch("router relays the apply updated flag", r.updated, true);
  const patches = patchCalls(harness);
  expectMatch(
    "applyDescriptionUpdate PATCHes exactly the approved body",
    patches[0]?.body.body,
    "Approved routed body",
  );
  expectMatch("applyDescriptionUpdate does not PATCH the title", "title" in (patches[0]?.body ?? {}), false);
}

async function testApplyValidationErrorRelay(): Promise<void> {
  resetHarness(harness, {}, githubPrHandler());
  const { response } = await dispatch({ type: "applyTitleUpdate", data: {} });
  const r = response as { error?: string };
  expectMatch(
    "apply handler rejections come back as { error }",
    r.error,
    "Missing PR owner/repo/number for the title update.",
  );
  expectMatch("rejected apply performs no PATCH", patchCalls(harness).length, 0);
}

async function testGenerateMergeTitleRouting(): Promise<void> {
  resetHarness(harness, {}, chainHandlers(llmResponder(["Routed Merge Title"]), githubPrHandler()));
  const { response } = await dispatch({ type: "generateMergeTitle", data: OPENED_PR_MESSAGE });
  const r = response as { title?: string };
  expectMatch("router relays the merge title", r.title, "Routed Merge Title");
  expectMatch("merge title routing never PATCHes", patchCalls(harness).length, 0);
}

async function testGenerateMergeDescriptionRouting(): Promise<void> {
  resetHarness(
    harness,
    {},
    chainHandlers(llmResponder(["## Summary\nRouted merge description body."]), githubPrHandler()),
  );
  const { response } = await dispatch({ type: "generateMergeDescription", data: OPENED_PR_MESSAGE });
  const r = response as { description?: string };
  expectIncludes("router relays the merge description", r.description ?? "", "Routed merge description body.");
  expectMatch("merge description routing never PATCHes", patchCalls(harness).length, 0);
}

async function testUnknownMessageType(): Promise<void> {
  resetHarness(harness, {}, null);
  const { keepAlive, response } = await dispatch({ type: "definitely-not-a-real-message" });
  expectMatch("unknown type keeps no channel open", keepAlive, false);
  expectMatch("unknown type gets no response", response, undefined);
}

async function main(): Promise<void> {
  console.log("=== Background Message Routing Tests ===\n");
  expectMatch("background registered an onMessage listener", harness.messageListeners.length, 1);
  expectMatch("background registered the stream port listener", harness.connectListeners.length, 1);

  await testKeepalivePing();
  await testGetConfig();
  await testSaveConfig();
  await testGenerateRouting();
  await testGenerateHeadingOnlyRouting();
  await testGenerateErrorRelay();
  await testGenerateTitleRouting();
  await testGenerateDescriptionRouting();
  await testApplyTitleRouting();
  await testApplyDescriptionRouting();
  await testApplyValidationErrorRelay();
  await testGenerateMergeTitleRouting();
  await testGenerateMergeDescriptionRouting();
  await testUnknownMessageType();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All routing tests passed");
}

await main();
