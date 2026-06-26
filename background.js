let FILE_CONFIG = null;

function logMsg(msg) {
  console.log("[PR Generator BG v5] " + msg);
}

async function loadFileConfig() {
  try {
    const url = chrome.runtime.getURL("config.local.json");
    const response = await fetch(url);
    if (response.ok) {
      FILE_CONFIG = await response.json();
      logMsg("Loaded config.local.json: apiEndpoint=" + FILE_CONFIG.apiEndpoint + ", model=" + FILE_CONFIG.model);
    } else {
      logMsg("config.local.json not found, using chrome.storage defaults");
    }
  } catch (e) {
    logMsg("Failed to load config.local.json: " + e.message);
  }
}

loadFileConfig();

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get({}, (stored) => {
      const config = {
        apiEndpoint: (FILE_CONFIG && FILE_CONFIG.apiEndpoint) || stored.apiEndpoint || "",
        apiKey: (FILE_CONFIG && FILE_CONFIG.apiKey) || stored.apiKey || "",
        model: (FILE_CONFIG && FILE_CONFIG.model) || stored.model || "",
      };
      logMsg("Config resolved: apiEndpoint=" + config.apiEndpoint + ", model=" + config.model + ", hasKey=" + !!config.apiKey);
      resolve(config);
    });
  });
}

function validateConfig(config) {
  if (!config.apiEndpoint) return "API endpoint is not configured. Set it in config.local.json or extension popup.";
  if (!config.apiKey) return "API key is not configured. Set it in config.local.json or extension popup.";
  if (!config.model) return "Model is not configured. Set it in config.local.json or extension popup.";

  try {
    new URL(config.apiEndpoint);
  } catch (e) {
    return "API endpoint is not a valid URL: " + config.apiEndpoint;
  }

  if (config.apiKey.length < 5) return "API key appears too short to be valid.";

  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logMsg("Received message type: " + message.type);
  if (message.type === "generate") {
    handleGenerate(message.data)
      .then((result) => {
        logMsg("Success - title: " + result.title);
        sendResponse(result);
      })
      .catch((err) => {
        logMsg("Error: " + err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
  if (message.type === "getConfig") {
    getConfig().then((config) => {
      sendResponse({ apiEndpoint: config.apiEndpoint, model: config.model, hasKey: !!config.apiKey });
    });
    return true;
  }
});

async function handleGenerate(data) {
  logMsg("handleGenerate - commits: " + (data.commits ? data.commits.length : 0) + ", files: " + (data.fileChanges ? data.fileChanges.length : 0));

  const config = await getConfig();
  const configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

  const changesSummary = buildChangesSummary(data);
  logMsg("Built changesSummary, length: " + changesSummary.length);

  const titlePrompt = buildTitlePrompt(changesSummary);
  const descPrompt = buildDescPrompt(changesSummary);

  logMsg("Generating title...");
  const title = await callAPI(config, titlePrompt);
  logMsg("Title generated: " + title.substring(0, 80));

  logMsg("Generating description...");
  const description = await callAPI(config, descPrompt);
  logMsg("Description generated, length: " + description.length);

  return { title: title.trim(), description: description.trim() };
}

async function callAPI(config, prompt) {
  const url = config.apiEndpoint + "/chat/completions";
  logMsg("Calling API: " + url + ", model: " + config.model);

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + config.apiKey,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: "You are a helpful assistant specialized in writing clear and comprehensive GitHub pull request titles and descriptions." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });
  } catch (fetchErr) {
    logMsg("Fetch failed (network error): " + fetchErr.message);
    throw new Error("Network error calling API at " + url + ": " + fetchErr.message);
  }

  logMsg("API response status: " + response.status);

  if (!response.ok) {
    const text = await response.text();
    logMsg("API error body: " + text.substring(0, 300));
    if (response.status === 401 || response.status === 403) {
      throw new Error("API authentication failed (status " + response.status + "). Check your API key in config.local.json.");
    }
    throw new Error("API error " + response.status + ": " + text.substring(0, 200));
  }

  const responseText = await response.text();

  let cleanResponseText = responseText.replace(/data:\s*\[DONE\].*$/s, "").trim();
  if (cleanResponseText !== responseText.trim()) {
    logMsg("Stripped trailing SSE data from response");
  }

  let json;
  try {
    json = JSON.parse(cleanResponseText);
  } catch (parseErr) {
    logMsg("JSON.parse failed: " + parseErr.message);
    logMsg("Response text (first 300): " + responseText.substring(0, 300));
    throw new Error("Failed to parse API response as JSON: " + parseErr.message);
  }

  const content = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;

  if (!content) {
    logMsg("No content in API response. Keys: " + Object.keys(json).join(", "));
    throw new Error("No content in API response");
  }

  logMsg("API content length: " + content.length);
  return content.trim();
}

function buildChangesSummary(data) {
  let summary = "";

  summary += "## Commits\n\n";
  if (data.commits && data.commits.length > 0) {
    for (const commit of data.commits) {
      summary += "- " + commit.message + "\n";
    }
  } else {
    summary += "(No commit information available)\n";
  }

  summary += "\n## Changed Files\n\n";
  if (data.fileChanges && data.fileChanges.length > 0) {
    for (const file of data.fileChanges) {
      const indicator = file.type === "added" ? "[+]" : file.type === "removed" ? "[-]" : file.type === "renamed" ? "[~]" : "[m]";
      summary += "- " + indicator + " " + file.path + " (+" + file.additions + "/-" + file.deletions + ")\n";
    }
  } else {
    summary += "(No file change information available)\n";
  }

  if (data.stats) {
    summary += "\n## Stats\n\n";
    summary += "- " + data.stats.files + " changed files\n";
    summary += "- " + data.stats.additions + " additions\n";
    summary += "- " + data.stats.deletions + " deletions\n";
  }

  return summary;
}

function buildTitlePrompt(changesSummary) {
  return "Generate a concise GitHub pull request title for the following changes.\n\n" +
    changesSummary + "\n" +
    "Instructions:\n" +
    "1. Write ONLY the title text, nothing else\n" +
    "2. Use conventional commit format (e.g., \"feat: add user authentication\", \"fix: resolve login redirect loop\")\n" +
    "3. Keep it under 72 characters\n" +
    "4. Do not add quotes, prefixes like \"Title:\", or any extra formatting\n" +
    "5. Do not use markdown\n\n" +
    "Generate the PR title now:";
}

function buildDescPrompt(changesSummary) {
  return "Generate a comprehensive GitHub pull request description based on the following changes.\n\n" +
    changesSummary + "\n" +
    "Instructions:\n" +
    "1. Write a clear, structured markdown description\n" +
    "2. Start with a brief summary of what this PR does\n" +
    "3. Group changes by category using bullet points\n" +
    "4. Highlight any breaking changes or important notes\n" +
    "5. Do not use triple backtick fences\n" +
    "6. Do not add any meta-commentary about the description itself\n" +
    "7. Start directly with the content (e.g., ## Summary or ## Description)\n" +
    "8. Do not include a title line - only the description body\n\n" +
    "Generate the PR description now:";
}
