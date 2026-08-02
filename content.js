(function () {
  "use strict";

  var LOG_PANEL_ID = "ai-pr-generator-log-panel";
  var LOG_KEY = "ai_pr_gen_logs";

  function log(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    var prefix = "[PR Generator v1.5]";
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

  // Wraps chrome.runtime.sendMessage with two safeguards required for MV3
  // service workers:
  //   1. Keepalive pings: Chrome terminates an idle service worker (~30s).
  //      A long-running API call (large PR, streaming aggregation) can exceed
  //      that window, killing the message port and surfacing "A listener
  //      indicated an asynchronous response by returning true, but the message
  //      channel closed before a response was received". Pinging the SW every
  //      25s resets its idle timer and keeps the channel open.
  //   2. One retry: if the channel still drops (SW was already gone), the call
  //      is retried once — the second attempt wakes a fresh SW.
  function sendToBackground(message) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var pingTimer = null;

      function clearPing() {
        if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
      }

      function attempt(remaining) {
        if (done) return;
        try {
          chrome.runtime.sendMessage(message, function (resp) {
            clearPing();
            if (done) return;
            var err = chrome.runtime.lastError;
            var channelClosed = false;
            if (err && /message channel closed|Receiving end does not exist/i.test(err.message)) {
              channelClosed = true;
            }
            // chrome.runtime.lastError may be set even when the SW actually
            // responded with { error: ... } (background rejected). Distinguish
            // by checking resp: if we have an object, the messaging succeeded
            // and lastError is just informational.
            if (resp !== undefined && resp !== null) {
              done = true;
              resolve(resp);
              return;
            }
            if (channelClosed && remaining > 0) {
              log("warn", "sendToBackground channel closed; retrying once (" + (message.type || "?") + ")");
              setTimeout(function () { attempt(remaining - 1); }, 250);
              return;
            }
            done = true;
            reject(err ? new Error(err.message) : new Error("No response from background"));
          });
        } catch (e) {
          clearPing();
          if (done) return;
          if (/Receiving end does not exist|message channel closed/i.test(e.message) && remaining > 0) {
            log("warn", "sendToBackground threw (" + e.message + "); retrying once");
            setTimeout(function () { attempt(remaining - 1); }, 250);
            return;
          }
          done = true;
          reject(e);
        }
      }

      // Ping every 25s while outstanding to reset the SW idle timer.
      pingTimer = setInterval(function () {
        if (done) { clearPing(); return; }
        try {
          chrome.runtime.sendMessage({ type: "__keepalive_ping__" }, function () {
            // Swallow ping errors; the real call's callback handles failures.
            void chrome.runtime.lastError;
          });
        } catch (e) { /* ignore */ }
      }, 25000);

      attempt(1);
    });
  }

  var BTN_ID = "ai-pr-generate-btn-title";
  var BTN_DESC_ID = "ai-pr-generate-btn-desc";
  var BTN_OPENED_TITLE_ID = "ai-pr-generate-btn-opened-title";
  var BTN_OPENED_DESC_ID = "ai-pr-generate-btn-opened-desc";
  var BTN_MERGE_TITLE_ID = "ai-pr-generate-btn-merge-title";
  var BTN_MERGE_DESC_ID = "ai-pr-generate-btn-merge-desc";

  function isPRCreationPage() {
    const url = window.location.href;
    const hasTitle = !!document.querySelector('input[name="pull_request[title]"]');
    const hasBody = !!document.querySelector("textarea#pull_request_body");
    const result = url.includes("github.com") && (url.includes("/compare/") || url.includes("/pull/")) && hasTitle && hasBody;
    log("info", "isPRCreationPage check - URL: " + url + ", hasTitle: " + hasTitle + ", hasBody: " + hasBody + ", result: " + result);
    return result;
  }

  function isPROpenedPage() {
    var url = window.location.href;
    if (!url.includes("github.com")) return false;
    if (url.includes("/compare/") || /\/pull\/\d+\/edit/.test(url)) return false;
    var prMatch = url.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (!prMatch) return false;
    var pathParts = window.location.pathname.split("/").filter(function (p) { return p.length > 0; });
    if (pathParts.length > 4) return false;
    var hasTitle = !!document.querySelector('[data-component="PH_Title"] span.markdown-title');
    var hasDesc = !!document.querySelector("div.js-comment-body");
    log("info", "isPROpenedPage check - URL: " + url + ", hasTitle: " + hasTitle + ", hasDesc: " + hasDesc);
    return hasTitle;
  }

  function isMergeConfirmationPage() {
    var url = window.location.href;
    if (!url.includes("github.com")) return false;
    var prMatch = url.match(/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/);
    if (!prMatch) return false;

    // GitHub's merge dialog uses React components with auto-generated IDs
    // Look for the confirm merge container or the input/textarea patterns
    var hasConfirmMerge = !!document.querySelector('[class*="ConfirmMerge"]');
    var hasMergeInput = !!document.querySelector('input[data-component="input"][type="text"][value*="Merge pull request"]');
    var hasMergeTextarea = !!document.querySelector('.prc-Textarea-TextArea-snlco, textarea[placeholder*="extended description"]');
    var result = hasConfirmMerge || (hasMergeInput && hasMergeTextarea);
    log("info", "isMergeConfirmationPage check - URL: " + url + ", hasConfirmMerge: " + hasConfirmMerge + ", hasMergeInput: " + hasMergeInput + ", hasMergeTextarea: " + hasMergeTextarea + ", result: " + result);
    return result;
  }

  function findMergeTitleInput() {
    // The ConfirmMerge container is a sibling of the title/desc FormControls.
    // If it exists on the page, scan the parent wrapper for the merge title input.
    var confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
    if (confirmContainer) {
      var parentWrapper = confirmContainer.parentElement;
      if (parentWrapper) {
        var input = parentWrapper.querySelector('input[data-component="input"][type="text"]');
        if (input) {
          log("info", "findMergeTitleInput - found near ConfirmMerge container");
          return input;
        }
      }
    }

    // Fallback: look for input with value starting with "Merge pull request"
    var allInputs = document.querySelectorAll('input[type="text"][data-component="input"]');
    for (var i = 0; i < allInputs.length; i++) {
      var val = allInputs[i].value || "";
      if (val.indexOf("Merge pull request") === 0) {
        log("info", "findMergeTitleInput - found by value pattern");
        return allInputs[i];
      }
    }

    // Legacy fallback: old GitHub DOM
    var legacy = document.querySelector('input#merge_title_field, input[name="merge_title_field"]');
    if (legacy) {
      log("info", "findMergeTitleInput - found legacy selector");
      return legacy;
    }

    log("warn", "findMergeTitleInput - not found");
    return null;
  }

  function findMergeDescTextarea() {
    // Primary: textarea with "extended description" placeholder near ConfirmMerge container
    var confirmContainer = document.querySelector('[class*="ConfirmMerge"]');
    if (confirmContainer) {
      var parentWrapper = confirmContainer.parentElement;
      if (parentWrapper) {
        var textarea = parentWrapper.querySelector('.prc-Textarea-TextArea-snlco, textarea[placeholder*="extended description"]');
        if (textarea) {
          log("info", "findMergeDescTextarea - found near ConfirmMerge container");
          return textarea;
        }
      }
    }

    // Fallback: any textarea with "extended description" placeholder
    var allTextareas = document.querySelectorAll('textarea[placeholder*="extended description"]');
    if (allTextareas.length > 0) {
      log("info", "findMergeDescTextarea - found by placeholder");
      return allTextareas[0];
    }

    // Fallback: prc-Textarea class
    var prcTextarea = document.querySelector('.prc-Textarea-TextArea-snlco');
    if (prcTextarea) {
      log("info", "findMergeDescTextarea - found by prc class");
      return prcTextarea;
    }

    // Legacy fallback
    var legacy = document.querySelector('textarea#merge_message_field, textarea[name="merge_message_field"]');
    if (legacy) {
      log("info", "findMergeDescTextarea - found legacy selector");
      return legacy;
    }

    log("warn", "findMergeDescTextarea - not found");
    return null;
  }

  function extractExistingMergeTitle() {
    var input = findMergeTitleInput();
    var val = input ? (input.value || "") : "";
    log("info", "extractExistingMergeTitle - " + val);
    return val;
  }

  function extractExistingMergeDescription() {
    var textarea = findMergeDescTextarea();
    var val = textarea ? (textarea.value || "") : "";
    log("info", "extractExistingMergeDescription - length: " + val.length);
    return val;
  }

  function fillMergeFields(title, description) {
    log("info", "fillMergeFields called - title: " + title + ", description length: " + (description ? description.length : 0));
    var titleInput = findMergeTitleInput();
    var descTextarea = findMergeDescTextarea();

    if (titleInput && title) {
      setReactValue(titleInput, title);
      titleInput.focus();
      titleInput.blur();
      log("info", "Merge title input filled");
    } else if (!titleInput && title) {
      log("error", "Merge title input not found!");
    }

    if (descTextarea && description) {
      setReactValue(descTextarea, description);
      descTextarea.dispatchEvent(new Event("change", { bubbles: true }));
      log("info", "Merge description textarea filled");
    } else if (!descTextarea && description) {
      log("error", "Merge description textarea not found!");
    }
  }

  function extractOwnerRepoPRNumber() {
    var pathParts = window.location.pathname.split("/").filter(function (p) { return p.length > 0; });
    return {
      owner: pathParts[0] || "",
      repo: pathParts[1] || "",
      prNumber: pathParts[3] || ""
    };
  }

  function extractExistingOpenedTitle() {
    var titleEls = document.querySelectorAll('[data-component="PH_Title"] span.markdown-title');
    for (var i = 0; i < titleEls.length; i++) {
      var el = titleEls[i];
      if (el.closest("h1")) {
        var val = el.textContent.trim();
        log("info", "extractExistingOpenedTitle - " + val);
        return val;
      }
    }
    var fallback = titleEls.length > 0 ? titleEls[0].textContent.trim() : "";
    log("info", "extractExistingOpenedTitle (fallback) - " + fallback);
    return fallback;
  }

  function extractExistingOpenedDescription() {
    var bodyEl = document.querySelector("div.js-command-palette-pull-body .js-comment-body");
    if (!bodyEl) bodyEl = document.querySelector("div.js-comment-body");
    var val = bodyEl ? bodyEl.innerText || "" : "";
    log("info", "extractExistingOpenedDescription - length: " + val.length);
    return val;
  }

  function extractCommitsFromEmbeddedJSON() {
    const partial = document.querySelector(
      'react-partial[partial-name="copilot-generate-pull-title"]'
    );
    if (!partial) {
      log("info", "extractCommitsFromEmbeddedJSON - no copilot-generate-pull-title partial found");
      return null;
    }

    const scriptTag = partial.querySelector(
      'script[type="application/json"][data-target="react-partial.embeddedData"]'
    );
    if (!scriptTag) {
      log("info", "extractCommitsFromEmbeddedJSON - no embeddedData script tag found");
      return null;
    }

    try {
      const data = JSON.parse(scriptTag.textContent);
      if (data.props && data.props.commits) {
        log("info", "Extracted " + data.props.commits.length + " commits from embedded JSON");
        return data.props.commits;
      }
      log("info", "extractCommitsFromEmbeddedJSON - no commits in embedded data props");
    } catch (e) {
      log("warn", "Failed to parse embedded commits JSON: " + e.message);
    }
    log("info", "No embedded commits JSON found");
    return null;
  }

  function extractCommitsFromDOM() {
    const items = document.querySelectorAll(".js-commits-list-item");
    log("info", "Found " + items.length + " commits in DOM (.js-commits-list-item)");
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

    log("info", "extractCommitsFromDOM - extracted " + commits.length + " commits with messages");
    return commits;
  }

  function extractCommits() {
    const embedded = extractCommitsFromEmbeddedJSON();
    if (embedded && embedded.length > 0) {
      log("info", "extractCommits - using embedded JSON (" + embedded.length + " commits)");
      return embedded;
    }
    log("info", "extractCommits - falling back to DOM extraction");
    return extractCommitsFromDOM();
  }

  function extractFileChanges() {
    const files = [];
    const tocItems = document.querySelectorAll("#toc ol.content li");

    tocItems.forEach((li) => {
      const link = li.querySelector('a[href^="#diff-"]');
      if (!link) return;
        const path = link.textContent.trim();
        const diffAnchor = link.getAttribute("href") || "";
        
        // Validate anchor format: must be GitHub diff hash (e.g., #diff-abc123...)
        var validDiffAnchor = /^#diff-[a-zA-Z0-9_-]{40,}$/.test(diffAnchor) ? diffAnchor : "";
        if (diffAnchor && !validDiffAnchor) {
          log("warn", "extractFileChanges - invalid diff anchor dropped: " + diffAnchor);
        }

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

        files.push({ path, type, additions, deletions, diffAnchor: validDiffAnchor });
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

  function extractBranchContext() {
    var url = window.location.href;
    var pathParts = window.location.pathname.split("/").filter(function (p) { return p.length > 0; });
    var owner = pathParts[0] || "";
    var repo = pathParts[1] || "";
    var baseBranch = "";
    var headBranch = "";

    var baseSelect = document.querySelector('select[name="pull_request[base]"]');
    if (baseSelect) {
      baseBranch = baseSelect.value || "";
    }

    var headInput = document.querySelector('input[name="pull_request[head]"]');
    if (headInput) {
      headBranch = headInput.value || "";
    }

    if (!baseBranch || !headBranch) {
      var compareMatch = url.match(/\/compare\/([^?#\s]+?)(?:\?|$|\s)/);
      if (compareMatch) {
        var compareParts = compareMatch[1].split("...");
        if (compareParts.length === 2) {
          if (!baseBranch) baseBranch = compareParts[0];
          if (!headBranch) headBranch = compareParts[1];
        } else if (compareParts.length === 1 && !headBranch) {
          headBranch = compareParts[0];
        }
      }
    }

    var branchNames = document.querySelectorAll(".branch-name");
    if (branchNames.length >= 2) {
      if (!baseBranch) baseBranch = branchNames[0].textContent.trim();
      if (!headBranch) headBranch = branchNames[1].textContent.trim();
    } else if (branchNames.length === 1 && !headBranch) {
      headBranch = branchNames[0].textContent.trim();
    }

    var refNameElements = document.querySelectorAll(".ref-name");
    if (refNameElements.length >= 2) {
      if (!baseBranch) baseBranch = refNameElements[0].textContent.trim();
      if (!headBranch) headBranch = refNameElements[1].textContent.trim();
    } else if (refNameElements.length === 1 && !headBranch) {
      headBranch = refNameElements[0].textContent.trim();
    }

    if (headBranch && headBranch.indexOf(":") !== -1) {
      headBranch = headBranch.split(":").pop();
    }

    if (baseBranch && baseBranch.indexOf(":") !== -1) {
      baseBranch = baseBranch.split(":").pop();
    }

    var result = { owner: owner, repo: repo, baseBranch: baseBranch, headBranch: headBranch };
    log("info", "extractBranchContext - " + JSON.stringify(result));
    return result;
  }

  function extractLinkedIssues(commits) {
    var issues = {};
    var allMessages = commits.map(function (c) { return c.message; }).join("\n");
    var patterns = [
      /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
      /#([1-9]\d{2,})/g
    ];
    patterns.forEach(function (pat) {
      var match;
      while ((match = pat.exec(allMessages)) !== null) {
        issues["#" + match[1]] = true;
      }
    });
    var result = Object.keys(issues);
    log("info", "extractLinkedIssues - found: " + result.join(", "));
    return result;
  }

  function extractExistingBody() {
    var textarea = document.querySelector("textarea#pull_request_body");
    var value = textarea ? textarea.value || "" : "";
    log("info", "extractExistingBody - length: " + value.length);
    return value;
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
      var branchContext = extractBranchContext();
      var linkedIssues = extractLinkedIssues(commits);
      var existingBody = extractExistingBody();
      log("info", "Extracted - commits: " + commits.length + ", files: " + fileChanges.length + ", stats: " + JSON.stringify(stats) + ", branch: " + JSON.stringify(branchContext) + ", issues: " + linkedIssues.length);

      if (commits.length === 0 && fileChanges.length === 0) {
        log("error", "No commits or file changes found");
        showToast("No commits or file changes found on this page.", true);
        return;
      }

      log("info", "Sending message to background script...");
      var response = await sendToBackground({
        type: "generate",
        data: {
          commits: commits.map(function (c) {
            return { message: c.message };
          }),
          fileChanges: fileChanges,
          stats: stats,
          branchContext: branchContext,
          linkedIssues: linkedIssues,
          existingBody: existingBody,
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

  function handleGenerateOpenedTitle() {
    var btn = document.getElementById(BTN_OPENED_TITLE_ID);
    if (!btn || btn.disabled) { log("warn", "Opened title button not found or disabled"); return; }
    setButtonLoading(btn, true);
    var openedDescBtn = document.getElementById(BTN_OPENED_DESC_ID);
    if (openedDescBtn) setButtonLoading(openedDescBtn, true);

    (async function () {
      try {
        var ctx = extractOwnerRepoPRNumber();
        var existingTitle = extractExistingOpenedTitle();
        var branchContext = extractBranchContext();
        if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
          showToast("Could not determine PR owner/repo/number from URL.", true);
          return;
        }
        log("info", "handleGenerateOpenedTitle - " + JSON.stringify(ctx));
        var response = await sendToBackground({
          type: "generateTitle",
          data: {
            owner: ctx.owner,
            repo: ctx.repo,
            prNumber: ctx.prNumber,
            existingTitle: existingTitle,
            branchContext: branchContext
          }
        });
        if (response.error) {
          log("error", "Error from background (generateTitle): " + response.error);
          showToast("Error: " + response.error, true);
          return;
        }
        if (response.updated) {
          showToast("PR title updated via GitHub API!");
        } else {
          showToast("Title generated but update status unknown.");
        }
      } catch (err) {
        log("error", "Error in handleGenerateOpenedTitle: " + err.message + " | Stack: " + err.stack);
        showToast("Error: " + err.message, true);
      } finally {
        setButtonLoading(btn, false);
        if (openedDescBtn) setButtonLoading(openedDescBtn, false);
      }
    })();
  }

  function handleGenerateOpenedDescription() {
    var btn = document.getElementById(BTN_OPENED_DESC_ID);
    if (!btn || btn.disabled) { log("warn", "Opened desc button not found or disabled"); return; }
    setButtonLoading(btn, true);
    var openedTitleBtn = document.getElementById(BTN_OPENED_TITLE_ID);
    if (openedTitleBtn) setButtonLoading(openedTitleBtn, true);

    (async function () {
      try {
        var ctx = extractOwnerRepoPRNumber();
        var existingTitle = extractExistingOpenedTitle();
        var existingDescription = extractExistingOpenedDescription();
        var branchContext = extractBranchContext();
        if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
          showToast("Could not determine PR owner/repo/number from URL.", true);
          return;
        }
        log("info", "handleGenerateOpenedDescription - " + JSON.stringify(ctx));
        var response = await sendToBackground({
          type: "generateDescription",
          data: {
            owner: ctx.owner,
            repo: ctx.repo,
            prNumber: ctx.prNumber,
            existingTitle: existingTitle,
            existingDescription: existingDescription,
            branchContext: branchContext
          }
        });
        if (response.error) {
          log("error", "Error from background (generateDescription): " + response.error);
          showToast("Error: " + response.error, true);
          return;
        }
        if (response.updated) {
          showToast("PR description updated via GitHub API!");
        } else {
          showToast("Description generated but update status unknown.");
        }
      } catch (err) {
        log("error", "Error in handleGenerateOpenedDescription: " + err.message + " | Stack: " + err.stack);
        showToast("Error: " + err.message, true);
      } finally {
        setButtonLoading(btn, false);
        if (openedTitleBtn) setButtonLoading(openedTitleBtn, false);
      }
    })();
  }

  function injectOpenedPRTitleButton() {
    if (document.getElementById(BTN_OPENED_TITLE_ID)) return;

    var titleArea = document.querySelector('[data-component="PH_Title"]');
    if (!titleArea) { log("warn", "PH_Title not found for opened PR title button"); return; }

    var titleSpan = titleArea.querySelector("span.markdown-title");
    if (!titleSpan) { log("warn", "markdown-title span not found in PH_Title"); return; }

    var parentSpan = titleSpan.closest("span") || titleSpan.parentElement;
    if (!parentSpan) { log("warn", "No parent span for title span"); return; }

    var btn = createButton(BTN_OPENED_TITLE_ID, "AI Title", handleGenerateOpenedTitle);
    btn.classList.add("ai-generate-btn--opened-title");
    parentSpan.appendChild(btn);
    log("info", "Opened PR title button injected");
  }

  async function handleGenerateMergeTitle() {
    var btn = document.getElementById(BTN_MERGE_TITLE_ID);
    if (!btn || btn.disabled) { log("warn", "Merge title button not found or disabled"); return; }
    setButtonLoading(btn, true);
    var mergeDescBtn = document.getElementById(BTN_MERGE_DESC_ID);
    if (mergeDescBtn) setButtonLoading(mergeDescBtn, true);

    try {
      var ctx = extractOwnerRepoPRNumber();
      var existingTitle = extractExistingOpenedTitle();
      var existingMergeTitle = extractExistingMergeTitle();
      var branchContext = extractBranchContext();
      var existingDescription = extractExistingOpenedDescription();
      if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
        showToast("Could not determine PR owner/repo/number from URL.", true);
        return;
      }
      log("info", "handleGenerateMergeTitle - " + JSON.stringify(ctx));
      var response = await sendToBackground({
        type: "generateMergeTitle",
        data: {
          owner: ctx.owner,
          repo: ctx.repo,
          prNumber: ctx.prNumber,
          existingTitle: existingTitle,
          existingMergeTitle: existingMergeTitle,
          existingDescription: existingDescription,
          branchContext: branchContext
        }
      });
      if (response.error) {
        log("error", "Error from background (generateMergeTitle): " + response.error);
        showToast("Error: " + response.error, true);
        return;
      }
      fillMergeFields(response.title, "");
      showToast("Merge commit title generated!");
    } catch (err) {
      log("error", "Error in handleGenerateMergeTitle: " + err.message + " | Stack: " + err.stack);
      showToast("Error: " + err.message, true);
    } finally {
      setButtonLoading(btn, false);
      if (mergeDescBtn) setButtonLoading(mergeDescBtn, false);
    }
  }

  async function handleGenerateMergeDescription() {
    var btn = document.getElementById(BTN_MERGE_DESC_ID);
    if (!btn || btn.disabled) { log("warn", "Merge desc button not found or disabled"); return; }
    setButtonLoading(btn, true);
    var mergeTitleBtn = document.getElementById(BTN_MERGE_TITLE_ID);
    if (mergeTitleBtn) setButtonLoading(mergeTitleBtn, true);

    try {
      var ctx = extractOwnerRepoPRNumber();
      var existingTitle = extractExistingOpenedTitle();
      var existingMergeTitle = extractExistingMergeTitle();
      var existingDescription = extractExistingOpenedDescription();
      var existingMergeDesc = extractExistingMergeDescription();
      var branchContext = extractBranchContext();
      if (!ctx.owner || !ctx.repo || !ctx.prNumber) {
        showToast("Could not determine PR owner/repo/number from URL.", true);
        return;
      }
      log("info", "handleGenerateMergeDescription - " + JSON.stringify(ctx));
      var response = await sendToBackground({
        type: "generateMergeDescription",
        data: {
          owner: ctx.owner,
          repo: ctx.repo,
          prNumber: ctx.prNumber,
          existingTitle: existingTitle,
          existingMergeTitle: existingMergeTitle,
          existingDescription: existingDescription,
          existingMergeDescription: existingMergeDesc,
          branchContext: branchContext
        }
      });
      if (response.error) {
        log("error", "Error from background (generateMergeDescription): " + response.error);
        showToast("Error: " + response.error, true);
        return;
      }
      fillMergeFields("", response.description);
      showToast("Merge commit description generated!");
    } catch (err) {
      log("error", "Error in handleGenerateMergeDescription: " + err.message + " | Stack: " + err.stack);
      showToast("Error: " + err.message, true);
    } finally {
      setButtonLoading(btn, false);
      if (mergeTitleBtn) setButtonLoading(mergeTitleBtn, false);
    }
  }

  function injectMergeTitleButton() {
    if (document.getElementById(BTN_MERGE_TITLE_ID)) return;

    var mergeTitleInput = findMergeTitleInput();
    if (!mergeTitleInput) { log("warn", "Merge title input not found for button injection"); return; }

    // Make the TextInput wrapper a positioning context
    var textInputWrapper = mergeTitleInput.closest('[data-component="TextInput"]');
    if (textInputWrapper) {
      textInputWrapper.style.position = "relative";
      var btn = createButton(BTN_MERGE_TITLE_ID, "✨", handleGenerateMergeTitle);
      btn.classList.add("ai-generate-btn--merge-title");
      btn.title = "AI Generate Merge Title";
      textInputWrapper.appendChild(btn);
      log("info", "Merge title button injected inside TextInput wrapper");
      return;
    }

    // Fallback: insert right after the input
    var btn2 = createButton(BTN_MERGE_TITLE_ID, "AI Merge Title", handleGenerateMergeTitle);
    btn2.classList.add("ai-generate-btn--merge-title");
    var parentEl = mergeTitleInput.parentElement;
    if (parentEl) {
      parentEl.insertBefore(btn2, mergeTitleInput.nextSibling);
      log("info", "Merge title button injected after input (fallback)");
    }
  }

  function injectMergeDescButton() {
    if (document.getElementById(BTN_MERGE_DESC_ID)) return;

    var textarea = findMergeDescTextarea();
    if (!textarea) { log("warn", "Merge description textarea not found for button injection"); return; }

    // Make the TextInput wrapper a positioning context
    var textInputWrapper = textarea.closest('[data-component="TextInput"]');
    if (textInputWrapper) {
      textInputWrapper.style.position = "relative";
      var btn = createButton(BTN_MERGE_DESC_ID, "✨", handleGenerateMergeDescription);
      btn.classList.add("ai-generate-btn--merge-desc");
      btn.title = "AI Generate Merge Description";
      textInputWrapper.appendChild(btn);
      log("info", "Merge description button injected inside TextInput wrapper");
      return;
    }

    // Last resort: insert right after the textarea
    var btn2 = createButton(BTN_MERGE_DESC_ID, "✨", handleGenerateMergeDescription);
    btn2.classList.add("ai-generate-btn--merge-desc");
    btn2.title = "AI Generate Merge Description";
    var parentEl = textarea.parentElement;
    if (parentEl) {
      parentEl.insertBefore(btn2, textarea.nextSibling);
      log("info", "Merge description button injected after textarea (last resort)");
    }
  }

  function injectMergeButtons() {
    injectMergeTitleButton();
    injectMergeDescButton();
    injectLogToggleButton();
  }

  function injectOpenedPRDescButton() {
    if (document.getElementById(BTN_OPENED_DESC_ID)) return;

    var commentBody = document.querySelector("div.js-command-palette-pull-body .js-comment-body");
    if (!commentBody) commentBody = document.querySelector("div.js-comment-body");
    if (!commentBody) { log("warn", "js-comment-body not found for opened PR desc button"); return; }

    var commentContainer = commentBody.closest(".timeline-comment-group");
    if (!commentContainer) commentContainer = commentBody.closest(".comment");
    if (!commentContainer) commentContainer = commentBody.parentElement;
    if (!commentContainer) { log("warn", "No comment container for desc button"); return; }

    var commentHeader = commentContainer.querySelector(".timeline-comment-header");
    if (!commentHeader) { log("warn", "No timeline-comment-header for desc button"); return; }

    var actionsDiv = commentHeader.querySelector(".timeline-comment-actions");
    if (!actionsDiv) { log("warn", "No timeline-comment-actions for desc button"); return; }

    var btn = createButton(BTN_OPENED_DESC_ID, "AI Description", handleGenerateOpenedDescription);
    btn.classList.add("ai-generate-btn--opened-desc");
    actionsDiv.prepend(btn);
    log("info", "Opened PR description button injected");
  }

  function injectButtons() {
    injectTitleButton();
    injectDescButton();
    injectLogToggleButton();
  }

  function injectOpenedPRButtons() {
    injectOpenedPRTitleButton();
    injectOpenedPRDescButton();
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

  var mergeCheckInterval = null;

  function startMergeCheckInterval() {
    if (mergeCheckInterval) return;
    mergeCheckInterval = setInterval(function () {
      if (isMergeConfirmationPage()) {
        injectMergeButtons();
        // Stop polling once merge buttons are injected
        clearInterval(mergeCheckInterval);
        mergeCheckInterval = null;
      }
    }, 1000);
  }

  var observer = new MutationObserver(function (mutations) {
    var mergeDetected = false;
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
            if (
              node.querySelector('[data-component="PH_Title"]') ||
              node.querySelector("div.js-comment-body") ||
              (node.matches && node.matches('[data-component="PH_Title"]'))
            ) {
              if (isPROpenedPage()) {
                injectOpenedPRButtons();
              }
            }
            if (
              node.querySelector('[class*="ConfirmMerge"]') ||
              node.querySelector('input[data-component="input"][type="text"]') ||
              node.querySelector('.prc-Textarea-TextArea-snlco, textarea[placeholder*="extended description"]') ||
              (node.matches && (node.matches('[class*="ConfirmMerge"]') || node.matches('.prc-Textarea-TextArea-snlco')))
            ) {
              mergeDetected = true;
            }
          }
        }
      }
    }
    if (mergeDetected && isMergeConfirmationPage()) {
      injectMergeButtons();
    }
  });

  var turbListener = function () {
    setTimeout(function () {
      if (isPRCreationPage()) {
        injectButtons();
      }
      if (isPROpenedPage()) {
        injectOpenedPRButtons();
        startMergeCheckInterval();
      }
      if (isMergeConfirmationPage()) {
        injectMergeButtons();
      }
    }, 1000);
  };

  document.addEventListener("turbo:load", turbListener);
  document.addEventListener("turbo:render", turbListener);
  document.addEventListener("pjax:end", turbListener);

  function init() {
    log("info", "init called on URL: " + window.location.href);
    var isCreation = isPRCreationPage();
    var isOpened = isPROpenedPage();
    var isMerge = isMergeConfirmationPage();

    if (isCreation) {
      log("info", "PR creation page detected, injecting buttons...");
      injectButtons();
    }
    if (isOpened) {
      log("info", "Opened PR page detected, injecting buttons...");
      injectOpenedPRButtons();
      // Start periodic merge dialog check — merge dialog appears on click
      startMergeCheckInterval();
    }
    if (isMerge) {
      log("info", "Merge confirmation page detected, injecting merge buttons...");
      injectMergeButtons();
    }
    if (isCreation || isOpened || isMerge) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      log("info", "MutationObserver started");
    } else {
      log("info", "Not a PR creation, opened PR, or merge page, skipping");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    setTimeout(init, 500);
  }
})();
