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
              continue;
            }
            summary += "- " + refNum + ". [`" + fc.path + "`](diffhunk://" + anchor + ")\n";
          if (hunkRanges && hunksByFile[fc.path]) {
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
