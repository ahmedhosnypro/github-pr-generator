// Unit tests for the URL-safety guards in src/background/github/common.ts:
// isValidRepoName must reject path-traversal segments that pass the charset
// check, and isValidPrNumber must accept only plain positive integers.
import { isValidPrNumber, isValidRepoName } from "../src/background/github/common";
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

function main(): void {
  console.log("=== GitHub Common Guard Tests ===\n");
  testRepoNames();
  testPrNumbers();

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ All GitHub common guard tests passed");
}

main();
