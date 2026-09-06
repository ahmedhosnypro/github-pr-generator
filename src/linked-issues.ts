import type { CommitInfo } from "./types";

const ISSUE_PATTERNS = [
  /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
  /#([1-9]\d{2,})/g,
];

export function extractLinkedIssues(commits: CommitInfo[]): string[] {
  const linkedIssues: string[] = [];
  for (const commit of commits) {
    for (const pattern of ISSUE_PATTERNS) {
      let match = pattern.exec(commit.message);
      while (match !== null) {
        const issueNumber = match[1];
        if (issueNumber !== undefined && !linkedIssues.includes("#" + issueNumber)) {
          linkedIssues.push("#" + issueNumber);
        }
        match = pattern.exec(commit.message);
      }
    }
  }
  return linkedIssues;
}
