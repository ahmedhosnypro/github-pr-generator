import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface TestPrRef {
  owner: string;
  repo: string;
  number: number;
}

export interface Config {
  githubToken?: string;
  testPr?: TestPrRef;
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  labModel?: string;
  labEffort?: string;
}

export interface GhCommit {
  messageHeadline: string;
  messageBody?: string;
}

export interface GhPrFile {
  path: string;
  additions: number;
  deletions: number;
}

// The gh CLI does not return `type`/`diffAnchor`; the extension builds them itself,
// so files fetched via `gh pr view --json files` render those fields as undefined.
export interface FileChange extends GhPrFile {
  type?: string;
  diffAnchor?: string;
}

export interface GhPrDetails {
  number: number;
  title: string;
  body: string | null;
  headRefName: string;
  baseRefName: string;
  commits: GhCommit[];
  files: GhPrFile[];
  additions: number;
  deletions: number;
}

const CONFIG_FILE = join(import.meta.dir, "..", "config.local.json");

export function loadConfig(): Config {
  try {
    const content = readFileSync(CONFIG_FILE, "utf-8");
    return JSON.parse(content) as Config;
  } catch (error) {
    console.error("Failed to load config.local.json:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

interface GhCommandError extends Error {
  stdout?: string;
  stderr?: string;
}

export function runGhCommand(args: string): string {
  try {
    const result = execSync(`gh ${args}`, { encoding: "utf-8", stdio: "pipe" });
    return result.trim();
  } catch (error) {
    const ghError = error as GhCommandError;
    console.error(`gh command failed: ${ghError.message}`);
    if (ghError.stdout) console.error("stdout:", ghError.stdout);
    if (ghError.stderr) console.error("stderr:", ghError.stderr);
    throw error;
  }
}

export function fetchPRDetails(testPr: TestPrRef): GhPrDetails {
  const { owner, repo, number } = testPr;
  const json = runGhCommand(
    `pr view ${String(number)} --repo ${owner}/${repo} --json number,title,body,headRefName,baseRefName,commits,files,additions,deletions`,
  );
  return JSON.parse(json) as GhPrDetails;
}

export function fetchPRCommits(testPr: TestPrRef): string[] {
  const { owner, repo, number } = testPr;
  const json = runGhCommand(`pr view ${String(number)} --repo ${owner}/${repo} --json commits`);
  const data = JSON.parse(json) as { commits: GhCommit[] };
  return data.commits.map((c) => `${c.messageHeadline}\n\n${c.messageBody ?? ""}`);
}

export function fetchPRFiles(testPr: TestPrRef): GhPrFile[] {
  const { owner, repo, number } = testPr;
  const json = runGhCommand(`pr view ${String(number)} --repo ${owner}/${repo} --json files`);
  const data = JSON.parse(json) as { files: GhPrFile[] };
  return data.files;
}

export function extractLinkedIssues(commits: string[]): string[] {
  const issues: Record<string, true> = {};
  const allMessages = commits.map((c) => c).join("\n");
  const patterns = [
    /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
    /#([1-9]\d{2,})/g,
  ];
  for (const pattern of patterns) {
    let match = pattern.exec(allMessages);
    while (match !== null) {
      const issueNumber = match[1];
      if (issueNumber) issues[`#${issueNumber}`] = true;
      match = pattern.exec(allMessages);
    }
  }
  return Object.keys(issues);
}
