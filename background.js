let FILE_CONFIG = null;

function logMsg(msg) {
  console.log("[PR Generator BG v8] " + msg);
}

async function loadFileConfig() {
  try {
    const url = chrome.runtime.getURL("config.local.json");
    const response = await fetch(url);
    if (response.ok) {
      FILE_CONFIG = await response.json();
      logMsg("Loaded config.local.json: apiEndpoint=" + FILE_CONFIG.apiEndpoint + ", model=" + FILE_CONFIG.model + ", hasGithubToken=" + !!FILE_CONFIG.githubToken);
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
        githubToken: (FILE_CONFIG && FILE_CONFIG.githubToken) || stored.githubToken || "",
        diffEnabled: (FILE_CONFIG && FILE_CONFIG.diffEnabled !== undefined) ? FILE_CONFIG.diffEnabled : (stored.diffEnabled !== undefined ? stored.diffEnabled === true || stored.diffEnabled === "true" : true),
        diffMaxLines: (FILE_CONFIG && FILE_CONFIG.diffMaxLines !== undefined) ? FILE_CONFIG.diffMaxLines : (stored.diffMaxLines !== undefined ? parseInt(stored.diffMaxLines, 10) : 3000),
        diffMaxBytes: (FILE_CONFIG && FILE_CONFIG.diffMaxBytes !== undefined) ? FILE_CONFIG.diffMaxBytes : (stored.diffMaxBytes !== undefined ? parseInt(stored.diffMaxBytes, 10) : 100000),
      };
      logMsg("Config resolved: apiEndpoint=" + config.apiEndpoint + ", model=" + config.model + ", hasKey=" + !!config.apiKey + ", hasGithubToken=" + !!config.githubToken + ", diffEnabled=" + config.diffEnabled + ", diffMaxLines=" + config.diffMaxLines + ", diffMaxBytes=" + config.diffMaxBytes);
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
      sendResponse({ apiEndpoint: config.apiEndpoint, model: config.model, hasKey: !!config.apiKey, hasGithubToken: !!config.githubToken });
    });
    return true;
  }
  if (message.type === "generateTitle") {
    handleGenerateTitle(message.data)
      .then((result) => {
        logMsg("generateTitle success - title: " + result.title);
        sendResponse(result);
      })
      .catch((err) => {
        logMsg("generateTitle error: " + err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
  if (message.type === "generateDescription") {
    handleGenerateDescription(message.data)
      .then((result) => {
        logMsg("generateDescription success - body length: " + (result.body || "").length);
        sendResponse(result);
      })
      .catch((err) => {
        logMsg("generateDescription error: " + err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
  if (message.type === "generateMergeTitle") {
    handleGenerateMergeTitle(message.data)
      .then((result) => {
        logMsg("generateMergeTitle success - title: " + result.title);
        sendResponse(result);
      })
      .catch((err) => {
        logMsg("generateMergeTitle error: " + err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
  if (message.type === "generateMergeDescription") {
    handleGenerateMergeDescription(message.data)
      .then((result) => {
        logMsg("generateMergeDescription success - body length: " + (result.description || "").length);
        sendResponse(result);
      })
      .catch((err) => {
        logMsg("generateMergeDescription error: " + err.message);
        sendResponse({ error: err.message });
      });
    return true;
  }
});

async function fetchGitHubDiff(config, branchContext) {
  if (!config.diffEnabled) {
    logMsg("Diff fetching disabled by config");
    return null;
  }
  if (!branchContext || !branchContext.owner || !branchContext.repo || !branchContext.baseBranch || !branchContext.headBranch) {
    logMsg("Cannot fetch diff: missing branch context - " + JSON.stringify(branchContext));
    return null;
  }

  var owner = branchContext.owner;
  var repo = branchContext.repo;
  var base = branchContext.baseBranch;
  var head = branchContext.headBranch;

  var namePattern = /^[a-zA-Z0-9_.-]+$/;
  if (!namePattern.test(owner) || !namePattern.test(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/compare/" + encodeURIComponent(base) + "..." + encodeURIComponent(head);

  logMsg("Fetching diff from: " + url);

  var headers = {
    "Accept": "application/vnd.github.v3.diff",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }

  try {
    var response = await fetch(url, { method: "GET", headers: headers });
    logMsg("GitHub API response status: " + response.status);

    if (response.status === 404) {
      logMsg("GitHub API 404 - repo/compare not found (may need PAT for private repo)");
      return { error: "GITHUB_404" };
    }

    if (response.status === 403 || response.status === 429) {
      var rateLimitRemaining = response.headers.get("X-RateLimit-Remaining") || "unknown";
      var rateLimitReset = response.headers.get("X-RateLimit-Reset") || "unknown";
      logMsg("GitHub API rate limited - remaining: " + rateLimitRemaining + ", reset: " + rateLimitReset);
      return { error: "GITHUB_RATE_LIMITED", rateLimitRemaining: rateLimitRemaining };
    }

    if (!response.ok) {
      var errText = await response.text();
      logMsg("GitHub API error: " + response.status + " - " + errText.substring(0, 200));
      return { error: "GITHUB_API_ERROR", status: response.status };
    }

    var diffText = await response.text();
    logMsg("Fetched diff, raw length: " + diffText.length + " bytes");

    var trimmed = truncateDiff(diffText, config.diffMaxLines, config.diffMaxBytes);
    var hunkRanges = parseHunkLineRanges(trimmed);
    logMsg("Trimmed diff length: " + trimmed.length + " bytes, " + Object.keys(hunkRanges).length + " files with hunks");
    return { diff: trimmed, hunks: hunkRanges };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (network): " + fetchErr.message);
    return { error: "GITHUB_NETWORK_ERROR", message: fetchErr.message };
  }
}

function parseHunkLineRanges(diffText) {
  var hunksByFile = {};
  var currentFile = null;
  var lines = diffText.split("\n");
  var warnedGitDiffMissing = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // Match diff file header:
    // diff --git a/path b/path, --- a/path, +++ b/path, or rename/path
    var fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[2]; // Use b/ path for git diff
      if (!hunksByFile[currentFile]) hunksByFile[currentFile] = [];
      continue;
    }

    // Match new file mode:
    var newFileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (newFileMatch) {
      // This might show in a new file diff without diff --git
      if (currentFile === null) {
        currentFile = newFileMatch[1];
        if (!hunksByFile[currentFile]) hunksByFile[currentFile] = [];
      }
      continue;
    }

    // Match single file diff header in PR compare interface:
    var prFileMatch = line.match(/^diff --(\S+)/);
    if (prFileMatch && currentFile === null) {
      // Extract the filename from the next line or b/ separator
      i++;
      var nextLine = lines[i] || "";
      var fileFromPR = nextLine.match(/^\+\+\+ b\/(.+)$/);
      if (fileFromPR) {
        currentFile = fileFromPR[1];
        if (!hunksByFile[currentFile]) hunksByFile[currentFile] = [];
      }
      continue;
    }

    // Match hunk header: @@ -leftStart,leftCount +rightStart,rightCount @@
    var hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (hunkMatch && currentFile) {
      var rightStart = parseInt(hunkMatch[3], 10);
      var rightCount = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

      hunksByFile[currentFile].push({
        rightStart: rightStart,
        rightCount: rightCount
      });
    }
  }

  return hunksByFile;
}

function truncateDiff(diffText, maxLines, maxBytes) {
  var lines = diffText.split("\n");
  var totalLines = lines.length;

  if (diffText.length <= maxBytes && totalLines <= maxLines) {
    return diffText;
  }

  var result = [];
  var byteCount = 0;
  var encoder = new TextEncoder();

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var lineBytes = encoder.encode(line).length + 1;

    if (result.length >= maxLines || (byteCount + lineBytes) > maxBytes) {
      var remaining = totalLines - i;
      result.push("... (truncated, " + remaining + " more lines)");
      break;
    }

    result.push(line);
    byteCount += lineBytes;
  }

  return result.join("\n");
}

async function fetchPRDetails(config, owner, repo, prNumber) {
  var namePattern = /^[a-zA-Z0-9_.-]+$/;
  if (!namePattern.test(owner) || !namePattern.test(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber;
  logMsg("Fetching PR details from: " + url);

  var headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }

  try {
    var response = await fetch(url, { method: "GET", headers: headers });
    if (!response.ok) {
      var errText = await response.text();
      logMsg("GitHub API error fetching PR details: " + response.status + " - " + errText.substring(0, 200));
      return { error: "GITHUB_API_ERROR", status: response.status };
    }
    var prData = await response.json();
    logMsg("Fetched PR details - title: " + prData.title + ", base: " + (prData.base && prData.base.ref) + ", head: " + (prData.head && prData.head.ref));
    return {
      title: prData.title || "",
      body: prData.body || "",
      baseBranch: prData.base && prData.base.ref ? prData.base.ref : "",
      headBranch: prData.head && prData.head.ref ? prData.head.ref : "",
      additions: prData.additions || 0,
      deletions: prData.deletions || 0,
      changedFiles: prData.changed_files || 0
    };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR details): " + fetchErr.message);
    return { error: "GITHUB_NETWORK_ERROR", message: fetchErr.message };
  }
}

async function fetchPRCommits(config, owner, repo, prNumber) {
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber + "/commits";
  logMsg("Fetching PR commits from: " + url);

  var headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }

  try {
    var response = await fetch(url, { method: "GET", headers: headers });
    if (!response.ok) {
      var errText = await response.text();
      logMsg("GitHub API error fetching PR commits: " + response.status + " - " + errText.substring(0, 200));
      return { error: "GITHUB_API_ERROR", status: response.status };
    }
    var commitsData = await response.json();
    var commits = commitsData.map(function (c) {
      return { message: c.commit && c.commit.message ? c.commit.message : "" };
    });
    logMsg("Fetched " + commits.length + " PR commits");
    return { commits: commits };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR commits): " + fetchErr.message);
    return { error: "GITHUB_NETWORK_ERROR", message: fetchErr.message };
  }
}

async function fetchPRFiles(config, owner, repo, prNumber) {
  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber + "/files";
  logMsg("Fetching PR files from: " + url);

  var headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }

  try {
    var response = await fetch(url, { method: "GET", headers: headers });
    if (!response.ok) {
      var errText = await response.text();
      logMsg("GitHub API error fetching PR files: " + response.status + " - " + errText.substring(0, 200));
      return { error: "GITHUB_API_ERROR", status: response.status };
    }
    var filesData = await response.json();
    var files = filesData.map(function (f) {
      var type = "modified";
      if (f.status === "added") type = "added";
      else if (f.status === "removed") type = "removed";
      else if (f.status === "renamed") type = "renamed";
      return {
        path: f.filename || "",
        type: type,
        additions: f.additions || 0,
        deletions: f.deletions || 0,
        diffAnchor: ""
      };
    });
    logMsg("Fetched " + files.length + " PR files");
    return { files: files };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR files): " + fetchErr.message);
    return { error: "GITHUB_NETWORK_ERROR", message: fetchErr.message };
  }
}

async function updatePRField(config, owner, repo, prNumber, fields) {
  if (!config.githubToken) {
    logMsg("No GitHub token configured for PR update");
    return { error: "GITHUB_NO_TOKEN" };
  }

  var namePattern = /^[a-zA-Z0-9_.-]+$/;
  if (!namePattern.test(owner) || !namePattern.test(repo)) {
    logMsg("Invalid owner or repo name - owner: " + owner + ", repo: " + repo);
    return { error: "GITHUB_INVALID_CONTEXT" };
  }

  var url = "https://api.github.com/repos/" + owner + "/" + repo + "/pulls/" + prNumber;
  logMsg("Updating PR via PATCH: " + url + " fields: " + Object.keys(fields).join(", "));

  var headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "github-pr-generator-extension",
    "Authorization": "Bearer " + config.githubToken,
    "Content-Type": "application/json"
  };

  try {
    var response = await fetch(url, {
      method: "PATCH",
      headers: headers,
      body: JSON.stringify(fields)
    });
    if (!response.ok) {
      var errText = await response.text();
      logMsg("GitHub API error updating PR: " + response.status + " - " + errText.substring(0, 200));
      if (response.status === 403) {
        return { error: "GITHUB_403", message: "GitHub PAT may lack repo scope or insufficient permissions." };
      }
      if (response.status === 422) {
        return { error: "GITHUB_422", message: "Validation failed: " + errText.substring(0, 200) };
      }
      return { error: "GITHUB_API_ERROR", status: response.status, message: errText.substring(0, 200) };
    }
    var result = await response.json();
    logMsg("PR updated successfully - title: " + result.title);
    return { success: true, title: result.title, body: result.body };
  } catch (fetchErr) {
    logMsg("GitHub API fetch error (PR update): " + fetchErr.message);
    return { error: "GITHUB_NETWORK_ERROR", message: fetchErr.message };
  }
}

function makeGitHubHeaders(config) {
  var headers = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }
  return headers;
}

async function handleGenerate(data) {
  logMsg("handleGenerate - commits: " + (data.commits ? data.commits.length : 0) + ", files: " + (data.fileChanges ? data.fileChanges.length : 0) + ", hasBranchContext: " + !!(data.branchContext && data.branchContext.owner));

  var config = await getConfig();
  var configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

    var diffResult = await fetchGitHubDiff(config, data.branchContext || {});
    var diffText = null;
    var hunkRanges = null;
    if (diffResult && diffResult.diff) {
      diffText = diffResult.diff;
      hunkRanges = diffResult.hunks;
      logMsg("Diff included in prompt, length: " + diffText.length + ", hunks: " + (hunkRanges ? Object.keys(hunkRanges).length : 0) + " files");
    } else if (diffResult && diffResult.error) {
      logMsg("Diff fetch returned error: " + diffResult.error + " — continuing without diff");
      if (diffResult.error === "GITHUB_404" && !config.githubToken) {
        logMsg("Hint: Private repo requires GitHub PAT. Suggesting user to configure it.");
      } else if (diffResult.error === "GITHUB_RATE_LIMITED") {
        logMsg("Hint: GitHub API rate limit hit. Suggesting user to add GitHub PAT for higher limits.");
      }
    }

    var changesSummary = buildChangesSummary(data, diffText, hunkRanges);
  logMsg("Built changesSummary, length: " + changesSummary.length);

  var combinedPrompt = buildCombinedPrompt(changesSummary, data.existingBody || "");
  logMsg("Built combinedPrompt, length: " + combinedPrompt.length);

  logMsg("Generating title + description in single call...");
  var result = await callAPI(config, combinedPrompt);
  logMsg("API result length: " + result.length);

  var parsed = parseCombinedResponse(result);
  logMsg("Parsed - title: " + parsed.title + ", description length: " + parsed.description.length);

  return parsed;
}

async function handleGenerateTitle(data) {
  logMsg("handleGenerateTitle - owner: " + (data.owner || "") + ", repo: " + (data.repo || "") + ", prNumber: " + (data.prNumber || ""));

  var config = await getConfig();
  var configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

  if (!config.githubToken) {
    throw new Error("GitHub Personal Access Token is required to update PR title. Set it in config.local.json or extension popup (needs 'repo' scope).");
  }

  var owner = data.owner || "";
  var repo = data.repo || "";
  var prNumber = data.prNumber || "";

  var prDetails = await fetchPRDetails(config, owner, repo, prNumber);
  if (prDetails.error) {
    throw new Error("Failed to fetch PR details: " + prDetails.error);
  }

  var prCommits = await fetchPRCommits(config, owner, repo, prNumber);
  var commits = prCommits.commits || [];

  var prFiles = await fetchPRFiles(config, owner, repo, prNumber);
  var fileChanges = prFiles.files || [];

  var branchContext = {
    owner: owner,
    repo: repo,
    baseBranch: prDetails.baseBranch,
    headBranch: prDetails.headBranch
  };

  var diffResult = await fetchGitHubDiff(config, branchContext);
  var diffText = null;
  var hunkRanges = null;
  if (diffResult && diffResult.diff) {
    diffText = diffResult.diff;
    hunkRanges = diffResult.hunks;
  }

  var linkedIssues = [];
  commits.forEach(function (c) {
    var patterns = [
      /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
      /#([1-9]\d{2,})/g
    ];
    patterns.forEach(function (pat) {
      var match;
      while ((match = pat.exec(c.message)) !== null) {
        if (linkedIssues.indexOf("#" + match[1]) === -1) {
          linkedIssues.push("#" + match[1]);
        }
      }
    });
  });

  var stats = {
    files: prDetails.changedFiles || fileChanges.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0
  };

  var changesSummaryData = {
    commits: commits,
    fileChanges: fileChanges,
    stats: stats,
    branchContext: branchContext,
    linkedIssues: linkedIssues,
    existingBody: prDetails.body || ""
  };

  var changesSummary = buildChangesSummary(changesSummaryData, diffText, hunkRanges);
  logMsg("handleGenerateTitle - built changesSummary, length: " + changesSummary.length);

  var titlePrompt = buildTitleOnlyPrompt(changesSummary, prDetails.title || data.existingTitle || "");
  logMsg("handleGenerateTitle - built titlePrompt, length: " + titlePrompt.length);

  var llmResult = await callAPI(config, titlePrompt);
  var newTitle = parseTitleOnlyResponse(llmResult);
  logMsg("handleGenerateTitle - parsed title: " + newTitle);

  var updateResult = await updatePRField(config, owner, repo, prNumber, { title: newTitle });
  if (updateResult.error) {
    if (updateResult.error === "GITHUB_NO_TOKEN") {
      throw new Error("GitHub Personal Access Token is required to update PR title. Set it in config.local.json or extension popup (needs 'repo' scope).");
    }
    throw new Error("Failed to update PR title: " + (updateResult.message || updateResult.error));
  }

  return { title: newTitle, updated: true };
}

async function handleGenerateDescription(data) {
  logMsg("handleGenerateDescription - owner: " + (data.owner || "") + ", repo: " + (data.repo || "") + ", prNumber: " + (data.prNumber || ""));

  var config = await getConfig();
  var configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

  if (!config.githubToken) {
    throw new Error("GitHub Personal Access Token is required to update PR description. Set it in config.local.json or extension popup (needs 'repo' scope).");
  }

  var owner = data.owner || "";
  var repo = data.repo || "";
  var prNumber = data.prNumber || "";

  var prDetails = await fetchPRDetails(config, owner, repo, prNumber);
  if (prDetails.error) {
    throw new Error("Failed to fetch PR details: " + prDetails.error);
  }

  var prCommits = await fetchPRCommits(config, owner, repo, prNumber);
  var commits = prCommits.commits || [];

  var prFiles = await fetchPRFiles(config, owner, repo, prNumber);
  var fileChanges = prFiles.files || [];

  var branchContext = {
    owner: owner,
    repo: repo,
    baseBranch: prDetails.baseBranch,
    headBranch: prDetails.headBranch
  };

  var diffResult = await fetchGitHubDiff(config, branchContext);
  var diffText = null;
  var hunkRanges = null;
  if (diffResult && diffResult.diff) {
    diffText = diffResult.diff;
    hunkRanges = diffResult.hunks;
  }

  var linkedIssues = [];
  commits.forEach(function (c) {
    var patterns = [
      /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
      /#([1-9]\d{2,})/g
    ];
    patterns.forEach(function (pat) {
      var match;
      while ((match = pat.exec(c.message)) !== null) {
        if (linkedIssues.indexOf("#" + match[1]) === -1) {
          linkedIssues.push("#" + match[1]);
        }
      }
    });
  });

  var stats = {
    files: prDetails.changedFiles || fileChanges.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0
  };

  var existingTitle = prDetails.title || data.existingTitle || "";
  var existingDescription = data.existingDescription || prDetails.body || "";

  var changesSummaryData = {
    commits: commits,
    fileChanges: fileChanges,
    stats: stats,
    branchContext: branchContext,
    linkedIssues: linkedIssues,
    existingBody: existingDescription
  };

  var changesSummary = buildChangesSummary(changesSummaryData, diffText, hunkRanges);
  logMsg("handleGenerateDescription - built changesSummary, length: " + changesSummary.length);

  var descPrompt = buildDescriptionOnlyPrompt(changesSummary, existingTitle, existingDescription);
  logMsg("handleGenerateDescription - built descPrompt, length: " + descPrompt.length);

  var llmResult = await callAPI(config, descPrompt);
  var newDescription = parseDescriptionOnlyResponse(llmResult);
  logMsg("handleGenerateDescription - parsed description length: " + newDescription.length);

  var updateResult = await updatePRField(config, owner, repo, prNumber, { body: newDescription });
  if (updateResult.error) {
    if (updateResult.error === "GITHUB_NO_TOKEN") {
      throw new Error("GitHub Personal Access Token is required to update PR description. Set it in config.local.json or extension popup (needs 'repo' scope).");
    }
    throw new Error("Failed to update PR description: " + (updateResult.message || updateResult.error));
  }

  return { body: newDescription, updated: true };
}

async function handleGenerateMergeTitle(data) {
  logMsg("handleGenerateMergeTitle - owner: " + (data.owner || "") + ", repo: " + (data.repo || "") + ", prNumber: " + (data.prNumber || ""));

  var config = await getConfig();
  var configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

  var owner = data.owner || "";
  var repo = data.repo || "";
  var prNumber = data.prNumber || "";

  var prDetails = await fetchPRDetails(config, owner, repo, prNumber);
  if (prDetails.error) {
    throw new Error("Failed to fetch PR details: " + prDetails.error);
  }

  var prCommits = await fetchPRCommits(config, owner, repo, prNumber);
  var commits = prCommits.commits || [];

  var prFiles = await fetchPRFiles(config, owner, repo, prNumber);
  var fileChanges = prFiles.files || [];

  var branchContext = {
    owner: owner,
    repo: repo,
    baseBranch: prDetails.baseBranch,
    headBranch: prDetails.headBranch
  };

  var diffResult = await fetchGitHubDiff(config, branchContext);
  var diffText = null;
  var hunkRanges = null;
  if (diffResult && diffResult.diff) {
    diffText = diffResult.diff;
    hunkRanges = diffResult.hunks;
  }

  var stats = {
    files: prDetails.changedFiles || fileChanges.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0
  };

  var changesSummaryData = {
    commits: commits,
    fileChanges: fileChanges,
    stats: stats,
    branchContext: branchContext,
    linkedIssues: [],
    existingBody: prDetails.body || ""
  };

  var changesSummary = buildChangesSummary(changesSummaryData, diffText, hunkRanges);
  logMsg("handleGenerateMergeTitle - built changesSummary, length: " + changesSummary.length);

  var mergeTitlePrompt = buildMergeTitlePrompt(changesSummary, data.existingTitle || prDetails.title || "", data.existingMergeTitle || "");
  logMsg("handleGenerateMergeTitle - built mergeTitlePrompt, length: " + mergeTitlePrompt.length);

  var llmResult = await callAPI(config, mergeTitlePrompt);
  var newTitle = parseTitleOnlyResponse(llmResult);
  logMsg("handleGenerateMergeTitle - parsed title: " + newTitle);

  return { title: newTitle };
}

async function handleGenerateMergeDescription(data) {
  logMsg("handleGenerateMergeDescription - owner: " + (data.owner || "") + ", repo: " + (data.repo || "") + ", prNumber: " + (data.prNumber || ""));

  var config = await getConfig();
  var configError = validateConfig(config);
  if (configError) {
    logMsg("Config validation failed: " + configError);
    throw new Error(configError);
  }

  var owner = data.owner || "";
  var repo = data.repo || "";
  var prNumber = data.prNumber || "";

  var prDetails = await fetchPRDetails(config, owner, repo, prNumber);
  if (prDetails.error) {
    throw new Error("Failed to fetch PR details: " + prDetails.error);
  }

  var prCommits = await fetchPRCommits(config, owner, repo, prNumber);
  var commits = prCommits.commits || [];

  var prFiles = await fetchPRFiles(config, owner, repo, prNumber);
  var fileChanges = prFiles.files || [];

  var branchContext = {
    owner: owner,
    repo: repo,
    baseBranch: prDetails.baseBranch,
    headBranch: prDetails.headBranch
  };

  var diffResult = await fetchGitHubDiff(config, branchContext);
  var diffText = null;
  var hunkRanges = null;
  if (diffResult && diffResult.diff) {
    diffText = diffResult.diff;
    hunkRanges = diffResult.hunks;
  }

  var stats = {
    files: prDetails.changedFiles || fileChanges.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0
  };

  var existingTitle = data.existingTitle || prDetails.title || "";
  var existingMergeTitle = data.existingMergeTitle || "";
  var existingDescription = data.existingDescription || prDetails.body || "";
  var existingMergeDesc = data.existingMergeDescription || "";

  var changesSummaryData = {
    commits: commits,
    fileChanges: fileChanges,
    stats: stats,
    branchContext: branchContext,
    linkedIssues: [],
    existingBody: existingDescription
  };

  var changesSummary = buildChangesSummary(changesSummaryData, diffText, hunkRanges);
  logMsg("handleGenerateMergeDescription - built changesSummary, length: " + changesSummary.length);

  var mergeDescPrompt = buildMergeDescriptionPrompt(changesSummary, existingTitle, existingDescription, existingMergeTitle, existingMergeDesc);
  logMsg("handleGenerateMergeDescription - built mergeDescPrompt, length: " + mergeDescPrompt.length);

  var llmResult = await callAPI(config, mergeDescPrompt);
  var newDescription = parseDescriptionOnlyResponse(llmResult);
  logMsg("handleGenerateMergeDescription - parsed description length: " + newDescription.length);

  return { description: newDescription };
}

function buildMergeTitlePrompt(changesSummary, existingTitle, existingMergeTitle) {
  var prompt = "Generate ONLY a GitHub merge commit title for the following pull request changes.\n\n";
  prompt += "A merge commit title summarizes what the entire PR accomplishes in a single line. It typically follows conventional commit format.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += "## PR Title\nThe pull request title is: \"" + existingTitle + "\"\n";
    prompt += "Use this as a reference. The merge commit title can be similar but should be a clean, concise summary suitable for the git history.\n\n";
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt += "## Existing Merge Commit Title\nThe current merge commit title is: \"" + existingMergeTitle + "\"\nGenerate an improved version.\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the merge commit title on a single line. No quotes, no markdown, no prefix like \"Title:\", no description.\n";
  prompt += "Use conventional commit format (e.g. \"feat: add JWT auth\", \"fix: resolve token expiry\", \"refactor: extract validation logic\"). Under 72 characters.\n\n";
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += "- The merge commit title should summarize the overall change concisely\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT include any description or body text, ONLY the title\n";
  prompt += "- Do NOT include PR number or branch name in the title\n";

  return prompt;
}

function buildMergeDescriptionPrompt(changesSummary, existingTitle, existingDescription, existingMergeTitle, existingMergeDesc) {
  var prompt = "Generate ONLY a GitHub merge commit extended description for the following pull request changes.\n\n";
  prompt += "A merge commit extended description provides additional context about the change beyond the title. It should be concise but informative for someone reading the git log.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += "## PR Title\nThe pull request title is: \"" + existingTitle + "\"\n\n";
  }

  if (existingMergeTitle && existingMergeTitle.trim().length > 0) {
    prompt += "## Merge Commit Title\nThe merge commit title is: \"" + existingMergeTitle + "\"\n\n";
  }

  if (existingDescription && existingDescription.trim().length > 0) {
    prompt += "## PR Description\nThe pull request description is:\n\n" + existingDescription + "\n\n";
  }

  if (existingMergeDesc && existingMergeDesc.trim().length > 0) {
    prompt += "## Existing Merge Commit Description\nThe current merge commit description is:\n\n" + existingMergeDesc + "\nGenerate an improved version.\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the merge commit extended description as plain text or simple markdown. Do NOT include a title line.\n\n";
  prompt += "Guidelines:\n";
  prompt += "- Summarize the key changes and their motivation\n";
  prompt += "- Mention important implementation details a future reader would need\n";
  prompt += "- Reference specific function names, components, or modules changed\n";
  prompt += "- Keep it concise (typically 3-10 lines)\n";
  prompt += "- Do NOT include diff hunk references — this is for the git log, not the PR page\n\n";
  prompt += "RULES:\n";
  prompt += "- Do NOT start with filler like \"This PR introduces...\" or \"In this pull request...\"\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT add meta-commentary about the description itself\n";
  prompt += "- Do NOT output a title line — output ONLY the description body\n";

  return prompt;
}

function parseCombinedResponse(text) {
  var title = "";
  var description = "";

  text = text.replace(/^```[\w]*\n?/, "").replace(/\n?```\s*$/, "");

  var doubleNewlineIdx = text.indexOf("\n\n");
  if (doubleNewlineIdx !== -1) {
    title = text.substring(0, doubleNewlineIdx).trim();
    description = text.substring(doubleNewlineIdx + 2).trim();
  } else {
    var firstNewlineIdx = text.indexOf("\n");
    if (firstNewlineIdx !== -1) {
      title = text.substring(0, firstNewlineIdx).trim();
      description = text.substring(firstNewlineIdx + 1).trim();
    } else {
      title = text.trim();
      description = "";
    }
  }

  title = title.replace(/^["'`]+|["'`]+$/g, "");
  title = title.replace(/^#+\s*/, "");
  title = title.replace(/^\*\*|\*\*$/g, "");
  title = title.replace(/^Title:\s*/i, "");
  title = title.trim();

  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }

  return { title: title, description: description };
}

function buildTitleOnlyPrompt(changesSummary, existingTitle) {
  var prompt = "Generate ONLY a GitHub pull request title for the following changes. Do NOT generate a description.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += "## Existing Title\nThe current title is: \"" + existingTitle + "\"\nGenerate an improved version.\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the PR title on a single line. No quotes, no markdown, no prefix like \"Title:\", no description.\n";
  prompt += "Use conventional commit format (e.g. \"feat: add JWT auth\", \"fix: resolve token expiry\", \"refactor: extract validation logic\"). Under 72 characters.\n\n";
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT include any description or body text, ONLY the title\n";

  return prompt;
}

function buildDescriptionOnlyPrompt(changesSummary, existingTitle, existingDescription) {
  var prompt = "Generate ONLY a GitHub pull request description for the following changes. The title is already set and should NOT be changed.\n\n";
  prompt += changesSummary + "\n";

  if (existingTitle && existingTitle.trim().length > 0) {
    prompt += "## Current Title\nThe PR title is: \"" + existingTitle + "\"\n\n";
  }

  if (existingDescription && existingDescription.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt += "The user already has the following content in the description field. Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n";
    prompt += existingDescription + "\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "Output ONLY the PR description body as structured markdown. Do NOT include a title line.\n\n";

  if (!existingDescription || existingDescription.trim().length === 0) {
    prompt += "Use these sections (omit sections that would be empty):\n\n";
  prompt += "## Summary\n";
  prompt += "A 2-4 sentence overview of what this PR does and why the change is needed.\n\n";
  prompt += "## Changes\n";
  prompt += "Grouped by category or area. Include specific details drawn from the diff — mention function names, variable names, and what was added/removed/modified and why. Do NOT just list files; explain the changes. **For each file mentioned, add at least one diff hunk reference using the format from the Anchors section.**\n\n";
  prompt += "## Walkthrough\n";
  prompt += "File-by-file list of key changes. **Each entry has:** (1) the file path wrapped in backticks, (2) a 1-2 sentence description of what changed, and (3) a diff hunk reference link. Example: `frontend/app/globals.css` — Updated CSS variables for theme consistency. [[1]](diffhunk://#diff-4a5d3f2_L10-R25)\n\n";
  prompt += "## Testing\n";
  prompt += "How a reviewer can test or verify these changes. Include specific steps if inferable from the diff.\n\n";
  prompt += "## Breaking Changes\n";
  prompt += "Any API changes, removed functions, renamed exports, or behavioral changes consumers need to know about. **Include diff hunk references for changed APIs.** Omit this section if there are none.\n\n";
  prompt += "## Linked Issues\n";
  prompt += "List any issue references from the commit messages. Omit if none.\n\n";
  }
  prompt += "RULES:\n";
  prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
  prompt += "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file.\n";
  prompt += "- Do NOT start with filler like \"This PR introduces...\" or \"In this pull request...\"\n";
  prompt += "- Do NOT wrap the output in backtick fences\n";
  prompt += "- Do NOT add meta-commentary about the description itself\n";
  prompt += "- Do NOT output a title line — output ONLY the description body\n";
  prompt += "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n";

  return prompt;
}

function parseTitleOnlyResponse(text) {
  text = text.replace(/^```[\w]*\n?/, "").replace(/\n?```\s*$/, "");
  var title = text.trim();
  title = title.replace(/^["'`]+|["'`]+$/g, "");
  title = title.replace(/^#+\s*/, "");
  title = title.replace(/^\*\*|\*\*$/g, "");
  title = title.replace(/^Title:\s*/i, "");
  title = title.trim();
  var newlineIdx = title.indexOf("\n");
  if (newlineIdx !== -1) {
    title = title.substring(0, newlineIdx).trim();
  }
  if (title.length > 100) {
    title = title.substring(0, 100).trim();
  }
  return title;
}

function parseDescriptionOnlyResponse(text) {
  text = text.replace(/^```[\w]*\n?/, "").replace(/\n?```\s*$/, "");
  var description = text.trim();
  description = description.replace(/^Title:.*\n?/i, "");
  var firstLine = description.split("\n")[0] || "";
  if (/^[^:]{1,50}:/i.test(firstLine) && firstLine.length < 80 && !firstLine.startsWith("#") && !firstLine.startsWith("-") && !firstLine.startsWith("*")) {
    description = description.substring(firstLine.length).trim();
  }
  return description;
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
          { role: "system", content: SYSTEM_PROMPT },
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

var SYSTEM_PROMPT = [
  "You are an expert software engineer who writes detailed, structured GitHub pull request descriptions.",
  "You analyze code diffs, commit messages, and change metadata to produce descriptions that help reviewers quickly understand what changed, why, and how to verify it.",
  "",
  "Your descriptions are:",
  "- Accurate and grounded in the actual code diff — you reference specific function names, class names, and variable names from the code",
  "- Structured with clear markdown sections",
  "- Concise but thorough — every significant change is mentioned",
  "- Actionable — reviewers know what to focus on and how to test",
  "",
  "When the description field already contains a PR template with headers, you respect those headers and fill in the sections rather than replacing the template."
].join("\n");

function buildChangesSummary(data, diffText, hunkRanges) {
  var summary = "";

  if (data.branchContext && (data.branchContext.owner || data.branchContext.baseBranch || data.branchContext.headBranch)) {
    summary += "## Repository\n\n";
    if (data.branchContext.owner && data.branchContext.repo) {
      summary += "- Repo: " + data.branchContext.owner + "/" + data.branchContext.repo + "\n";
    }
    if (data.branchContext.baseBranch && data.branchContext.headBranch) {
      summary += "- Branch: " + data.branchContext.headBranch + " \u2192 " + data.branchContext.baseBranch + "\n";
    } else if (data.branchContext.headBranch) {
      summary += "- Branch: " + data.branchContext.headBranch + "\n";
    }
    summary += "\n";
  }

  // Inject File Anchors and Hunk Line Ranges section
  if (data.fileChanges && data.fileChanges.length > 0) {
    var hasAnchors = false;
    data.fileChanges.forEach(function (fc) {
      if (fc.diffAnchor && fc.diffAnchor.length > 5) hasAnchors = true;
    });
    
    if (hunkRanges && Object.keys(hunkRanges).length > 0 || hasAnchors) {
      summary += "## File Anchors and Hunk Line Ranges\n\n";
      summary += "Use these attachment points to create clickable diff links. Format: `[[N]](diffhunk://#diff-HASH_Lstart-Rend)` where N is a sequential reference number.\n\n";
      
      var refNum = 1;
      var seenFiles = {};
      
      // Add hunk ranges with diff anchors from DOM scraping
      if (hasAnchors) {
        data.fileChanges.forEach(function (fc) {
          if (fc.diffAnchor && fc.diffAnchor.length > 5 && !seenFiles[fc.path]) {
            seenFiles[fc.path] = true;
            var anchor = fc.diffAnchor.replace(/^#/, "");
            // Enforce GitHub diff hash format: alphanumeric + hyphen exactly 40+ chars
            if (!/^[a-zA-Z0-9_-]{40,}$/.test(anchor)) {
              logMsg("buildChangesSummary - invalid diff anchor skipped: " + fc.diffAnchor);
              return;
            }
            summary += "- " + refNum + ". [`" + fc.path + "`](diffhunk://" + anchor + ")\n";
          if (hunkRanges && hunkRanges[fc.path]) {
            hunkRanges[fc.path].forEach(function (hunk) {
              var rightEnd = hunk.rightStart + hunk.rightCount - 1;
              // Always format as L<start>-R<end> — even for single lines to avoid ambiguity
              summary += "    " + ": [[" + refNum + "]](diffhunk://" + anchor + "_L" + hunk.rightStart + "-R" + rightEnd + ") — lines " + hunk.rightStart + (hunk.rightCount > 1 ? "-" + rightEnd : "") + "\n";
              refNum++;
            });
          }

          // Skip file-only link emission — GitHub only supports hunk-scoped links
            refNum++;
          }
        });
      }
      
        // Add hunk ranges for files found in diff but missing diffAnchor
        if (hunkRanges && Object.keys(hunkRanges).length > 0) {
          Object.keys(hunkRanges).forEach(function (filePath) {
            var fileHunks = hunkRanges[filePath];
            if (!seenFiles[filePath]) {
              fileHunks.forEach(function (hunk) {
                var rightEnd = hunk.rightStart + hunk.rightCount - 1;
                summary += "- " + refNum + ". `" + filePath + "`: [[" + refNum + "]](diffhunk://L" + hunk.rightStart + "-R" + rightEnd + ") — lines " + hunk.rightStart + (hunk.rightCount > 1 ? "-" + rightEnd : "") + "\n";
                refNum++;
              });
            }
          });
        }
      
      summary += "\n**Diff Link Examples**\n";
      summary += "- Changes to `src/auth.ts`: `frontend/src/auth.ts` — Added token validation. [[1]](diffhunk://#diff-4a5d3f2_L5-R25)\n";
      summary += "- Multiple hunks: `frontend/app/globals.css` — Updated theme variables. [[2]](diffhunk://#diff-b688a52_L10-R30), [[3]](diffhunk://#diff-b688a52_L40-R80)\n";
    }
  }

  summary += "## Commits\n\n";
  if (data.commits && data.commits.length > 0) {
    for (var i = 0; i < data.commits.length; i++) {
      summary += "- " + data.commits[i].message + "\n";
    }
  } else {
    summary += "(No commit information available)\n";
  }

  if (data.linkedIssues && data.linkedIssues.length > 0) {
    summary += "\n## Linked Issues\n\n";
    for (var j = 0; j < data.linkedIssues.length; j++) {
      summary += "- " + data.linkedIssues[j] + "\n";
    }
  }

  if (diffText) {
    summary += "\n## Diff\n\n";
    summary += diffText + "\n";
  }

  summary += "\n## Changed Files\n\n";
  if (data.fileChanges && data.fileChanges.length > 0) {
    for (var k = 0; k < data.fileChanges.length; k++) {
      var file = data.fileChanges[k];
      var indicator = file.type === "added" ? "[+]" : file.type === "removed" ? "[-]" : file.type === "renamed" ? "[~]" : "[m]";
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

function buildCombinedPrompt(changesSummary, existingBody) {
  var prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += changesSummary + "\n";

  if (existingBody && existingBody.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt += "The user already has the following content in the description field. Respect its structure \u2014 keep its headers, fill in its sections, and do not remove any existing content:\n\n";
    prompt += existingBody + "\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt += "1. First line: PR title only (conventional commit format, e.g. \"feat: add JWT auth\", \"fix: resolve token expiry\", \"refactor: extract validation logic\"). Under 72 characters. No quotes, no markdown, no prefix like \"Title:\".\n";
  prompt += "2. Empty line.\n";
  prompt += "3. PR description body as structured markdown.\n\n";

  if (!existingBody || existingBody.trim().length === 0) {
    prompt += "Use these sections (omit sections that would be empty):\n\n";
  prompt += "## Summary\n";
  prompt += "A 2-4 sentence overview of what this PR does and why the change is needed.\n\n";
  prompt += "## Changes\n";
  prompt += "Grouped by category or area. Include specific details drawn from the diff — mention function names, variable names, and what was added/removed/modified and why. Do NOT just list files; explain the changes. **For each file mentioned, add at least one diff hunk reference using the format from the Anchors section.**\n\n";
  prompt += "## Walkthrough\n";
  prompt += "File-by-file list of key changes. **Each entry has:** (1) the file path wrapped in backticks, (2) a 1-2 sentence description of what changed, and (3) a diff hunk reference link. Example: `frontend/app/globals.css` — Updated CSS variables for theme consistency. [[1]](diffhunk://#diff-4a5d3f2_L10-R25)\n\n";
  prompt += "## Testing\n";
  prompt += "How a reviewer can test or verify these changes. Include specific steps if inferable from the diff.\n\n";
  prompt += "## Breaking Changes\n";
  prompt += "Any API changes, removed functions, renamed exports, or behavioral changes consumers need to know about. **Include diff hunk references for changed APIs.** Omit this section if there are none.\n\n";
  prompt += "## Linked Issues\n";
  prompt += "List any issue references from the commit messages. Omit if none.\n\n";
  }
prompt += "RULES:\n";
prompt += "- Be specific — reference actual code entities from the diff, not generic descriptions\n";
prompt += "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file.\n";
prompt += "- Do NOT start with filler like \"This PR introduces...\" or \"In this pull request...\"\n";
prompt += "- Do NOT wrap the output in backtick fences\n";
prompt += "- Do NOT add meta-commentary about the description itself\n";
prompt += "- **Examples**:";
prompt += "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n";
prompt += "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n";
prompt += "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n";
prompt += "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n";

  return prompt;
}
