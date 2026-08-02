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

function buildChangesSummary(commits, fileChanges, stats, branchContext, linkedIssues, existingBody) {
  let summary = '';
  
  summary += '## Commits\n';
  commits.forEach((commit, i) => {
    summary += `${i + 1}. ${commit}\n\n`;
  });
  
  summary += '## File Changes\n';
  fileChanges.forEach(file => {
    summary += `- ${file.path} (${file.type}): +${file.additions}/-${file.deletions}\n`;
  });
  
  summary += '\n## Stats\n';
  summary += `- Files: ${stats.files}\n`;
  summary += `- Additions: ${stats.additions}\n`;
  summary += `- Deletions: ${stats.deletions}\n`;
  
  summary += '\n## Branch Context\n';
  summary += `- Base: ${branchContext.baseBranch}\n`;
  summary += `- Head: ${branchContext.headBranch}\n`;
  
  if (linkedIssues.length > 0) {
    summary += '\n## Linked Issues\n';
    linkedIssues.forEach(issue => {
      summary += `- ${issue}\n`;
    });
  }
  
  if (existingBody) {
    summary += '\n## Existing Description\n';
    summary += existingBody.substring(0, 2000);
  }
  
  return summary;
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

async function testExtensionCommitCoverage(config, prDetails) {
  const commits = await fetchPRCommits(config);
  const files = await fetchPRFiles(config);
  
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
  
  const changesSummary = buildChangesSummary(commits, files, stats, branchContext, linkedIssues, existingBody);
  
  console.log('\n=== Extension Prompt Analysis ===');
  console.log(`Changes summary length: ${changesSummary.length} chars`);
  console.log(`Commits in summary: ${commits.length}`);
  console.log(`Files in summary: ${files.length}`);
  
  // Check if all commits are mentioned in the changes summary
  let coveredInSummary = 0;
  commits.forEach((commit, i) => {
    const headline = commit.split('\n')[0].toLowerCase();
    const words = headline.split(/\s+/).filter(w => w.length > 3);
    const found = words.some(w => changesSummary.toLowerCase().includes(w));
    if (found) coveredInSummary++;
  });
  
  console.log(`\nCommits represented in changes summary: ${coveredInSummary}/${commits.length}`);
  
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
  
  if (coveragePercent >= 90) {
    console.log(`\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%)`);
    return { passed: true, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  } else if (coveragePercent >= 70) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) - some commits not mentioned`);
    return { passed: false, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  } else {
    console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%) - many commits missing`);
    return { passed: false, coverage: coveragePercent, covered: coveredInDescription, total: commits.length };
  }
}

async function main() {
  console.log('=== GitHub PR Generator - Extension Commit Coverage Test ===');
  
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
    
    const result = await testExtensionCommitCoverage(config, prDetails);
    
    process.exit(result.passed ? 0 : 1);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

main();