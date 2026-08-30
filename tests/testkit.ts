import type { GhPrDetails, TestPrRef } from "./shared";
import { fetchPRDetails, loadConfig, runGhCommand } from "./shared";

export interface CoverageDetail {
  commit: number;
  headline: string;
  covered: boolean;
}

export interface CoverageResult {
  passed: boolean;
  coverage?: string;
  covered?: number;
  total?: number;
}

export interface TestContext {
  testPr: TestPrRef;
  prDetails: GhPrDetails;
  githubToken: string;
}

function headlineWords(commit: string): string[] {
  const headline = (commit.split("\n")[0] ?? "").toLowerCase();
  return headline.split(/\s+/).filter((w) => w.length > 3);
}

export function getCommitHeadline(commit: string): string {
  return (commit.split("\n")[0] ?? "").toLowerCase();
}

export function countCoveredCommits(commits: string[], text: string): number {
  const lowered = text.toLowerCase();
  return commits.filter((commit) => headlineWords(commit).some((w) => lowered.includes(w))).length;
}

export function computeCoverageDetails(
  commits: string[],
  text: string,
): { covered: number; details: CoverageDetail[] } {
  const lowered = text.toLowerCase();
  const details = commits.map((commit, i) => {
    const headline = getCommitHeadline(commit);
    const covered = headlineWords(commit).some((w) => lowered.includes(w));
    return { commit: i + 1, headline, covered };
  });
  return { covered: details.filter((d) => d.covered).length, details };
}

export function logCommitCoverageVerdict(coverage: number, coveragePercent: string): void {
  if (coverage >= 90) {
    console.log(`\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%)`);
  } else if (coverage >= 70) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) - some commits not mentioned`);
  } else {
    console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%) - many commits missing`);
  }
}

type TestFn = (ctx: TestContext) => CoverageResult | Promise<CoverageResult>;

export async function runTest(title: string, run: TestFn): Promise<void> {
  console.log(title);

  const config = loadConfig();
  const testPr = config.testPr;
  if (!testPr) {
    console.error("No testPr configuration found in config.local.json");
    process.exit(1);
  }
  const githubToken = config.githubToken;
  if (!githubToken) {
    console.error("No githubToken configured - cannot fetch PR data");
    process.exit(1);
  }
  try {
    runGhCommand("auth status");
  } catch {
    console.error("GitHub CLI not authenticated. Run: gh auth login");
    process.exit(1);
  }

  console.log(`\nFetching PR #${String(testPr.number)} from ${testPr.owner}/${testPr.repo}...`);

  try {
    const prDetails = fetchPRDetails(testPr);
    console.log(`PR Title: ${prDetails.title}`);
    console.log(`Base: ${prDetails.baseRefName} <- Head: ${prDetails.headRefName}`);
    console.log(`Files changed: ${String(prDetails.files.length)}`);
    console.log(`Additions: ${String(prDetails.additions)}, Deletions: ${String(prDetails.deletions)}`);

    const result = await run({ testPr, prDetails, githubToken });
    process.exit(result.passed ? 0 : 1);
  } catch (error) {
    console.error("Test failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
