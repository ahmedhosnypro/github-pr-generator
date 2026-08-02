(function () {
  var endpointInput = document.getElementById("apiEndpoint");
  var apiKeyInput = document.getElementById("apiKey");
  var modelInput = document.getElementById("model");
  var githubTokenInput = document.getElementById("githubToken");
  var diffEnabledInput = document.getElementById("diffEnabled");
  var diffMaxLinesInput = document.getElementById("diffMaxLines");
  var diffMaxBytesInput = document.getElementById("diffMaxBytes");
  var saveBtn = document.getElementById("saveBtn");
  var toast = document.getElementById("toast");
  var themeToggle = document.getElementById("themeToggle");
  var validateEndpointBtn = document.getElementById("validateEndpointBtn");
  var toggleApiKeyBtn = document.getElementById("toggleApiKeyBtn");
  var toggleGithubTokenBtn = document.getElementById("toggleGithubTokenBtn");
  var diffSettingsToggle = document.getElementById("diffSettingsToggle");
  var diffConditionalFields = document.getElementById("diffConditionalFields");
  var connectionStatus = document.getElementById("connectionStatus");
  var connectionStatusText = connectionStatus.querySelector(".status-indicator__text");
  var testApiBtn = document.getElementById("testApiBtn");
  var testApiResult = document.getElementById("testApiResult");
  var testGitHubBtn = document.getElementById("testGitHubBtn");
  var testGitHubResult = document.getElementById("testGitHubResult");
  var lastSavedEl = document.getElementById("lastSaved");

  var apiEndpointError = document.getElementById("apiEndpointError");
  var loaded = false;
  var validationTimeout = null;
  var lastSavedTime = null;

  function sendToBackground(type, data) {
    return new Promise(function (resolve) {
      try {
        chrome.runtime.sendMessage({ type: type, data: data }, function (resp) {
          var err = chrome.runtime.lastError;
          if (err) {
            console.error("[PR Generator popup] sendMessage error:", err.message);
            resolve({ ok: false, error: err.message });
          } else {
            resolve(resp || { ok: false, error: "no response" });
          }
        });
      } catch (e) {
        console.error("[PR Generator popup] sendMessage threw:", e);
        resolve({ ok: false, error: e.message });
      }
    });
  }

  function storageSetFallback(data) {
    try {
      chrome.storage.local.set(data);
    } catch (e) {
      console.error("[PR Generator popup] storage set fallback failed:", e);
    }
  }

  function persistField(key, value) {
    if (!loaded) return;
    var partial = {};
    partial[key] = (value || "").trim();
    sendToBackground("saveConfig", partial);
    storageSetFallback(partial);
    updateLastSaved();
  }

  function showToast(message, type) {
    if (!toast) return;
    toast.textContent = message;
    toast.className = "toast show " + (type === "error" ? "toast--error" : "toast--success");
    setTimeout(function () {
      toast.classList.remove("show");
    }, 3000);
  }

  function saveSettings() {
    console.log("[POPUP LOG] saveSettings called - model=" + modelInput.value.trim() + ", endpoint=" + endpointInput.value.trim());
    var data = {
      apiEndpoint: endpointInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim(),
      githubToken: githubTokenInput.value.trim(),
      diffEnabled: diffEnabledInput.checked,
      diffMaxLines: parseInt(diffMaxLinesInput.value, 10) || 3000,
      diffMaxBytes: parseInt(diffMaxBytesInput.value, 10) || 100000,
    };
    sendToBackground("saveConfig", data).then(function (resp) {
      console.log("[PR Generator popup] saveSettings via SW:", resp);
      if (!resp || !resp.ok) storageSetFallback(data);
      showToast("Settings saved!");
      updateLastSaved();
    });
  }

  function applyValues(stored, fileConfig) {
    endpointInput.value = stored.apiEndpoint || (fileConfig && fileConfig.apiEndpoint) || "";
    apiKeyInput.value = stored.apiKey || (fileConfig && fileConfig.apiKey) || "";
    modelInput.value = stored.model || (fileConfig && fileConfig.model) || "";
    githubTokenInput.value = stored.githubToken || (fileConfig && fileConfig.githubToken) || "";
    diffEnabledInput.checked = stored.diffEnabled !== undefined ? stored.diffEnabled : (fileConfig && fileConfig.diffEnabled !== undefined ? fileConfig.diffEnabled : true);
    diffMaxLinesInput.value = stored.diffMaxLines || (fileConfig && fileConfig.diffMaxLines) || 3000;
    diffMaxBytesInput.value = stored.diffMaxBytes || (fileConfig && fileConfig.diffMaxBytes) || 100000;

    apiKeyInput.placeholder = (fileConfig && fileConfig.apiKey)
      ? "(loaded from config.local.json — edit to override)"
      : "(set in config.local.json)";
    githubTokenInput.placeholder = (fileConfig && fileConfig.githubToken)
      ? "(loaded from config.local.json — edit to override)"
      : "(optional)";

    updateDiffConditionalVisibility();
    loaded = true;
  }

  function loadSettings() {
    var filePromise = fetch(chrome.runtime.getURL("config.local.json"))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });

    var storedPromise = sendToBackground("getStoredConfig", null).catch(function () { return null; });
    var directStored = new Promise(function (resolve) {
      try {
        chrome.storage.local.get(["apiEndpoint", "apiKey", "model", "githubToken", "diffEnabled", "diffMaxLines", "diffMaxBytes"], resolve);
      } catch (e) {
        resolve({});
      }
    });

    Promise.all([storedPromise, directStored, filePromise]).then(function (results) {
      var swStored = results[0] || {};
      var direct = results[1] || {};
      var fileConfig = results[2];
      var stored = {
        apiEndpoint: swStored.apiEndpoint || direct.apiEndpoint || "",
        apiKey: swStored.apiKey || direct.apiKey || "",
        model: swStored.model || direct.model || "",
        githubToken: swStored.githubToken || direct.githubToken || "",
        diffEnabled: swStored.diffEnabled !== undefined ? swStored.diffEnabled : (direct.diffEnabled !== undefined ? direct.diffEnabled : true),
        diffMaxLines: swStored.diffMaxLines || direct.diffMaxLines || 3000,
        diffMaxBytes: swStored.diffMaxBytes || direct.diffMaxBytes || 100000,
      };
      console.log("[PR Generator popup] load: sw=" + JSON.stringify(swStored) + " direct=" + JSON.stringify(direct) + " file=" + (fileConfig ? "(present)" : "(none)"));
      applyValues(stored, fileConfig);
      validateEndpointDebounced();
    });
  }

  function updateLastSaved() {
    lastSavedTime = new Date();
    if (lastSavedEl) {
      var timeStr = lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      lastSavedEl.textContent = "Saved " + timeStr;
    }
  }

  function setConnectionStatus(status, message) {
    connectionStatus.className = "status-indicator status-indicator--" + status;
    connectionStatusText.textContent = message;
  }

  function validateEndpointDebounced() {
    if (validationTimeout) clearTimeout(validationTimeout);
    validationTimeout = setTimeout(validateEndpoint, 500);
  }

  function validateEndpoint() {
    var url = endpointInput.value.trim();
    if (!url) {
      setConnectionStatus("", "Not validated");
      endpointInput.classList.remove("md-text-field__input--error");
      apiEndpointError.textContent = "";
      apiEndpointError.classList.remove("visible");
      return;
    }

    try {
      new URL(url);
    } catch (e) {
      setConnectionStatus("error", "Invalid URL");
      endpointInput.classList.add("md-text-field__input--error");
      apiEndpointError.textContent = "Please enter a valid URL";
      apiEndpointError.classList.add("visible");
      return;
    }

    setConnectionStatus("validating", "Validating...");

    fetch(url.replace(/\/+$/, "") + "/models", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + apiKeyInput.value.trim(),
        "Content-Type": "application/json"
      },
      mode: "cors"
    }).then(function (response) {
      if (response.ok || response.status === 401 || response.status === 403) {
        setConnectionStatus("connected", "Connected");
        endpointInput.classList.remove("md-text-field__input--error");
        apiEndpointError.textContent = "";
        apiEndpointError.classList.remove("visible");
      } else {
        setConnectionStatus("error", "Error: " + response.status);
        endpointInput.classList.add("md-text-field__input--error");
        apiEndpointError.textContent = "Server returned " + response.status;
        apiEndpointError.classList.add("visible");
      }
    }).catch(function (err) {
      if (err.name === "TypeError" && err.message.includes("CORS")) {
        setConnectionStatus("connected", "Connected (CORS limited)");
        endpointInput.classList.remove("md-text-field__input--error");
        apiEndpointError.textContent = "";
        apiEndpointError.classList.remove("visible");
      } else {
        setConnectionStatus("error", "Connection failed");
        endpointInput.classList.add("md-text-field__input--error");
        apiEndpointError.textContent = "Could not connect to endpoint";
        apiEndpointError.classList.add("visible");
      }
    });
  }

  function togglePasswordVisibility(input, button) {
    var isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    var eyeOpen = button.querySelector(".eye-open");
    var eyeClosed = button.querySelector(".eye-closed");
    if (eyeOpen && eyeClosed) {
      eyeOpen.style.display = isPassword ? "none" : "block";
      eyeClosed.style.display = isPassword ? "block" : "none";
    }
    button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
  }

  function updateDiffConditionalVisibility() {
    if (diffEnabledInput.checked) {
      diffConditionalFields.classList.remove("hidden");
    } else {
      diffConditionalFields.classList.add("hidden");
    }
  }

  function initTheme() {
    var savedTheme = null;
    try {
      chrome.storage.sync.get("theme", function (result) {
        savedTheme = result.theme;
        applyTheme(savedTheme);
      });
    } catch (e) {
      applyTheme(null);
    }
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    html.classList.remove("theme-light", "theme-dark");

    if (theme === "light" || theme === "dark") {
      html.classList.add("theme-" + theme);
    } else {
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      html.classList.add("theme-" + (prefersDark ? "dark" : "light"));
    }
  }

  function toggleTheme() {
    var html = document.documentElement;
    var isDark = html.classList.contains("theme-dark");
    var newTheme = isDark ? "light" : "dark";
    html.classList.remove("theme-" + (isDark ? "dark" : "light"));
    html.classList.add("theme-" + newTheme);
    try {
      chrome.storage.sync.set({ theme: newTheme });
    } catch (e) {
      console.error("[PR Generator popup] Failed to save theme:", e);
    }
  }

  function handleSystemThemeChange(e) {
    var html = document.documentElement;
    var hasManualTheme = html.classList.contains("theme-light") || html.classList.contains("theme-dark");
    if (!hasManualTheme) {
      applyTheme(null);
    }
  }

  if (saveBtn) saveBtn.addEventListener("click", saveSettings);

  function onInput(key, el) {
    if (!el) return;
    el.addEventListener("input", function () {
      if (loaded) persistField(key, el.value);
    });
    if (el.type === "checkbox") {
      el.addEventListener("change", function () {
        if (loaded) persistField(key, el.checked);
      });
    }
  }

  onInput("apiEndpoint", endpointInput);
  onInput("apiKey", apiKeyInput);
  onInput("model", modelInput);
  onInput("githubToken", githubTokenInput);
  onInput("diffEnabled", diffEnabledInput);
  onInput("diffMaxLines", diffMaxLinesInput);
  onInput("diffMaxBytes", diffMaxBytesInput);

  if (validateEndpointBtn) {
    validateEndpointBtn.addEventListener("click", validateEndpoint);
  }

  if (toggleApiKeyBtn) {
    toggleApiKeyBtn.addEventListener("click", function () {
      togglePasswordVisibility(apiKeyInput, toggleApiKeyBtn);
    });
  }

  if (toggleGithubTokenBtn) {
    toggleGithubTokenBtn.addEventListener("click", function () {
      togglePasswordVisibility(githubTokenInput, toggleGithubTokenBtn);
    });
  }

  if (diffEnabledInput) {
    diffEnabledInput.addEventListener("change", updateDiffConditionalVisibility);
  }

  if (diffSettingsToggle) {
    diffSettingsToggle.addEventListener("click", function () {
      var section = diffSettingsToggle.closest(".section");
      var expanded = diffSettingsToggle.getAttribute("aria-expanded") === "true";
      diffSettingsToggle.setAttribute("aria-expanded", !expanded);
      section.classList.toggle("collapsed");
    });
  }

  if (testApiBtn) {
    testApiBtn.addEventListener("click", testAPI);
  }
  if (testGitHubBtn) {
    testGitHubBtn.addEventListener("click", testGitHub);
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  if (endpointInput) {
    endpointInput.addEventListener("blur", validateEndpointDebounced);
    endpointInput.addEventListener("input", function () {
      endpointInput.classList.remove("md-text-field__input--error");
      apiEndpointError.textContent = "";
      apiEndpointError.classList.remove("visible");
    });
  }

  function testAPI() {
    if (!testApiBtn || !testApiResult) return;
    var endpoint = endpointInput.value.trim();
    var key = apiKeyInput.value.trim();
    var model = modelInput.value.trim();
    if (!endpoint || !key || !model) {
      testApiResult.textContent = "Fill endpoint, key, model";
      testApiResult.style.color = "var(--md-sys-color-error)";
      return;
    }
    console.log("[POPUP LOG] testAPI - endpoint:", endpoint, "model:", model, "key len:", key ? key.length : 0);
    testApiBtn.disabled = true;
    testApiBtn.textContent = "Testing...";
    testApiResult.textContent = "Sending...";
    testApiResult.style.color = "var(--md-sys-color-on-surface-variant)";

    fetch(endpoint.replace(/\/+$/, "") + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + key
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "Hello! Respond with exactly: OK" }],
        max_tokens: 10,
        temperature: 0,
        stream: false
      })
    }).then(function (resp) {
      console.log("[popup testAPI] response status:", resp.status, "content-type:", resp.headers.get("content-type"));
    var ct = resp.headers.get("content-type") || "";
      return resp.text().then(function (text) {
        console.log("[popup testAPI] SSE detected, chunks:", text.split("\n").filter(function (l) { return l.trim().startsWith("data:"); }).length);
        if (ct.includes("event-stream") || /^data:\s/m.test(text)) {
          // SSE stream: aggregate chunks
          var aggregated = "";
          text.split("\n").forEach(function (line) {
            var l = line.replace(/\r$/, "").trim();
            if (!l.startsWith("data:")) return;
            var payload = l.replace(/^data:\s*/, "");
            if (payload === "[DONE]" || payload === "") return;
            try {
              var chunk = JSON.parse(payload);
              var delta = (chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) ||
                (chunk.choices && chunk.choices[0] && chunk.choices[0].message && chunk.choices[0].message.content) || "";
              if (delta) aggregated += delta;
            } catch (e) { /* skip bad chunk */ }
          });
          return { ok: resp.ok, body: aggregated || "(stream response)" };
        }
        if (resp.ok) {
          try {
            return { ok: true, body: JSON.parse(text) };
          } catch (e) {
            console.log("[popup testAPI] Non-JSON ok response:", text.substring(0, 200));
            return { ok: true, body: text };
          }
        }
        return { ok: false, status: resp.status, body: text };
      });
    }).then(function (result) {
      testApiBtn.disabled = false;
      testApiBtn.textContent = "Test API";
      if (result.ok) {
        testApiResult.textContent = "Success! API works.";
        testApiResult.style.color = "var(--md-sys-color-tertiary)";
      } else {
        testApiResult.textContent = "Failed (" + result.status + "): " + (result.body || "").substring(0, 60);
        testApiResult.style.color = "var(--md-sys-color-error)";
      }
    }).catch(function (err) {
      testApiBtn.disabled = false;
      testApiBtn.textContent = "Test API";
      testApiResult.textContent = "Error: " + err.message;
      testApiResult.style.color = "var(--md-sys-color-error)";
    });
  }

  function testGitHub() {
    if (!testGitHubBtn || !testGitHubResult) return;
    var token = githubTokenInput.value.trim();
    if (!token) {
      testGitHubResult.textContent = "Enter a GitHub token";
      testGitHubResult.style.color = "var(--md-sys-color-error)";
      return;
    }
    testGitHubBtn.disabled = true;
    testGitHubBtn.textContent = "Testing...";
    testGitHubResult.textContent = "Checking...";
    testGitHubResult.style.color = "var(--md-sys-color-on-surface-variant)";

    console.log("[popup testGitHub] testing token for api.github.com/user");
    fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "github-pr-generator-extension"
      }
    }).then(function (resp) {
      console.log("[popup testGitHub] response:", resp.status);
      return resp.text().then(function (text) {
        try { return { ok: resp.ok, status: resp.status, body: JSON.parse(text) }; } catch (e) { return { ok: resp.ok, status: resp.status, body: text }; }
      });
    }).then(function (result) {
      testGitHubBtn.disabled = false;
      testGitHubBtn.textContent = "Test GitHub";
      if (result.ok) {
        testGitHubResult.textContent = "Success! User: " + (result.body.login || "unknown");
        testGitHubResult.style.color = "var(--md-sys-color-tertiary)";
      } else {
        testGitHubResult.textContent = "Failed (" + result.status + "): " + (result.body.message || JSON.stringify(result.body)).substring(0, 60);
        testGitHubResult.style.color = "var(--md-sys-color-error)";
      }
    }).catch(function (err) {
      testGitHubBtn.disabled = false;
      testGitHubBtn.textContent = "Test GitHub";
      testGitHubResult.textContent = "Error: " + err.message;
      testGitHubResult.style.color = "var(--md-sys-color-error)";
    });
  }

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", handleSystemThemeChange);

  console.log("[POPUP LOG] popup loaded, endpoint=" + endpointInput.value + ", model=" + modelInput.value + ", apiKey set=" + !!apiKeyInput.value);
  console.log("[POPUP LOG] model value on load =", modelInput ? modelInput.value : "N/A");

  initTheme();
  loadSettings();
})();