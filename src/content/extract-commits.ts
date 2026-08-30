import type { CommitInfo, PRStats } from "../types";
import { errorMessage } from "./errors";
import { log } from "./log";

function getProp(obj: unknown, key: string): unknown {
  if (typeof obj !== "object" || obj === null) return undefined;
  const value: unknown = Reflect.get(obj, key);
  return value;
}

function parseEmbeddedCommits(jsonText: string): CommitInfo[] | null {
  const data: unknown = JSON.parse(jsonText);
  const props = getProp(data, "props");
  const commits = getProp(props, "commits");
  if (!Array.isArray(commits)) {
    log("info", "extractCommitsFromEmbeddedJSON - no commits in embedded data props");
    return null;
  }
  const result: CommitInfo[] = [];
  for (const raw of commits) {
    const message = getProp(raw, "message");
    if (typeof message !== "string") return null;
    result.push({ message });
  }
  log("info", "Extracted " + String(commits.length) + " commits from embedded JSON");
  return result;
}

function extractCommitsFromEmbeddedJSON(): CommitInfo[] | null {
  const partial = document.querySelector('react-partial[partial-name="copilot-generate-pull-title"]');
  if (!partial) {
    log("info", "extractCommitsFromEmbeddedJSON - no copilot-generate-pull-title partial found");
    return null;
  }

  const scriptTag = partial.querySelector('script[type="application/json"][data-target="react-partial.embeddedData"]');
  if (!scriptTag) {
    log("info", "extractCommitsFromEmbeddedJSON - no embeddedData script tag found");
    return null;
  }

  try {
    const parsed = parseEmbeddedCommits(scriptTag.textContent);
    if (parsed) return parsed;
  } catch (err) {
    log("warn", "Failed to parse embedded commits JSON: " + errorMessage(err));
  }
  log("info", "No embedded commits JSON found");
  return null;
}

function extractCommitsFromDOM(): CommitInfo[] {
  const items = document.querySelectorAll(".js-commits-list-item");
  log("info", "Found " + String(items.length) + " commits in DOM (.js-commits-list-item)");
  const commits: CommitInfo[] = [];

  for (const item of items) {
    const titleLink = item.querySelector(".markdown-title");
    const message = (titleLink?.textContent ?? "").trim();

    const bodyEl = item.querySelector("pre.text-small");
    const body = (bodyEl?.textContent ?? "").trim();

    const fullMessage = body ? message + "\n\n" + body : message;

    if (message) {
      commits.push({ message: fullMessage });
    }
  }

  log("info", "extractCommitsFromDOM - extracted " + String(commits.length) + " commits with messages");
  return commits;
}

export function extractCommits(): CommitInfo[] {
  const embedded = extractCommitsFromEmbeddedJSON();
  if (embedded && embedded.length > 0) {
    log("info", "extractCommits - using embedded JSON (" + String(embedded.length) + " commits)");
    return embedded;
  }
  log("info", "extractCommits - falling back to DOM extraction");
  return extractCommitsFromDOM();
}

function matchCount(re: RegExp, text: string): number {
  const match = re.exec(text);
  const raw = match?.[1];
  return raw ? parseInt(raw.replace(/,/g, ""), 10) : 0;
}

export function extractStats(): PRStats | null {
  const statsEl = document.querySelector(".toc-diff-stats");
  if (!statsEl) return null;

  const text = statsEl.textContent;
  return {
    // Regexes kept verbatim from the original content script — rewrite risks changing matched output
    // eslint-disable-next-line sonarjs/super-linear-regex
    files: matchCount(/(\d[\d,]*)\s+changed\s+file/i, text),
    // eslint-disable-next-line sonarjs/super-linear-regex
    additions: matchCount(/([\d,]+)\s+addition/i, text),
    // eslint-disable-next-line sonarjs/super-linear-regex
    deletions: matchCount(/([\d,]+)\s+deletion/i, text),
  };
}

export function extractLinkedIssues(commits: CommitInfo[]): string[] {
  const issues: Record<string, boolean> = {};
  const allMessages = commits.map((c) => c.message).join("\n");
  const patterns = [
    /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
    /#([1-9]\d{2,})/g,
  ];
  for (const pat of patterns) {
    for (;;) {
      const match = pat.exec(allMessages);
      if (match === null) break;
      const num = match[1];
      if (num !== undefined) issues["#" + num] = true;
    }
  }
  const result = Object.keys(issues);
  log("info", "extractLinkedIssues - found: " + result.join(", "));
  return result;
}
