import type { StoredConfig } from "./types";

/** Response shapes sent back via sendResponse. Every handler may also answer with MessageErrorResponse. */
export interface KeepaliveResponse {
  ok: true;
}

export interface GenerateResponse {
  title: string;
  description: string;
}

export interface GenerateTitleResponse {
  title: string;
  updated: boolean;
}

export interface GenerateDescriptionResponse {
  body: string;
  updated: boolean;
}

export interface GenerateMergeTitleResponse {
  title: string;
}

export interface GenerateMergeDescriptionResponse {
  description: string;
}

export interface MessageErrorResponse {
  error: string;
}

export interface GetConfigResponse {
  apiEndpoint: string;
  model: string;
  hasKey: boolean;
  hasGithubToken: boolean;
}

export interface SaveConfigResponse {
  ok: boolean;
  error?: string;
}

export type GetStoredConfigResponse = StoredConfig;
