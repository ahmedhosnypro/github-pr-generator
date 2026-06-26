(function () {
  var endpointInput = document.getElementById("apiEndpoint");
  var apiKeyInput = document.getElementById("apiKey");
  var modelInput = document.getElementById("model");
  var saveBtn = document.getElementById("saveBtn");
  var savedMsg = document.getElementById("savedMsg");

  function loadSettings() {
    fetch(chrome.runtime.getURL("config.local.json"))
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (fileConfig) {
        if (fileConfig) {
          endpointInput.value = fileConfig.apiEndpoint || "";
          modelInput.value = fileConfig.model || "";
          if (fileConfig.apiKey) {
            apiKeyInput.value = fileConfig.apiKey;
          }
          apiKeyInput.placeholder = fileConfig.apiKey ? "(loaded from config.local.json)" : "(set in config.local.json)";
        }
        chrome.storage.local.get({}, function (stored) {
          if (!fileConfig) {
            endpointInput.value = stored.apiEndpoint || "";
            apiKeyInput.value = stored.apiKey || "";
            modelInput.value = stored.model || "";
          }
        });
      })
      .catch(function () {
        chrome.storage.local.get({}, function (stored) {
          endpointInput.value = stored.apiEndpoint || "";
          apiKeyInput.value = stored.apiKey || "";
          modelInput.value = stored.model || "";
        });
      });
  }

  function saveSettings() {
    var data = {
      apiEndpoint: endpointInput.value.trim(),
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim(),
    };
    chrome.storage.local.set(data, function () {
      savedMsg.classList.add("show");
      setTimeout(function () {
        savedMsg.classList.remove("show");
      }, 2000);
    });
  }

  saveBtn.addEventListener("click", saveSettings);
  loadSettings();
})();
