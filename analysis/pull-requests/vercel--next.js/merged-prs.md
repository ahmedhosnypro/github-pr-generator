# Merged PRs: vercel/next.js

## PR #98030: Honor non-interactive mode in upgrade codemod prompts

- URL: https://github.com/vercel/next.js/pull/98030
- Author: devjiwonchoi
- Merged: 2026-08-28T23:44:29Z (created: 2026-08-28T13:47:45Z)
- Stats: +6 -2, 2 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

### Why?

`@next/codemod upgrade --yes` accepts defaults for the upgrade command's prompts, but `next-request-geo-ip` asked its own deployment question inside `runTransform`. Because the non-interactive state was not forwarded, automated upgrades could stop at that nested prompt despite using `--yes`.

### How?

Pass the resolved non-interactive state from `runUpgrade` into each transform. The geo/IP transform skips its deployment prompt in non-interactive mode while preserving the existing prompt for direct interactive runs.



## PR #97480: Store keys in key order in SST blocks that omit hashes

- URL: https://github.com/vercel/next.js/pull/97480
- Author: lukesandberg
- Merged: 2026-08-29T07:04:46Z (created: 2026-08-18T02:09:02Z)
- Stats: +546 -256, 10 files
- Labels: none
- Reviews: 14 | Comments: 2
- Linked issues: none

### Description

## What

Key blocks for short keys (≤ 32 bytes) don't store a per-entry hash, but were still sorted by `(hash, key)`. That forced every binary-search probe to recompute the entry's xxh3 hash just to compare it — roughly ten hashes per lookup. These blocks now store their entries in **key order**, so the search compares key bytes directly and hashes nothing.

All the families `turbo-tasks-backend` produces hit this case, so this is the common path in practice.

## Why this is safe

Hash-based routing is unchanged. Files are still assigned by hash, the index block still routes to a key block by hash, and `min_hash`/`max_hash`, the AMQF, and compaction's coverage model all work exactly as before.

Thus only the order *within* a hash-less block changes.  This adds a small cost to writing, which now must re-sort blocks of keys and a double cost to compaction which now must re-sort blocks in hash order to iterate them, and then sort them back to key order when writing the new file.

## Benchmarks

Measured against `canary`, baseline and comparison run back to back on the same machine.

**Lookups ** All 16 `static_sorted_file_lookup` configurations improved
| entries | hit/uncached | hit/cached | miss/uncached | miss/cached |
| --- | --- | --- | --- | --- |
| 1 Ki | -30.4% | -24.8% | -29.1% | -29.4% |
| 10 Ki | -25.2% | -19.7% | -22.7% | -23.7% |
| 100 Ki | -17.3% | -19.3% | -15.2% | -16.8% |
| 1000 Ki | -7.0% | -25.7% | -7.0% | -10.9% |


**Commits ** Short keys pay for the added per-block sort.

| config | change |
| --- | --- |
| `key_8` 85Ki entries | +3.3% |
| `key_8` 853Ki entries | +3.1% |
| `key_8` 8.33Mi entries | +8.5% |
| `key_32Ki` / `key_4` (large-key configs) | -2.6% to -19.1% |

Six of thirteen write configurations came out as noise (p >= 0.05) and are omitted.

**Compaction** `StaticSortedFileIter` must yield `(hash, key)` order because `MergeIter` merges on it, so it reorders each hash-less block back into hash order.  Plus the additional cost of the commit (above)

| config | change |
| --- | --- |
| 4Mi entries / 8 commits | +6.0% (reproduced at +10.2%) |
| 16Mi entries / 8 commits | +7.5% |
| 4Mi entries / 32 commits | +7.8% |
| 16Mi entries / 32 commits | +5.2% |
| 16Mi entries / 128 commits | -9.5% |





## PR #97753: [ci] Remove the popular workflow and its action

- URL: https://github.com/vercel/next.js/pull/97753
- Author: eps1lon
- Merged: 2026-08-29T09:54:36Z (created: 2026-08-23T15:13:52Z)
- Stats: +3 -5139, 14 files
- Labels: none
- Reviews: 1 | Comments: 2
- Linked issues: none

### Description

The `popular` workflow posted weekly Slack digests of the most-reacted issues, PRs, and feature requests. That reporting is now handled by the Next.js maintainer agent, so this PR deletes the workflow along with its backing `next-repo-actions` action (sources and checked-in ncc bundles), which had no other consumer, and regenerates the `.github` lockfile without the action's dependencies.




## PR #97987: test: add test for local font with deployment id

- URL: https://github.com/vercel/next.js/pull/97987
- Author: styfle
- Merged: 2026-08-27T17:10:56Z (created: 2026-08-27T15:06:28Z)
- Stats: +9 -0, 2 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Follow up to a previous PR:

- https://github.com/vercel/next.js/pull/82488
- https://github.com/vercel/next.js/pull/82384

Closes:

- https://github.com/vercel/next.js/pull/82547


## PR #97968: docs(examples): document env var handling in the Docker examples

- URL: https://github.com/vercel/next.js/pull/97968
- Author: icyJoseph
- Merged: 2026-08-28T09:08:58Z (created: 2026-08-26T23:18:54Z)
- Stats: +106 -2, 4 files
- Labels: none
- Reviews: 1 | Comments: 3
- Linked issues: none

### Description

Improve with-docker example env var usage documentation.

Closes: https://github.com/vercel/next.js/issues/97959

