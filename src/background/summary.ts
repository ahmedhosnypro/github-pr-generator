import type { GitHubHunksByFile } from "../github-types";
import type { BranchContext, CommitInfo, FileChange, FileChangeType, GenerateData, PRStats } from "../types";
import { MAX_LISTED_COMMITS } from "./commit-coverage";
import { isNoiseFile } from "./github/diff-parse";
import { wrapUntrustedData } from "./prompts/common";
import { buildAnchorsSection, MAX_ANCHOR_FILES } from "./summary-anchors";

function buildRepoSection(branchContext: BranchContext | null | undefined): string {
  if (!branchContext || !(branchContext.owner || branchContext.baseBranch || branchContext.headBranch)) {
    return "";
  }
  let section = "## Repository\n\n";
  if (branchContext.owner && branchContext.repo) {
    section += "- Repo: " + branchContext.owner + "/" + branchContext.repo + "\n";
  }
  if (branchContext.baseBranch && branchContext.headBranch) {
    section += "- Branch: " + branchContext.headBranch + " → " + branchContext.baseBranch + "\n";
  } else if (branchContext.headBranch) {
    section += "- Branch: " + branchContext.headBranch + "\n";
  }
  return section + "\n";
}

function changeIndicator(type: FileChangeType): string {
  if (type === "added") return "[+]";
  if (type === "removed") return "[-]";
  if (type === "renamed") return "[~]";
  return "[m]";
}

// The commits list cap itself lives in commit-coverage.ts so the generation
// prompt and the coverage scorer can never disagree on the commit universe.

// Cap the changed-files list: a monorepo PR can carry thousands of entries,
// and the uncapped bullet list is what pushes the assembled prompt toward
// 40k tokens. Past a few hundred entries the bullets stop informing the
// model anyway; the remainder is folded into a note for aggregate coverage.
const MAX_LISTED_FILES = 300;

// Cap each message: the API returns the full commit body, so one release-note
// commit can add kilobytes to the prompt, and raw commit text is a mild
// prompt-injection surface. Only the subject line (the unit coverage analysis
// cares about) is kept, control characters stripped, length capped.
const MAX_COMMIT_MESSAGE_LENGTH = 200;

function sanitizeCommitMessage(message: string): string {
  const subject = message.split("\n", 1)[0] ?? "";
  const cleaned = subject.replace(/\p{Cc}|\p{Cf}/gu, "");
  if (cleaned.length <= MAX_COMMIT_MESSAGE_LENGTH) return cleaned;
  return cleaned.slice(0, MAX_COMMIT_MESSAGE_LENGTH - 3) + "...";
}

// Capped, sanitized commit bullets shared by the generation prompt and the
// refinement iteration prompt — both must show the model exactly the commit
// set the coverage scorer judges.
export function buildCommitListText(messages: string[]): string {
  const listed = messages.slice(0, MAX_LISTED_COMMITS);
  let text = "";
  for (const message of listed) {
    text += "- " + sanitizeCommitMessage(message) + "\n";
  }
  if (messages.length > listed.length) {
    const rest = messages.length - listed.length;
    text += `(+${String(rest)} more commits, not listed — cover them thematically rather than itemizing)\n`;
  }
  return text;
}

function buildCommitsSection(commits: CommitInfo[] | undefined): string {
  let section = "## Commits\n\n";
  if (commits && commits.length > 0) {
    section += buildCommitListText(commits.map((c) => c.message));
  } else {
    section += "(No commit information available)\n";
  }
  return section;
}

function buildChangedFilesSection(fileChanges: FileChange[] | undefined): string {
  let section = "\n## Changed Files\n\n";
  if (fileChanges && fileChanges.length > 0) {
    const listed = fileChanges.slice(0, MAX_LISTED_FILES);
    for (const file of listed) {
      section +=
        "- " +
        changeIndicator(file.type) +
        " " +
        file.path +
        " (+" +
        String(file.additions) +
        "/-" +
        String(file.deletions) +
        ")\n";
    }
    if (fileChanges.length > listed.length) {
      const rest = fileChanges.length - listed.length;
      section += `(+${String(rest)} more files, not listed — describe them in aggregate rather than itemizing)\n`;
    }
  } else {
    section += "(No file change information available)\n";
  }
  return section;
}

function buildStatsSection(stats: PRStats): string {
  let section = "\n## Stats\n\n";
  section += "- " + String(stats.files) + " changed files\n";
  section += "- " + String(stats.additions) + " additions\n";
  section += "- " + String(stats.deletions) + " deletions\n";
  return section;
}

// Anchors are only usable when there are real hunks to hang them on: a bare
// file anchor would produce the degenerate file-only marker, which GitHub
// cannot resolve to a hunk-scoped link. Noise files never count either.
export function hasUsableAnchors(_fileChanges: FileChange[] | undefined, hunkRanges: GitHubHunksByFile | null): boolean {
  return countUsableAnchors(_fileChanges, hunkRanges) > 0;
}

// Number of distinct files the prompt can offer diff anchors for: a file
// counts only when parsed hunk ranges exist for it and it is not a noise file
// (the Anchors section emits hunk-scoped markers only). The refinement anchor
// check scales its demand to this supply, so it must share the summary
// builder's cap (mirroring MAX_LISTED_COMMITS in commit-coverage.ts).
export function countUsableAnchors(
  _fileChanges: FileChange[] | undefined,
  hunkRanges: GitHubHunksByFile | null,
): number {
  if (!hunkRanges) return 0;
  let files = 0;
  for (const [filePath, hunks] of Object.entries(hunkRanges)) {
    if (isNoiseFile(filePath) || hunks.length === 0) continue;
    files++;
  }
  return Math.min(files, MAX_ANCHOR_FILES);
}

export function buildChangesSummary(
  data: GenerateData,
  diffText: string | null,
  hunkRanges: GitHubHunksByFile | null,
): string {
  let summary = buildRepoSection(data.branchContext);

  // Inject File Anchors and Hunk Line Ranges section
  if (data.fileChanges && data.fileChanges.length > 0) {
    if (hasUsableAnchors(data.fileChanges, hunkRanges)) {
      summary += buildAnchorsSection(data.fileChanges, hunkRanges);
    }
  }

  summary += buildCommitsSection(data.commits);

  if (data.linkedIssues && data.linkedIssues.length > 0) {
    summary += "\n## Linked Issues\n\n";
    for (const issue of data.linkedIssues) {
      summary += "- " + issue + "\n";
    }
  }

  if (diffText) {
    summary += "\n## Diff\n\n";
    summary += diffText + "\n";
  }

  summary += buildChangedFilesSection(data.fileChanges);

  if (data.stats) {
    summary += buildStatsSection(data.stats);
  }

  // Every section above carries third-party, attacker-controllable content
  // (branch names, commit messages, diff bodies, file paths). The untrusted
  // fence marks the whole summary as data for the model; the prompt builders
  // embed it as-is, so this is the single labeling point that covers them all.
  return wrapUntrustedData(summary);
}
