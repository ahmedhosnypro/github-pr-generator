/** In-page log panel + persistent log storage (chrome.storage.local). */

const LOG_PANEL_ID = "ai-pr-generator-log-panel";
const LOG_KEY = "ai_pr_gen_logs";
const MAX_LOG_PANEL_LINES = 200;
const MAX_LOG_LINE_CHARS = 500;
const LOG_RETENTION_MS = 24 * 60 * 60 * 1000;

type LogLevel = "info" | "warn" | "error";

// Persisted entry: ISO timestamp for retention pruning, line keeps the human
// time string for display. Anything else in storage is legacy/unreadable.
interface StoredLogEntry {
  at: string;
  line: string;
}

interface LogStorage {
  ai_pr_gen_logs?: unknown[];
}

const REDACTED = "[redacted]";
// Secret-shaped tokens: GitHub PAT/OAuth/server tokens, Bearer credentials,
// Slack tokens, AI provider keys. Applied before any persistence or panel
// render of a log line.
const SECRET_PATTERNS: RegExp[] = [
  /github_pat_\w+/g,
  /gh[opsru]_[A-Za-z0-9]+/g,
  /\bBearer\s+[\w.~+/-]+={0,2}/gi,
  /\bsk-[A-Za-z0-9_-]{8,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]+\b/g,
];

function sanitizeLogLine(line: string): string {
  let out = line;
  for (const re of SECRET_PATTERNS) {
    out = out.replace(re, REDACTED);
  }
  if (out.length > MAX_LOG_LINE_CHARS) {
    out = out.slice(0, MAX_LOG_LINE_CHARS) + "…[truncated]";
  }
  return out;
}

function isStoredLogEntry(value: unknown): value is StoredLogEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.at === "string" && typeof entry.line === "string";
}

// Keeps only readable, fresh entries; legacy string entries and entries older
// than the retention window are dropped.
function pruneStoredLogs(raw: unknown[]): StoredLogEntry[] {
  const cutoff = Date.now() - LOG_RETENTION_MS;
  const kept: StoredLogEntry[] = [];
  for (const value of raw) {
    if (!isStoredLogEntry(value)) continue;
    const at = Date.parse(value.at);
    if (!Number.isFinite(at) || at < cutoff) continue;
    kept.push(value);
  }
  return kept;
}

function formatArg(arg: unknown): string {
  if (typeof arg === "string") return arg;
  if (typeof arg === "number" || typeof arg === "boolean" || typeof arg === "bigint") return String(arg);
  try {
    return JSON.stringify(arg);
  } catch {
    return typeof arg;
  }
}

// Version comes from the extension manifest at runtime; unit-test stubs of
// `chrome` may lack getManifest, so fall back to a bare prefix.
function logPrefix(): string {
  try {
    const version = chrome.runtime.getManifest().version;
    if (typeof version === "string" && version.length > 0) {
      return "[PR Generator v" + version + "]";
    }
  } catch {
    /* stubbed chrome has no getManifest */
  }
  return "[PR Generator]";
}

export function log(level: LogLevel, ...args: unknown[]): void {
  const prefix = logPrefix();
  const msg = sanitizeLogLine(prefix + " " + args.map(formatArg).join(" "));
  if (level === "error") console.error(msg);
  else if (level === "warn") console.warn(msg);
  else console.log(msg);
  appendLogPanel(level, msg);
  // Only warn/error lines persist; info lines stay in console + session panel.
  if (level !== "info") saveLogToStorage(msg);
}

function appendLogPanel(level: LogLevel, msg: string): void {
  const panel = document.getElementById(LOG_PANEL_ID);
  if (!panel) return;
  const line = document.createElement("div");
  line.className = "ai-log-line ai-log-" + level;
  line.textContent = new Date().toLocaleTimeString() + " | " + msg;
  panel.appendChild(line);
  const lines = panel.querySelectorAll(":scope > .ai-log-line");
  for (let i = 0; i < lines.length - MAX_LOG_PANEL_LINES; i++) {
    lines[i]?.remove();
  }
  panel.scrollTop = panel.scrollHeight;
}

function createLogPanel(): void {
  if (document.getElementById(LOG_PANEL_ID)) return;
  const panel = document.createElement("div");
  panel.id = LOG_PANEL_ID;
  panel.className = "ai-pr-generator-log-panel";
  const header = document.createElement("div");
  header.className = "ai-log-header";
  header.innerHTML =
    '<span>PR Generator Logs</span><button class="ai-log-close" title="Close">&times;</button><button class="ai-log-copy" title="Copy all logs">Copy</button><button class="ai-log-clear" title="Clear logs">Clear</button>';
  panel.appendChild(header);
  const body = document.createElement("div");
  body.className = "ai-log-body";
  panel.appendChild(body);
  document.body.appendChild(panel);
  header.querySelector(".ai-log-close")?.addEventListener("click", () => {
    // Close must hide even when a footer button exists — not a toggle.
    panel.style.display = "none";
  });
  header.querySelector(".ai-log-copy")?.addEventListener("click", () => {
    copyLogsToClipboard(body);
  });
  header.querySelector(".ai-log-clear")?.addEventListener("click", () => {
    body.innerHTML = "";
    void chrome.storage.local.remove(LOG_KEY);
  });
  const oldBody = panel.querySelector(".ai-log-body");
  loadSavedLogs(oldBody ?? body);
}

