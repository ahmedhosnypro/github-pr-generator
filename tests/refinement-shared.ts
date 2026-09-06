// Shared fixtures for the refinement scoring tests
// (refinement.ts, refinement-fences.ts, refinement-scoring.ts).

export const FULL_DESCRIPTION = [
  "## Summary",
  "Fixed the token expiry race by refreshing before each request.",
  "",
  "## Changes",
  "- **Auth** — refresh token early [[1]](diffhunk://#diff-aaaa_L1-R2)",
  "- **Client** — retries once [[2]](diffhunk://#diff-bbbb_L3-R4)",
  "- **Tests** — covers the race [[3]](diffhunk://#diff-cccc_L5-R6)",
  "",
  "## Testing",
  "1. Run the suite",
  "```bash",
  "bun run test",
  "```",
  "Expected: all green",
  "",
  "2. Retry with an expired token",
  "```bash",
  "bun run dev",
  "```",
  "Expected: request succeeds after refresh",
  "",
  "Scope: 3 files, +10/-2",
].join("\n");

export const SMALL_STATS = { files: 1, additions: 5, deletions: 2 };
export const LARGE_STATS = { files: 12, additions: 600, deletions: 40 };
