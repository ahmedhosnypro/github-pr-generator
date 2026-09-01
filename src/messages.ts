import type { GenerateData, OpenedPRData, SaveConfigData } from "./types";

export interface KeepalivePingMessage {
  type: "__keepalive_ping__";
}

interface GenerateMessage {
  type: "generate";
  data?: GenerateData;
}

interface GenerateTitleMessage {
  type: "generateTitle";
  data?: OpenedPRData;
}

interface GenerateDescriptionMessage {
  type: "generateDescription";
  data?: OpenedPRData;
}

interface GenerateMergeTitleMessage {
  type: "generateMergeTitle";
  data?: OpenedPRData;
}

interface GenerateMergeDescriptionMessage {
  type: "generateMergeDescription";
  data?: OpenedPRData;
}

interface GetConfigMessage {
  type: "getConfig";
  data?: null;
}

interface SaveConfigMessage {
  type: "saveConfig";
  data?: SaveConfigData | null;
}

interface GetStoredConfigMessage {
  type: "getStoredConfig";
  data?: null;
}

export const STREAM_PORT_NAME = "pr-generator-stream";

/** Request sent by the content script over the streaming port. */
export interface StreamRequest {
  type: "generate" | "generateMergeTitle" | "generateMergeDescription";
  data?: GenerateData | OpenedPRData;
}

export type ExtensionMessage =
  | KeepalivePingMessage
  | GenerateMessage
  | GenerateTitleMessage
  | GenerateDescriptionMessage
  | GenerateMergeTitleMessage
  | GenerateMergeDescriptionMessage
  | GetConfigMessage
  | SaveConfigMessage
  | GetStoredConfigMessage;
