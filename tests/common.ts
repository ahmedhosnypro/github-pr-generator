// Unit tests for the URL-safety guards in src/background/github/common.ts:
// isValidRepoName must reject path-traversal segments that pass the charset
// check, and isValidPrNumber must accept only plain positive integers.
// Also covers the shared 403/429 mapping: GITHUB_RATE_LIMITED only when the
// primary quota is exhausted, every other 403 is a plain GITHUB_API_ERROR.
import { isRateLimited, isValidPrNumber, isValidRepoName, rateLimitOrApiError } from "../src/background/github/common";
import { expectMatch, getFailures } from "./expect-helpers";

function testRepoNames(): void {
  const valid = ["octocat", "hello-world", "foo_bar", "repo.name", "a.b.c", "v1.2.3"];
  for (const name of valid) {
    expectMatch(`valid repo name accepted: ${name}`, isValidRepoName(name), true);
  }

  const invalid = ["", ".", "..", "bad/name", "bad name", "name?", "owner\\repo"];
  for (const name of invalid) {
    expectMatch(`invalid repo name rejected: ${JSON.stringify(name)}`, isValidRepoName(name), false);
  }
}

function testPrNumbers(): void {
  const valid = ["1", "42", "9999"];
  for (const n of valid) {
    expectMatch(`valid PR number accepted: ${n}`, isValidPrNumber(n), true);
  }

  const invalid = ["", "0", "007", "1.5", "-1", "abc", "..", "1/2", "1?foo=bar", "1 OR 1=1", " 1", "1 "];
  for (const n of invalid) {
    expectMatch(`invalid PR number rejected: ${JSON.stringify(n)}`, isValidPrNumber(n), false);
  }
}

function testRateLimitMapping(): void {
  const exhausted = new Response("Forbidden", { status: 403, headers: { "X-RateLimit-Remaining": "0" } });
  expectMatch("403 with remaining 0 is rate limited", isRateLimited(exhausted), true);
  expectMatch(
    "403 with remaining 0 maps to GITHUB_RATE_LIMITED",
    rateLimitOrApiError(exhausted)?.error,
    "GITHUB_RATE_LIMITED",
  );
  expectMatch("403 with remaining 0 carries remaining header", rateLimitOrApiError(exhausted)?.rateLimitRemaining, "0");

  const quotaLeft = new Response("Forbidden", { status: 403, headers: { "X-RateLimit-Remaining": "59" } });
  expectMatch("403 with quota left is NOT rate limited", isRateLimited(quotaLeft), false);
  expectMatch("403 with quota maps to GITHUB_API_ERROR", rateLimitOrApiError(quotaLeft)?.error, "GITHUB_API_ERROR");
  expectMatch("403 with quota carries status", rateLimitOrApiError(quotaLeft)?.status, 403);
  expectMatch(
    "403 with quota message names SSO/permissions",
    rateLimitOrApiError(quotaLeft)?.message?.includes("SSO enforcement"),
    true,
  );

  const noHeader = new Response("Forbidden", { status: 403 });
  expectMatch("403 without header maps to GITHUB_API_ERROR", rateLimitOrApiError(noHeader)?.error, "GITHUB_API_ERROR");

  const secondary = new Response("Too Many Requests", { status: 429, headers: { "X-RateLimit-Remaining": "81" } });
  expectMatch(
    "429 maps to GITHUB_RATE_LIMITED regardless of header",
    rateLimitOrApiError(secondary)?.error,
    "GITHUB_RATE_LIMITED",
  );

  const ok = new Response("OK", { status: 200 });
  expectMatch("ok status maps to null", rateLimitOrApiError(ok), null);
  const notFound = new Response("Not Found", { status: 404 });
  expectMatch("404 maps to null (callers handle it)", rateLimitOrApiError(notFound), null);
}

function main(): void {
  console.log("=== GitHub Common Guard Tests ===\n");
  testRepoNames();
  testPrNumbers();
  testRateLimitMapping();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All GitHub common guard tests passed");
}

main();
