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
