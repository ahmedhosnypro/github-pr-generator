#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.local.json');

function loadConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Failed to load config.local.json:', e.message);
    process.exit(1);
  }
}

function runGhCommand(args) {
  try {
    const result = execSync(`gh ${args}`, { encoding: 'utf-8', stdio: 'pipe' });
    return result.trim();
  } catch (e) {
    console.error(`gh command failed: ${e.message}`);
    if (e.stdout) console.error('stdout:', e.stdout.toString());
    if (e.stderr) console.error('stderr:', e.stderr.toString());
    throw e;
  }
}

async function fetchPRDetails(config) {
  const { owner, repo, number } = config.testPr;
  const json = runGhCommand(`pr view ${number} --repo ${owner}/${repo} --json number,title,body,headRefName,baseRefName,commits,files,additions,deletions`);
  return JSON.parse(json);
}

async function fetchPRCommits(config) {
  const { owner, repo, number } = config.testPr;
  const json = runGhCommand(`pr view ${number} --repo ${owner}/${repo} --json commits`);
  const data = JSON.parse(json);
  return data.commits.map(c => c.messageHeadline + '\n\n' + (c.messageBody || ''));
}

async function fetchPRFiles(config) {
  const { owner, repo, number } = config.testPr;
  const json = runGhCommand(`pr view ${number} --repo ${owner}/${repo} --json files`);
  const data = JSON.parse(json);
  return data.files;
}

async function fetchPRDiff(config) {
  const { owner, repo, number } = config.testPr;
  const prDetails = await fetchPRDetails(config);
  const { baseRefName, headRefName } = prDetails;
  
  const url = `https://api.github.com/repos/${owner}/${repo}/compare/${encodeURIComponent(baseRefName)}...${encodeURIComponent(headRefName)}`;
  
  const headers = {
    "Accept": "application/vnd.github.v3.diff",
    "User-Agent": "github-pr-generator-extension"
  };
  if (config.githubToken) {
    headers["Authorization"] = "Bearer " + config.githubToken;
  }
  
  try {
    const response = await fetch(url, { method: "GET", headers: headers });
    if (!response.ok) {
      console.warn(`Diff fetch failed: ${response.status}`);
      return null;
    }
    return await response.text();
  } catch (e) {
    console.warn(`Diff fetch error: ${e.message}`);
    return null;
  }
}

// Copied from background.js - buildChangesSummary
function buildChangesSummary(data, diffText, hunkRanges) {
  var summary = "";
  summary += "## Commits\n";
  data.commits.forEach(function (c, i) {
    summary += (i + 1) + ". " + c.message + "\n\n";
  });
  summary += "## File Changes\n";
  data.fileChanges.forEach(function (f) {
    summary += "- " + f.path + " (" + f.type + "): +" + f.additions + "/-" + f.deletions;
    if (f.diffAnchor) summary += " [[" + f.diffAnchor + "]]";
    summary += "\n";
  });
  summary += "\n## Stats\n";
  summary += "- Files: " + data.stats.files + "\n";
  summary += "- Additions: " + data.stats.additions + "\n";
  summary += "- Deletions: " + data.stats.deletions + "\n";
  summary += "\n## Branch Context\n";
  summary += "- Base: " + data.branchContext.baseBranch + "\n";
  summary += "- Head: " + data.branchContext.headBranch + "\n";
  if (data.linkedIssues && data.linkedIssues.length > 0) {
    summary += "\n## Linked Issues\n";
    data.linkedIssues.forEach(function (issue) {
      summary += "- " + issue + "\n";
    });
  }
  if (diffText) {
    summary += "\n## Diff (truncated)\n";
    summary += diffText;
  }
  return summary;
}

