import {
  commitHeadlineWords,
  countCoveredCommits as countCoveredCommitsImpl,
  commitHeadline as getCommitHeadlineImpl,
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

export function computeCoverageDetails(
  commits: string[],
  text: string,
): { covered: number; details: CoverageDetail[] } {
  const lowered = text.toLowerCase();
  const details = commits.map((commit, i) => {
    const headline = getCommitHeadline(commit);
    const covered = commitHeadlineWords(commit).some((w) => lowered.includes(w));
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

// Logs the per-commit coverage lines and computes the percentage.
export function logCoverageBreakdown(
  header: string,
  details: CoverageDetail[],
): { covered: number; coverage: number; coveragePercent: string } {
  console.log(header);
  details.forEach((d) => {
    const status = d.covered ? "✓ COVERED" : "✗ MISSING";
    console.log(`  ${status}: ${d.headline}`);
  });
  const covered = details.filter((d) => d.covered).length;
  const coverage = (covered / details.length) * 100;
  const coveragePercent = coverage.toFixed(1);
  return { covered, coverage, coveragePercent };
}

// Full "breakdown + SUMMARY + verdict" block used by the commit-coverage and
// extension-coverage scripts; `summaryLabel` is the label of the count line.
export function logCoverageVerdictBlock(
  header: string,
  summaryLabel: string,
  details: CoverageDetail[],
): { covered: number; coverage: number; coveragePercent: string } {
  const result = logCoverageBreakdown(header, details);
  console.log("\n=== SUMMARY ===");
  console.log(`${summaryLabel}: ${String(result.covered)}/${String(details.length)} (${result.coveragePercent}%)`);
  logCommitCoverageVerdict(result.coverage, result.coveragePercent);
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