function copyLogsToClipboard(body: Element): void {
  const lines = body.querySelectorAll(".ai-log-line");
  const text = [...lines].map((line) => line.textContent).join("\n");
  const onCopied = (): void => {
    log("info", "Logs copied to clipboard!");
  };
  void navigator.clipboard.writeText(text).then(onCopied, () => {
    log("warn", "Clipboard copy failed (permission denied or no focus)");
  });
}

function loadSavedLogs(bodyEl: Element): void {
  chrome.storage.local.get<LogStorage>(LOG_KEY, (result) => {
    if (chrome.runtime.lastError) return;
    const saved = result[LOG_KEY] ?? [];
    const fresh = pruneStoredLogs(saved);
    // Shrink storage back down when pruning dropped legacy/stale entries.
    if (fresh.length < saved.length) {
      void chrome.storage.local.set({ [LOG_KEY]: fresh });
    }
    for (const entry of fresh) {
      const line = document.createElement("div");
      line.className = "ai-log-line ai-log-info";
      line.textContent = entry.line;
      bodyEl.appendChild(line);
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  });
}

// Logs are buffered in memory and flushed as one batched read-modify-write —
// a steady logger (e.g. the 1s page detector) must not translate into a
// storage write per entry.
const LOG_FLUSH_DELAY_MS = 2000;
let pendingLogs: StoredLogEntry[] = [];
let logFlushTimer: ReturnType<typeof setTimeout> | null = null;
let logWriteChain: Promise<void> = Promise.resolve();

function appendLogsToStorage(entries: StoredLogEntry[]): Promise<void> {
  return new Promise((resolve) => {
    // lastError paths (quota exceeded, context invalidated) must still settle —
    // otherwise logWriteChain wedges and every later flush starves forever.
    let settled = false;
    const finish = (err?: string): void => {
      if (settled) return;
      settled = true;
      // console directly: log() would re-enter this same write path.
      if (err !== undefined) console.warn("[PR Generator] log storage write dropped: " + err);
      resolve();
    };
    try {
      chrome.storage.local.get<LogStorage>(LOG_KEY, (result) => {
        const readErr = chrome.runtime.lastError;
        if (readErr) {
          finish(readErr.message);
          return;
        }
        const logs = pruneStoredLogs(result[LOG_KEY] ?? []);
        logs.push(...entries);
        const trimmed = logs.length > 200 ? logs.slice(-200) : logs;
        chrome.storage.local.set({ [LOG_KEY]: trimmed }, () => {
          finish(chrome.runtime.lastError?.message);
        });
      });
    } catch (e) {
      finish(e instanceof Error ? e.message : String(e));
    }
  });
}

function flushLogsToStorage(): void {
  if (logFlushTimer) {
    clearTimeout(logFlushTimer);
    logFlushTimer = null;
  }
  if (pendingLogs.length === 0) return;
  const entries = pendingLogs;
  pendingLogs = [];
  const write = (): Promise<void> => appendLogsToStorage(entries);
  // onRejected continuation too: even if an earlier link somehow rejects, this
  // flush still runs and the chain returns to a settled-resolved state.
  logWriteChain = logWriteChain.then(write, write);
}

function saveLogToStorage(msg: string): void {
  pendingLogs.push({
    at: new Date().toISOString(),
    line: new Date().toLocaleTimeString() + " | " + msg,
  });
  if (logFlushTimer) return;
  logFlushTimer = setTimeout(flushLogsToStorage, LOG_FLUSH_DELAY_MS);
}

// Don't lose buffered entries when the tab closes or goes to the background.
// Guarded so Bun-side unit tests can import this module without a DOM.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushLogsToStorage);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushLogsToStorage();
  });
}

export function injectLogToggleButton(): void {
  if (document.getElementById("ai-pr-log-toggle-btn")) return;
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "ai-pr-log-toggle-btn";
  toggleBtn.textContent = "📋 PR Gen Logs";
  toggleBtn.style.cssText =
    "position:fixed;bottom:10px;right:24px;z-index:2147483647;padding:8px 12px;font-size:12px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;cursor:pointer;";
  toggleBtn.addEventListener("click", () => {
    createLogPanel();
    const panel = document.getElementById(LOG_PANEL_ID);
    if (panel) {
      panel.style.display = panel.style.display === "none" ? "flex" : "none";
    }
  });
  document.body.appendChild(toggleBtn);
  createLogPanel();
  const panel = document.getElementById(LOG_PANEL_ID);
  if (panel) panel.style.display = "none";
}
