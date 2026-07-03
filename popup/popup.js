(function () {
  var endpointInput = document.getElementById("apiEndpoint");
  var apiKeyInput = document.getElementById("apiKey");
  var modelInput = document.getElementById("model");
  var githubTokenInput = document.getElementById("githubToken");
  var saveBtn = document.getElementById("saveBtn");
  var savedMsg = document.getElementById("savedMsg");

  var loaded = false;

  // Send a config save through the background service worker, which outlives the
  // popup. Writing there (instead of via chrome.storage.local.set directly in
  // the popup) prevents the write from being dropped when the popup closes before
  // an in-popup async set completes — which was why edits appeared unsaved.
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
    // Primary: go through the service worker so the write survives popup close.
    sendToBackground("saveConfig", partial);
    // Secondary (defensive): also write directly in case the SW is inactive.
    storageSetFallback(partial);
  }

  function showToast() {
    if (!savedMsg) return;
    savedMsg.classList.add("show");
    setTimeout(function () {
      savedMsg.classList.remove("show");
    }, 2000);
  }

  function saveSettings() {
    var data = {
      apiEndpoint: endpointInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim(),
      githubToken: githubTokenInput.value.trim(),
    };
    sendToBackground("saveConfig", data).then(function (resp) {
      console.log("[PR Generator popup] saveSettings via SW:", resp);
      // Defensive fallback only if the SW route failed.
      if (!resp || !resp.ok) storageSetFallback(data);
      showToast();
    });
  }

  function applyValues(stored, fileConfig) {
    endpointInput.value = stored.apiEndpoint || (fileConfig && fileConfig.apiEndpoint) || "";
    apiKeyInput.value = stored.apiKey || (fileConfig && fileConfig.apiKey) || "";
    modelInput.value = stored.model || (fileConfig && fileConfig.model) || "";
    githubTokenInput.value = stored.githubToken || (fileConfig && fileConfig.githubToken) || "";

    apiKeyInput.placeholder = (fileConfig && fileConfig.apiKey)
      ? "(loaded from config.local.json — edit to override)"
      : "(set in config.local.json)";
    githubTokenInput.placeholder = (fileConfig && fileConfig.githubToken)
      ? "(loaded from config.local.json — edit to override)"
      : "(optional)";

    loaded = true;
  }

  function loadSettings() {
    // Read bundled defaults and chrome.storage.local in parallel. Saved values
    // always take precedence over the bundled file defaults.
    var filePromise = fetch(chrome.runtime.getURL("config.local.json"))
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });

    var storedPromise = sendToBackground("getStoredConfig", null).catch(function () { return null; });
    // Fallback: read storage directly too, in case the SW path didn't respond.
    var directStored = new Promise(function (resolve) {
      try {
        chrome.storage.local.get(["apiEndpoint", "apiKey", "model", "githubToken"], resolve);
      } catch (e) {
        resolve({});
      }
    });

    Promise.all([storedPromise, directStored, filePromise]).then(function (results) {
      var swStored = results[0] || {};
      var direct = results[1] || {};
      var fileConfig = results[2];
      // Merge: prefer SW-reported stored values, then direct storage, then file.
      var stored = {
        apiEndpoint: swStored.apiEndpoint || direct.apiEndpoint || "",
        apiKey: swStored.apiKey || direct.apiKey || "",
        model: swStored.model || direct.model || "",
        githubToken: swStored.githubToken || direct.githubToken || "",
      };
      console.log("[PR Generator popup] load: sw=" + JSON.stringify(swStored) + " direct=" + JSON.stringify(direct) + " file=" + (fileConfig ? "(present)" : "(none)"));
      applyValues(stored, fileConfig);
    });
  }

  if (saveBtn) saveBtn.addEventListener("click", saveSettings);

  function onInput(key, el) {
    if (!el) return;
    el.addEventListener("input", function () {
      if (loaded) persistField(key, el.value);
    });
  }
  onInput("apiEndpoint", endpointInput);
  onInput("apiKey", apiKeyInput);
  onInput("model", modelInput);
  onInput("githubToken", githubTokenInput);

  loadSettings();
})();
