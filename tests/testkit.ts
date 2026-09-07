import {
  countCoveredCommits as countCoveredCommitsImpl,
  coverageThreshold,
  commitHeadline as getCommitHeadlineImpl,
  isCommitCovered,
  listedCommits,
} from "../src/background/commit-coverage";
import type { FileChange, GhPrDetails, TestPrRef } from "./shared";
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

export function getCommitHeadline(commit: string): string {
  return getCommitHeadlineImpl(commit);
}

export function countCoveredCommits(commits: string[], text: string): number {
  return countCoveredCommitsImpl(commits, text);
}

// Scores coverage with the shipped scorer's semantics, not a re-implementation:
// the judged universe is the prompt-listed subset (listedCommits) and matching
// is isCommitCovered (trailing-"s" stemming, wordless-headline fallback).
export function computeCoverageDetails(
  commits: string[],
  text: string,
): { covered: number; details: CoverageDetail[] } {
  const lowered = text.toLowerCase();
  const listed = listedCommits(commits);
  if (listed.length < commits.length) {
    console.log(
      `Coverage scored on the first ${String(listed.length)} listed commits of ${String(commits.length)} total.`,
    );
  }
  const details = listed.map((commit, i) => {
    const headline = getCommitHeadline(commit);
    return { commit: i + 1, headline, covered: isCommitCovered(commit, lowered) };
  });
  return { covered: details.filter((d) => d.covered).length, details };
}

// Required coverage percent, matching the runtime refinement loop
// (coverageThreshold): 90% up to 20 listed commits, declining to a 60% floor.
export function requiredCoveragePercent(listedCommitCount: number): number {
  return coverageThreshold(listedCommitCount) * 100;
}

export function logCommitCoverageVerdict(coverage: number, coveragePercent: string, requiredCoverage: number): void {
  if (coverage >= requiredCoverage) {
    console.log(`\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%)`);
  } else if (coverage >= 70) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) - some commits not mentioned`);
  } else {
    console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%) - many commits missing`);
  }
}

// Logs the per-commit coverage lines and computes the percentage plus the
// required coverage for this commit count (runtime coverageThreshold semantics).
export function logCoverageBreakdown(
  header: string,
  details: CoverageDetail[],
): { covered: number; coverage: number; coveragePercent: string; requiredCoverage: number } {
  console.log(header);
  details.forEach((d) => {
    const status = d.covered ? "✓ COVERED" : "✗ MISSING";
    console.log(`  ${status}: ${d.headline}`);
  });
  const covered = details.filter((d) => d.covered).length;
  const coverage = (covered / details.length) * 100;
  const coveragePercent = coverage.toFixed(1);
  return { covered, coverage, coveragePercent, requiredCoverage: requiredCoveragePercent(details.length) };
}

// Full "breakdown + SUMMARY + verdict" block used by the commit-coverage and
// extension-coverage scripts; `summaryLabel` is the label of the count line.
export function logCoverageVerdictBlock(
  header: string,
  summaryLabel: string,
  details: CoverageDetail[],
): { covered: number; coverage: number; coveragePercent: string; requiredCoverage: number } {
  const result = logCoverageBreakdown(header, details);
  console.log("\n=== SUMMARY ===");
  console.log(
    `${summaryLabel}: ${String(result.covered)}/${String(details.length)} (${result.coveragePercent}%, required: ${String(result.requiredCoverage)}%)`,
  );
  logCommitCoverageVerdict(result.coverage, result.coveragePercent, result.requiredCoverage);
  return result;
}

// Logs the prompt-analysis block shared by the full-coverage and pr-creation
// scripts, then reports how many commits are represented in the summary.
export function logPromptAnalysis(
  header: string,
  prompt: string,
  changesSummary: string,
  commits: string[],
  files: FileChange[],
  diffText: string | null,
  existingBody: string,
  existingBodyNote: string,
): number {
  const diffIncluded = diffText !== null ? `Yes (${String(diffText.length)} chars)` : "No";
  console.log(header);
  console.log(`Prompt length: ${String(prompt.length)} chars`);
  console.log(`Changes summary length: ${String(changesSummary.length)} chars`);
  console.log(`Commits in prompt: ${String(commits.length)}`);
  console.log(`Files in prompt: ${String(files.length)}`);
  console.log(`Diff included: ${diffIncluded}`);
  console.log(`Existing body length: ${String(existingBody.length)} chars${existingBodyNote}`);

  const coveredInSummary = countCoveredCommits(commits, changesSummary);
  console.log(`\nCommits represented in changes summary: ${String(coveredInSummary)}/${String(commits.length)}`);
  return coveredInSummary;
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
  // githubToken is optional: PR metadata comes from the authenticated gh CLI, and
  // suites that fetch diffs (tests/prompt.ts) fall back to unauthenticated calls.
  const githubToken = config.githubToken ?? "";
  if (!githubToken) {
    console.warn(
      "Warning: no githubToken in config.local.json — PR data still fetched via gh; diff fetches run unauthenticated.",
    );
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
