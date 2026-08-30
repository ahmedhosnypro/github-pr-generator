import type { GitHubHunksByFile } from "../github-types";
import type { BranchContext, CommitInfo, FileChange, FileChangeType, GenerateData, PRStats } from "../types";
import { buildAnchorsSection } from "./summary-anchors";

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

function buildCommitsSection(commits: CommitInfo[] | undefined): string {
  let section = "## Commits\n\n";
  if (commits && commits.length > 0) {
    for (const commit of commits) {
      section += "- " + commit.message + "\n";
    }
  } else {
    section += "(No commit information available)\n";
  }
  return section;
}

function buildChangedFilesSection(fileChanges: FileChange[] | undefined): string {
  let section = "\n## Changed Files\n\n";
  if (fileChanges && fileChanges.length > 0) {
    for (const file of fileChanges) {
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

export function buildChangesSummary(
  data: GenerateData,
  diffText: string | null,
  hunkRanges: GitHubHunksByFile | null,
): string {
  let summary = buildRepoSection(data.branchContext);

  // Inject File Anchors and Hunk Line Ranges section
  if (data.fileChanges && data.fileChanges.length > 0) {
    const hasAnchors = data.fileChanges.some((fc) => fc.diffAnchor.length > 5);
    if ((hunkRanges && Object.keys(hunkRanges).length > 0) || hasAnchors) {
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

  return summary;
}
