/** In-page log panel + persistent log storage (chrome.storage.local). */

const LOG_PANEL_ID = "ai-pr-generator-log-panel";
const LOG_KEY = "ai_pr_gen_logs";

type LogLevel = "info" | "warn" | "error";

interface LogStorage {
  ai_pr_gen_logs?: string[];
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

export function log(level: LogLevel, ...args: unknown[]): void {
  const prefix = "[PR Generator v1.5]";
  const msg = prefix + " " + args.map(formatArg).join(" ");
  if (level === "error") console.error(msg);
  else if (level === "warn") console.warn(msg);
  else console.log(msg);
  appendLogPanel(level, msg);
  saveLogToStorage(msg);
}

function appendLogPanel(level: LogLevel, msg: string): void {
  const panel = document.getElementById(LOG_PANEL_ID);
  if (!panel) return;
  const line = document.createElement("div");
  line.className = "ai-log-line ai-log-" + level;
  line.textContent = new Date().toLocaleTimeString() + " | " + msg;
  panel.appendChild(line);
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
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
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
  void navigator.clipboard.writeText(text).then(onCopied);
}

function loadSavedLogs(bodyEl: Element): void {
  chrome.storage.local.get<LogStorage>(LOG_KEY, (result) => {
    const saved = result[LOG_KEY] ?? [];
    for (const msg of saved) {
      const line = document.createElement("div");
      line.className = "ai-log-line ai-log-info";
      line.textContent = msg;
      bodyEl.appendChild(line);
    }
    bodyEl.scrollTop = bodyEl.scrollHeight;
  });
}

function saveLogToStorage(msg: string): void {
  chrome.storage.local.get<LogStorage>(LOG_KEY, (result) => {
    const logs = result[LOG_KEY] ?? [];
    const ts = new Date().toLocaleTimeString() + " | " + msg;
    logs.push(ts);
    const trimmed = logs.length > 200 ? logs.slice(-200) : logs;
    const obj: LogStorage = { [LOG_KEY]: trimmed };
    void chrome.storage.local.set(obj);
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
