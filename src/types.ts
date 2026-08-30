/**
 * Shared types for the GitHub PR Generator extension: config shapes, the
 * chrome.runtime message protocol shared by content/popup/background, and
 * the GitHub/LLM API data shapes.
 */

/** Fully-resolved runtime configuration (chrome.storage merged over config.local.json). */
export interface ExtensionConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
  githubToken: string;
  diffEnabled: boolean;
  diffMaxLines: number;
  diffMaxBytes: number;
}

/** Partial defaults loaded from the bundled config.local.json file. */
export interface FileConfig {
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  githubToken?: string;
  diffEnabled?: boolean;
  diffMaxLines?: number;
  diffMaxBytes?: number;
}

/** Raw values as persisted in chrome.storage.local (older saves may be strings). */
export interface StoredConfig {
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  githubToken?: string;
  diffEnabled?: boolean | string;
  diffMaxLines?: number | string;
  diffMaxBytes?: number | string;
}

/** Fields accepted by the "saveConfig" message (all optional: popup autosaves per field). */
export interface SaveConfigData {
  apiEndpoint?: string;
  apiKey?: string;
  model?: string;
  githubToken?: string;
  diffEnabled?: boolean | string;
  diffMaxLines?: string | number;
  diffMaxBytes?: string | number;
}

export interface CommitInfo {
  message: string;
}

export type FileChangeType = "added" | "removed" | "renamed" | "modified";

export interface FileChange {
  path: string;
  type: FileChangeType;
  additions: number;
  deletions: number;
  diffAnchor: string;
}

export interface PRStats {
  files: number;
  additions: number;
  deletions: number;
}

export interface BranchContext {
  owner: string;
  repo: string;
  baseBranch: string;
  headBranch: string;
}

/** Payload of the "generate" message (PR creation page, scraped from the DOM by content script). */
export interface GenerateData {
  commits?: CommitInfo[];
  fileChanges?: FileChange[];
  stats?: PRStats | null;
  branchContext?: BranchContext | null;
  linkedIssues?: string[];
  existingBody?: string;
}

/** Payload of the generate* messages sent from opened-PR and merge-confirmation pages. */
export interface OpenedPRData {
  owner?: string;
  repo?: string;
  prNumber?: string;
  existingTitle?: string;
  existingDescription?: string;
  existingMergeTitle?: string;
  existingMergeDescription?: string;
  branchContext?: BranchContext;
}

export type { ExtensionMessage } from "./messages";
export type {
  GenerateDescriptionResponse,
  GenerateMergeDescriptionResponse,
  GenerateMergeTitleResponse,
  GenerateResponse,
  GenerateTitleResponse,
  GetConfigResponse,
  GetStoredConfigResponse,
  MessageErrorResponse,
  SaveConfigResponse,
} from "./responses";
