// Shared helpers for the PR-list pagination tests (tests/pr-lists.ts and
// tests/pr-lists-partial.ts). Both files mock global fetch only — no real
// network. The fetch-mock plumbing itself lives in tests/fetch-mock.ts and is
// re-exported here for these suites.
import { jsonResponse } from "./fetch-mock";

export {
  BASE_CONFIG,
  type FetchImpl,
  jsonResponse,
  urlString,
  withCapturedLogs,
  withFetch,
} from "./fetch-mock";

// A full (100-item) commits page, for tests that exercise pagination bounds.
export function fullCommitPage(): Response {
  return jsonResponse(Array.from({ length: 100 }, () => ({ commit: { message: "m" } })));
}

// A full (100-item) files page, for tests that exercise pagination bounds.
export function fullFilePage(): Response {
  return jsonResponse(Array.from({ length: 100 }, () => ({ filename: "a.ts", status: "added" })));
}
