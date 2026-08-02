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

async function testCommitCoverage(config, prDetails) {
  const commits = await fetchPRCommits(config);
  
  console.log(`\n=== Commit Coverage Test ===`);
  console.log(`PR: ${config.testPr.owner}/${config.testPr.repo}#${config.testPr.number}`);
  console.log(`Total commits in PR: ${commits.length}`);
  console.log(`\nCommit messages:`);
  commits.forEach((msg, i) => {
    const headline = msg.split('\n')[0];
    console.log(`  ${i + 1}. ${headline}`);
  });

  const prDescription = prDetails.body || '';
  console.log(`\n=== PR Description Analysis ===`);
  console.log(`Description length: ${prDescription.length} chars`);
  
  let coveredCommits = 0;
  const coverageDetails = [];
  
  commits.forEach((commitMsg, i) => {
    const headline = commitMsg.split('\n')[0].toLowerCase();
    const words = headline.split(/\s+/).filter(w => w.length > 3);
    const found = words.some(w => prDescription.toLowerCase().includes(w));
    if (found) {
      coveredCommits++;
      coverageDetails.push({ commit: i + 1, headline, covered: true });
    } else {
      coverageDetails.push({ commit: i + 1, headline, covered: false });
    }
  });

  console.log(`\n=== Coverage Results ===`);
  coverageDetails.forEach(d => {
    const status = d.covered ? '✓ COVERED' : '✗ MISSING';
    console.log(`  ${status}: ${d.headline}`);
  });

  const coveragePercent = ((coveredCommits / commits.length) * 100).toFixed(1);
  console.log(`\n=== SUMMARY ===`);
  console.log(`Commits covered: ${coveredCommits}/${commits.length} (${coveragePercent}%)`);
  
  if (coveragePercent >= 90) {
    console.log(`\n✅ TEST PASSED: Excellent commit coverage (${coveragePercent}%)`);
    return { passed: true, coverage: coveragePercent };
  } else if (coveragePercent >= 70) {
    console.log(`\n⚠️  TEST PARTIAL: Good commit coverage (${coveragePercent}%) - some commits not mentioned`);
    return { passed: false, coverage: coveragePercent };
  } else {
    console.log(`\n❌ TEST FAILED: Poor commit coverage (${coveragePercent}%) - many commits missing`);
    return { passed: false, coverage: coveragePercent };
  }
}

async function main() {
  console.log('=== GitHub PR Generator - Commit Coverage Test ===');
  
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
    
    const result = await testCommitCoverage(config, prDetails);
    
    process.exit(result.passed ? 0 : 1);
  } catch (e) {
    console.error('Test failed:', e.message);
    process.exit(1);
  }
}

main();