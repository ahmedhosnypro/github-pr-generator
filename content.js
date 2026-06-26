(function () {
  "use strict";

  var LOG_PANEL_ID = "ai-pr-generator-log-panel";
  var LOG_KEY = "ai_pr_gen_logs";

  function log(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    var prefix = "[PR Generator v1.1]";
    var msg = prefix + " " + args.map(function (a) {
      try { return typeof a === "object" ? JSON.stringify(a) : String(a); }
      catch (e) { return String(a); }
    }).join(" ");
    if (level === "error") console.error(msg);
    else if (level === "warn") console.warn(msg);
    else console.log(msg);
    appendLogPanel(level, msg);
    saveLogToStorage(msg);
  }

  function appendLogPanel(level, msg) {
    var panel = document.getElementById(LOG_PANEL_ID);
    if (!panel) return;
    var line = document.createElement("div");
    line.className = "ai-log-line ai-log-" + level;
    line.textContent = new Date().toLocaleTimeString() + " | " + msg;
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
  }

  function createLogPanel() {
    if (document.getElementById(LOG_PANEL_ID)) return;
    var panel = document.createElement("div");
    panel.id = LOG_PANEL_ID;
    panel.className = "ai-pr-generator-log-panel";
    var header = document.createElement("div");
    header.className = "ai-log-header";
    header.innerHTML = '<span>PR Generator Logs</span><button class="ai-log-close" title="Close">&times;</button><button class="ai-log-copy" title="Copy all logs">Copy</button><button class="ai-log-clear" title="Clear logs">Clear</button>';
    panel.appendChild(header);
    var body = document.createElement("div");
    body.className = "ai-log-body";
    panel.appendChild(body);
    document.body.appendChild(panel);
    header.querySelector(".ai-log-close").addEventListener("click", function () {
      panel.style.display = panel.style.display === "none" ? "flex" : "none";
    });
    header.querySelector(".ai-log-copy").addEventListener("click", function () {
      var lines = body.querySelectorAll(".ai-log-line");
      var text = Array.from(lines).map(function (l) { return l.textContent; }).join("\n");
      navigator.clipboard.writeText(text).then(function () {
        log("info", "Logs copied to clipboard!");
      });
    });
    header.querySelector(".ai-log-clear").addEventListener("click", function () {
      body.innerHTML = "";
      chrome.storage.local.remove(LOG_KEY);
    });
    var oldBody = panel.querySelector(".ai-log-body");
    loadSavedLogs(oldBody || body);
  }

  function loadSavedLogs(bodyEl) {
    chrome.storage.local.get(LOG_KEY, function (result) {
      var saved = result[LOG_KEY] || [];
      saved.forEach(function (msg) {
        var line = document.createElement("div");
        line.className = "ai-log-line ai-log-info";
        line.textContent = msg;
        bodyEl.appendChild(line);
      });
      bodyEl.scrollTop = bodyEl.scrollHeight;
    });
  }

  function saveLogToStorage(msg) {
    chrome.storage.local.get(LOG_KEY, function (result) {
      var logs = result[LOG_KEY] || [];
      var ts = new Date().toLocaleTimeString() + " | " + msg;
      logs.push(ts);
      if (logs.length > 200) logs = logs.slice(-200);
      var obj = {};
      obj[LOG_KEY] = logs;
      chrome.storage.local.set(obj);
    });
  }

  var BTN_ID = "ai-pr-generate-btn-title";
  var BTN_DESC_ID = "ai-pr-generate-btn-desc";

  function isPRCreationPage() {
    const url = window.location.href;
    const hasTitle = !!document.querySelector('input[name="pull_request[title]"]');
    const hasBody = !!document.querySelector("textarea#pull_request_body");
    const result = url.includes("github.com") && (url.includes("/compare/") || url.includes("/pull/")) && hasTitle && hasBody;
    log("info", "isPRCreationPage check - URL: " + url + ", hasTitle: " + hasTitle + ", hasBody: " + hasBody + ", result: " + result);
    return result;
  }

  function extractCommitsFromEmbeddedJSON() {
    const partial = document.querySelector(
      'react-partial[partial-name="copilot-generate-pull-title"]'
    );
    if (!partial) return null;

    const scriptTag = partial.querySelector(
      'script[type="application/json"][data-target="react-partial.embeddedData"]'
    );
    if (!scriptTag) return null;

    try {
      const data = JSON.parse(scriptTag.textContent);
      if (data.props && data.props.commits) {
        log("info", "Extracted " + data.props.commits.length + " commits from embedded JSON");
        return data.props.commits;
      }
    } catch (e) {
      log("warn", "Failed to parse embedded commits JSON: " + e.message);
    }
    log("info", "No embedded commits JSON found");
    return null;
  }

  function extractCommitsFromDOM() {
    const items = document.querySelectorAll(".js-commits-list-item");
    log("info", "Found " + items.length + " commits in DOM");
    const commits = [];

    items.forEach((item) => {
      const titleLink = item.querySelector(".markdown-title");
      const message = titleLink ? titleLink.textContent.trim() : "";

      const bodyEl = item.querySelector("pre.text-small");
      let body = "";
      if (bodyEl) {
        body = bodyEl.textContent.trim();
      }

      const fullMessage = body ? message + "\n\n" + body : message;

      if (message) {
        commits.push({ oid: "", message: fullMessage });
      }
    });

    return commits;
  }

  function extractCommits() {
    const embedded = extractCommitsFromEmbeddedJSON();
    if (embedded && embedded.length > 0) return embedded;
    return extractCommitsFromDOM();
  }

  function extractFileChanges() {
    const files = [];
    const tocItems = document.querySelectorAll("#toc ol.content li");

    tocItems.forEach((li) => {
      const link = li.querySelector('a[href^="#diff-"]');
      if (!link) return;
      const path = link.textContent.trim();

      const added = li.querySelector(".octicon-diff-added");
      const modified = li.querySelector(".octicon-diff-modified");
      const removed = li.querySelector(".octicon-diff-removed");
      const renamed = li.querySelector(".octicon-diff-renamed");

      let type = "modified";
      if (added) type = "added";
      else if (removed) type = "removed";
      else if (renamed) type = "renamed";

      const successEl = li.querySelector(".color-fg-success");
      const dangerEl = li.querySelector(".color-fg-danger");

      const additions = successEl
        ? parseInt(successEl.textContent.replace("+", "").trim(), 10) || 0
        : 0;
      const deletions = dangerEl
        ? parseInt(
            dangerEl
              .textContent
              .replace("\u2212", "")
              .replace("-", "")
              .trim(),
            10
          ) || 0
        : 0;

      files.push({ path, type, additions, deletions });
    });

    return files;
  }

  function extractStats() {
    const statsEl = document.querySelector(".toc-diff-stats");
    if (!statsEl) return null;

    const text = statsEl.textContent;
    const filesMatch = text.match(/(\d[\d,]*)\s+changed\s+file/i);
    const addMatch = text.match(/([\d,]+)\s+addition/i);
    const delMatch = text.match(/([\d,]+)\s+deletion/i);

    return {
      files: filesMatch ? parseInt(filesMatch[1].replace(/,/g, ""), 10) : 0,
      additions: addMatch
        ? parseInt(addMatch[1].replace(/,/g, ""), 10)
        : 0,
      deletions: delMatch
        ? parseInt(delMatch[1].replace(/,/g, ""), 10)
        : 0,
    };
  }

  function setReactValue(element, value) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    );
    const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    );

    if (element.tagName === "INPUT" && nativeInputValueSetter && nativeInputValueSetter.set) {
      nativeInputValueSetter.set.call(element, value);
    } else if (element.tagName === "TEXTAREA" && nativeTextareaValueSetter && nativeTextareaValueSetter.set) {
      nativeTextareaValueSetter.set.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fillPRFields(title, description) {
    log("info", "fillPRFields called - title: " + title + ", description length: " + (description ? description.length : 0));
    const titleInput = document.querySelector(
      'input[name="pull_request[title]"]'
    );
    const bodyTextarea = document.querySelector("textarea#pull_request_body");

    if (titleInput) {
      setReactValue(titleInput, title);
      titleInput.focus();
      titleInput.blur();
      log("info", "Title input filled");
    } else {
      log("error", "Title input not found!");
    }

    if (bodyTextarea) {
      setReactValue(bodyTextarea, description);
      bodyTextarea.dispatchEvent(new Event("change", { bubbles: true }));
      log("info", "Description textarea filled");

      const writeTab = document.querySelector(
        'button.write-tab.js-write-tab:not([aria-selected="true"])'
      );
      if (writeTab) {
        writeTab.click();
      }
    } else {
      log("error", "Description textarea not found!");
    }
  }

  function createButton(id, label, onClick) {
    const btn = document.createElement("button");
    btn.id = id;
    btn.type = "button";
    btn.className = "ai-generate-btn";
    var gid = "aigrad-" + id;
    var svg =
      '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align: text-bottom; margin-right: 4px;">' +
      '<defs><linearGradient id="' + gid + '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2da44e"/><stop offset="100%" stop-color="#0969da"/></linearGradient></defs>' +
      '<rect x="1" y="1" width="14" height="14" rx="3" fill="url(#' + gid + ')"/>' +
      '<g stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none">' +
      '<line x1="5" y1="12" x2="5" y2="7.5"/><line x1="11" y1="12" x2="11" y2="9.5"/><line x1="5" y1="9" x2="11" y2="9"/>' +
      '<circle cx="5" cy="5.5" r="1.3" fill="#fff" stroke="none"/>' +
      '<circle cx="11" cy="12" r="1.3" fill="#fff" stroke="none"/>' +
      '<circle cx="5" cy="12" r="1.3" fill="#fff" stroke="none"/>' +
      '</g>' +
      '<path d="M13 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fff"/>' +
      "</svg>";
    btn.innerHTML = svg + label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function showToast(message, isError) {
    var existing = document.getElementById("ai-pr-generator-toast");
    if (existing) existing.remove();

    var toast = document.createElement("div");
    toast.id = "ai-pr-generator-toast";
    toast.className = "ai-pr-generator-toast" + (isError ? " ai-pr-generator-toast--error" : "");
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.classList.add("ai-pr-generator-toast--visible");
    }, 10);
    setTimeout(function () {
      toast.classList.remove("ai-pr-generator-toast--visible");
      setTimeout(function () {
        toast.remove();
      }, 300);
    }, 4000);
  }

  function setButtonLoading(btn, loading) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalHtml = btn.innerHTML;
      var spinnerSvg =
        '<svg class="ai-generate-spinner" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px; animation: ai-spin 0.8s linear infinite;">' +
        '<path d="M8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V0z"/>' +
        "</svg>";
      btn.innerHTML = spinnerSvg + "Generating...";
      btn.classList.add("ai-generate-btn--loading");
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
      btn.classList.remove("ai-generate-btn--loading");
    }
  }

  async function handleGenerate() {
    var titleBtn = document.getElementById(BTN_ID);
    var descBtn = document.getElementById(BTN_DESC_ID);
    var activeBtn = titleBtn || descBtn;
    log("info", "handleGenerate called - titleBtn: " + !!titleBtn + ", descBtn: " + !!descBtn);
    if (!activeBtn) { log("error", "No active button found"); return; }
    if (activeBtn.disabled) { log("warn", "Button is disabled"); return; }

    setButtonLoading(activeBtn, true);
    if (descBtn && descBtn !== activeBtn) setButtonLoading(descBtn, true);

    try {
      var commits = extractCommits();
      var fileChanges = extractFileChanges();
      var stats = extractStats();
      log("info", "Extracted - commits: " + commits.length + ", files: " + fileChanges.length + ", stats: " + JSON.stringify(stats));

      if (commits.length === 0 && fileChanges.length === 0) {
        log("error", "No commits or file changes found");
        showToast("No commits or file changes found on this page.", true);
        return;
      }

      log("info", "Sending message to background script...");
      var response = await chrome.runtime.sendMessage({
        type: "generate",
        data: {
          commits: commits.map(function (c) {
            return { message: c.message };
          }),
          fileChanges: fileChanges,
          stats: stats,
        },
      });
      log("info", "Response from background: " + JSON.stringify(response));

      if (response.error) {
        log("error", "Error from background: " + response.error);
        log("error", "Full response object: " + response.error);
        showToast("Error: " + response.error, true);
        return;
      }

      fillPRFields(response.title, response.description);
      log("info", "PR fields filled successfully - title: " + response.title);
      showToast("PR title and description generated!");
    } catch (err) {
      log("error", "Error in handleGenerate: " + err.message + " | Stack: " + err.stack);
      showToast("Error: " + err.message, true);
    } finally {
      setButtonLoading(activeBtn, false);
      if (descBtn && descBtn !== activeBtn) setButtonLoading(descBtn, false);
    }
  }

  function injectTitleButton() {
    if (document.getElementById(BTN_ID)) return;

    var titleInput = document.querySelector(
      'input[name="pull_request[title]"]'
    );
    if (!titleInput) { log("warn", "Title input not found for button injection"); return; }

    var wrapper = titleInput.closest('[data-component="TextInput"]');
    if (!wrapper) { log("warn", "TextInput wrapper not found"); return; }

    var actionArea = wrapper.querySelector(
      '[data-component="TextInput.Action"]'
    );
    if (!actionArea) { log("warn", "TextInput.Action area not found"); return; }

    var btn = createButton(BTN_ID, "AI Generate", handleGenerate);
    btn.classList.add("ai-generate-btn--title");
    actionArea.appendChild(btn);
    log("info", "Title button injected");
  }

  function injectDescButton() {
    if (document.getElementById(BTN_DESC_ID)) return;

    var toolbar = document.querySelector(
      'markdown-toolbar[for="pull_request_body"]'
    );
    if (!toolbar) { log("warn", "Description toolbar not found"); return; }

    var actionBar = toolbar.querySelector(".ActionBar");
    if (!actionBar) { log("warn", "ActionBar not found in toolbar"); return; }

    var btn = createButton(BTN_DESC_ID, "AI Generate", handleGenerate);
    btn.classList.add("ai-generate-btn--desc");

    var firstItem = actionBar.querySelector(
      '[data-targets="action-bar.items"]'
    );
    if (firstItem && firstItem.parentNode) {
      firstItem.parentNode.insertBefore(btn, firstItem);
    } else {
      actionBar.prepend(btn);
    }
    log("info", "Description button injected");
  }

  function injectButtons() {
    injectTitleButton();
    injectDescButton();
    injectLogToggleButton();
  }

  function injectLogToggleButton() {
    if (document.getElementById("ai-pr-log-toggle-btn")) return;
    var toggleBtn = document.createElement("button");
    toggleBtn.id = "ai-pr-log-toggle-btn";
    toggleBtn.textContent = "📋 PR Gen Logs";
    toggleBtn.style.cssText = "position:fixed;bottom:10px;right:24px;z-index:2147483647;padding:8px 12px;font-size:12px;background:#21262d;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;cursor:pointer;";
    toggleBtn.addEventListener("click", function () {
      createLogPanel();
      var panel = document.getElementById(LOG_PANEL_ID);
      if (panel) {
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
      }
    });
    document.body.appendChild(toggleBtn);
    createLogPanel();
    var panel = document.getElementById(LOG_PANEL_ID);
    if (panel) panel.style.display = "none";
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (
        mutation.type === "childList" &&
        mutation.addedNodes.length > 0
      ) {
        for (var j = 0; j < mutation.addedNodes.length; j++) {
          var node = mutation.addedNodes[j];
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (
              node.querySelector(
                'input[name="pull_request[title]"]'
              ) ||
              node.querySelector("textarea#pull_request_body") ||
              node.matches('input[name="pull_request[title]"]') ||
              node.matches("textarea#pull_request_body")
            ) {
              injectButtons();
              return;
            }
          }
        }
      }
    }
  });

  var turbListener = function () {
    setTimeout(function () {
      if (isPRCreationPage()) {
        injectButtons();
      }
    }, 1000);
  };

  document.addEventListener("turbo:load", turbListener);
  document.addEventListener("turbo:render", turbListener);
  document.addEventListener("pjax:end", turbListener);

  function init() {
    log("info", "init called on URL: " + window.location.href);
    if (!isPRCreationPage()) {
      log("info", "Not a PR creation page, skipping");
      return;
    }
    log("info", "PR creation page detected, injecting buttons...");
    injectButtons();
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
    log("info", "MutationObserver started");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500);
  }
})();
