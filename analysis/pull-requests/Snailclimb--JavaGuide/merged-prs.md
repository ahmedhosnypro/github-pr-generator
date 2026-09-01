# Merged PRs: Snailclimb/JavaGuide

## PR #2897: docs: clarify L1 backfill after L2 hit

- URL: https://github.com/Snailclimb/JavaGuide/pull/2897
- Author: ming1523
- Merged: 2026-08-16T13:20:21Z (created: 2026-08-15T04:27:15Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary
- document the L1 hit, L2 hit, and L2 miss paths in the multi-level cache flow
- backfill the current instance L1 when L2 returns a hit

## Validation
- `git diff --check`
- Markdownlint and VuePress build were not run because dependencies are not installed in the checkout

This keeps the change scoped to `docs/database/redis/cache-basics.md`.

## PR #2905: Update java-basic-questions-01.md

- URL: https://github.com/Snailclimb/JavaGuide/pull/2905
- Author: vverycool
- Merged: 2026-08-24T09:08:16Z (created: 2026-08-24T06:45:25Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

int a = 9;   // a = 9
int b = a++; // b = 9，a = 10
int c = ++a; // a = 11，c = 11
int d = c--; // d = 11，c = 10
int e = --d; // d = 10，e = 10

## PR #2907: docs(ai-coding): update DeepSeek V4 pricing table with peak/off-peak tiers (#2906)

- URL: https://github.com/Snailclimb/JavaGuide/pull/2907
- Author: loulanyue
- Merged: 2026-08-26T13:59:48Z (created: 2026-08-25T01:01:13Z)
- Stats: +6 -4, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: Fixes #2906

### Description

## Summary

Fixes #2906.

Updates the DeepSeek V4 pricing table in `docs/ai-coding/cases/deepseek-v4-claude-code.md` to reflect the updated peak / off-peak tiered pricing model and current official rates.

## PR #2909: fix: 修正全栈路线图中的错别字

- URL: https://github.com/Snailclimb/JavaGuide/pull/2909
- Author: weieast1314
- Merged: 2026-08-28T04:39:16Z (created: 2026-08-27T03:48:01Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## 变更说明

- 修正全栈路线图中的错别字，将“这些问题都不玄”改为“这些问题都不难”。
- 目标页面：https://javaguide.cn/roadmap/full-stack-roadmap.html

参考贡献指南：#1235

## PR #2910: Fix grammar in Protobuf description

- URL: https://github.com/Snailclimb/JavaGuide/pull/2910
- Author: duofuwang
- Merged: 2026-08-28T08:06:36Z (created: 2026-08-28T07:34:19Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Corrected a grammatical error in the Protobuf section for clarity.