// Copied from background.js - buildCombinedPrompt (used for PR creation page)
function buildCombinedPrompt(changesSummary, existingBody) {
  var prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += changesSummary + "\n";

  if (existingBody && existingBody.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt += "The user already has the following content in the description field. Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n";
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
    prompt += "## Commit Coverage\n";
    prompt += "**IMPORTANT: You MUST cover every commit listed in the '## Commits' section above.** For each commit, mention what it does and reference the relevant files/diffs. Do not skip any commits — even small fixes or infrastructure changes. Group related commits together if they address the same feature, but ensure every commit message is represented in the description.\n\n";
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

function extractLinkedIssues(commits) {
  const issues = {};
  const allMessages = commits.map(c => c).join('\n');
  const patterns = [
    /(?:fixes|resolves|closes|fix|resolve|close|addresses|address|references|refs|see|related\s+to)\s+#(\d+)/gi,
    /#([1-9]\d{2,})/g
  ];
  patterns.forEach(pat => {
    let match;
    while ((match = pat.exec(allMessages)) !== null) {
      issues['#' + match[1]] = true;
    }
  });
  return Object.keys(issues);
}

function parseHunkLineRanges(diffText) {
  var hunksByFile = {};
  var currentFile = null;
  var lines = diffText.split("\n");
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var fileMatch = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
    if (fileMatch) {
      currentFile = fileMatch[2];
      if (!hunksByFile[currentFile]) hunksByFile[currentFile] = [];
      continue;
    }
    var newFileMatch = line.match(/^\+\+\+ b\/(.+)$/);
    if (newFileMatch) {
      if (currentFile === null) {
        currentFile = newFileMatch[1];
        if (!hunksByFile[currentFile]) hunksByFile[currentFile] = [];
      }
      continue;
    }
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

async function testGeneratedDescriptionCoverage(config, prDetails) {
  const commits = await fetchPRCommits(config);
  const files = await fetchPRFiles(config);
  const diffText = await fetchPRDiff(config);
  const hunkRanges = diffText ? parseHunkLineRanges(diffText) : null;
  
  const stats = {
    files: prDetails.files?.length || 0,
    additions: prDetails.additions || 0,
    deletions: prDetails.deletions || 0
  };
  
  const branchContext = {
    baseBranch: prDetails.baseRefName,
    headBranch: prDetails.headRefName
  };
  
  const linkedIssues = extractLinkedIssues(commits);
  const existingBody = prDetails.body || '';
  
  const changesSummaryData = {
    commits: commits.map(c => ({ message: c })),
    fileChanges: files,
    stats: stats,
    branchContext: branchContext,
    linkedIssues: linkedIssues,
    existingBody: existingBody
  };
  
  const changesSummary = buildChangesSummary(changesSummaryData, diffText, hunkRanges);
  const prompt = buildCombinedPrompt(changesSummary, existingBody);
  
  console.log('\n=== Extension Prompt Analysis ===');
  console.log(`Prompt length: ${prompt.length} chars`);
  console.log(`Changes summary length: ${changesSummary.length} chars`);
  console.log(`Commits in prompt: ${commits.length}`);
  console.log(`Files in prompt: ${files.length}`);
  console.log(`Diff included: ${diffText ? 'Yes (' + diffText.length + ' chars)' : 'No'}`);
  console.log(`Existing body length: ${existingBody.length} chars`);
  
  // Check if all commits are mentioned in the changes summary
  let coveredInSummary = 0;
  commits.forEach((commit, i) => {
    const headline = commit.split('\n')[0].toLowerCase();
    const words = headline.split(/\s+/).filter(w => w.length > 3);
    const found = words.some(w => changesSummary.toLowerCase().includes(w));
    if (found) coveredInSummary++;
  });
  
  console.log(`\nCommits represented in changes summary: ${coveredInSummary}/${commits.length}`);
  
  // Check if the prompt explicitly mentions commit coverage requirement
  // Note: The extension only adds Commit Coverage section when there's NO existing body
  // (i.e., on PR creation page). For opened PRs with existing description, it uses the existing structure.
  const hasCommitCoverageSection = prompt.includes('Commit Coverage') && prompt.includes('MUST cover every commit');
  console.log(`Prompt includes Commit Coverage section: ${hasCommitCoverageSection ? 'Yes' : 'No'}`);
  console.log(`(Note: Only added when no existing description - this PR has existing body: ${existingBody.length > 0 ? 'Yes' : 'No'})`);
  
  // Now check the actual PR description for commit coverage
  const prDescription = prDetails.body || '';
  let coveredInDescription = 0;
  const coverageDetails = [];
  
  commits.forEach((commit, i) => {
    const headline = commit.split('\n')[0].toLowerCase();
    const words = headline.split(/\s+/).filter(w => w.length > 3);
    const found = words.some(w => prDescription.toLowerCase().includes(w));
    if (found) {
      coveredInDescription++;
      coverageDetails.push({ commit: i + 1, headline, covered: true });
    } else {
      coverageDetails.push({ commit: i + 1, headline, covered: false });
    }
  });
  
  console.log('\n=== PR Description Commit Coverage ===');
  coverageDetails.forEach(d => {
    const status = d.covered ? '✓ COVERED' : '✗ MISSING';
    console.log(`  ${status}: ${d.headline}`);
  });
  
  const coveragePercent = ((coveredInDescription / commits.length) * 100).toFixed(1);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Commits covered in PR description: ${coveredInDescription}/${commits.length} (${coveragePercent}%)`);
  console.log(`Extension prompt includes all commits: ${coveredInSummary === commits.length ? 'Yes' : 'No'}`);
  console.log(`Prompt has Commit Coverage instruction: ${hasCommitCoverageSection ? 'Yes' : 'No'} (expected: ${existingBody.length === 0 ? 'Yes' : 'No - PR has existing body'})`);
  
  // Test passes if: PR description covers >= 90% of commits AND prompt includes all commits
  // The commit coverage instruction is only expected when there's no existing body
  const promptHasAllCommits = coveredInSummary === commits.length;
  const descriptionHasGoodCoverage = coveragePercent >= 90;
  const promptHasCoverageInstructionWhenExpected = existingBody.length === 0 ? hasCommitCoverageSection : true;
  
  if (descriptionHasGoodCoverage && promptHasAllCommits && promptHasCoverageInstructionWhenExpected) {
    console.log(`\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%), prompt includes all commits${existingBody.length === 0 ? ' and coverage instruction' : ''}`);
    return { passed: true, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  } else if (descriptionHasGoodCoverage && promptHasAllCommits) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%), prompt includes all commits but missing coverage instruction when expected`);
    return { passed: false, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  } else if (descriptionHasGoodCoverage) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) but prompt missing commits or instruction`);
    return { passed: false, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  } else {
    console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%)`);
    return { passed: false, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  }
}

async function main() {
  console.log('=== GitHub PR Generator - Full Extension Coverage Test ===');
  
  const config = loadConfig();
  
  if (!config.testPr) {
    console.error('No testPr configuration found in config.local.json');
    process.exit(1);
  }
  
  if (!config.githubToken) {
    console.error('No githubToken configured - cannot fetch PR data');
    process.exit(1);
  }
  
  // Verify gh auth
  try {
    runGhCommand('auth status');
  } catch (e) {
    console.error('GitHub CLI not authenticated. Run: gh auth login');
    process.exit(1);
  }
  
  console.log(`\nFetching PR #${config.testPr.number} from ${config.testPr.owner}/${config.testPr.repo}...`);
  
  try {
    const prDetails = await fetchPRDetails(config);
    console.log(`PR Title: ${prDetails.title}`);
    console.log(`Base: ${prDetails.baseRefName} <- Head: ${prDetails.headRefName}`);
    console.log(`Files changed: ${prDetails.files?.length || 0}`);
    console.log(`Additions: ${prDetails.additions}, Deletions: ${prDetails.deletions}`);
    
    const result = await testGeneratedDescriptionCoverage(config, prDetails);
    
    process.exit(result.passed ? 0 : 1);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

main();