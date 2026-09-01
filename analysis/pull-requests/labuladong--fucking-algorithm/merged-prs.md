# Merged PRs: labuladong/fucking-algorithm

## PR #1610: Update misplaced bold marker ** and added missing words at some places

- URL: https://github.com/labuladong/fucking-algorithm/pull/1610
- Author: vijethkash123
- Merged: 2025-10-08T04:06:00Z (created: 2024-08-13T16:40:37Z)
- Stats: +6 -6, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

<!-- 
如果你是在修复刷题插件的解法代码，请遵循正确的格式，具体要求参见如下链接：

https://github.com/labuladong/fucking-algorithm/issues/1113
-->

<!-- 如果你的 PR 能够关闭某个 issue，那么在 Fixes 关键词后面输入该 issue 的链接 -->

Fixes <!-- issue 链接 -->

我修改的是如下题目的 xx 解法：

<!-- 这里放对应题目的链接，方便验证代码 -->

通过截图如下：

<!-- 把解法代码通过所有测试用例的截图粘贴在这里，用来证明代码的正确性 -->

## PR #2610: Reframe CLRS recommendation constructively

- URL: https://github.com/labuladong/fucking-algorithm/pull/2610
- Author: joshribakoff
- Merged: 2026-01-19T09:37:36Z (created: 2026-01-19T03:43:40Z)
- Stats: +3 -3, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Addresses feedback from #2609.

Instead of dismissing readers who prefer CLRS, this acknowledges the book's strengths (comprehensive, mathematically rigorous) while noting it works better as a reference after building intuition from practical resources.

**Before:**
> If someone recommends this book for you, it is only out of two reasons: he/she is a big cheese or he/she is pretending to be a big cheese... Just forgive yourself and stop to learn that useless stuff.

**After:**
> It's comprehensive, mathematically rigorous, and excellent as a reference—but the depth of proofs and breadth of ADTs can overwhelm beginners. Consider it a resource to solidify your understanding after building intuition from practical resources like this one.

## PR #2611: Clarify hash table collision strategies with complexity

- URL: https://github.com/labuladong/fucking-algorithm/pull/2611
- Author: joshribakoff
- Merged: 2026-01-19T09:38:13Z (created: 2026-01-19T03:47:45Z)
- Stats: +4 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

Addresses feedback from #2609.

The hash table explanation was confusing and used vague language like "slightly more complex." Rewrote with clear bullet points explaining:

- **Chaining:** O(1) insertion, O(n) worst-case lookup, extra pointer space
- **Linear probing:** Cache-friendly, no pointer overhead, but deletion requires tombstones

**Before:**
> Hashtables map keys to a large array by making use of a hash function to solve hash conflicts. Chaining needs linked list features with simple operations, but with the extra space needed to store pointers; linear exploration methods need array features, to address continuously, and does not need the extra storage space for pointers, but the operation is slightly more complex.

**After:**
> Hash tables use a hash function to map keys to array indices. When collisions occur, there are two common strategies:
> - **Chaining (linked list):** Each array slot holds a linked list of colliding entries. Insertion is O(1), lookup/deletion is O(n) worst case if many collisions. Uses extra space for pointers.
> - **Linear probing (array):** Colliding entries go into the next available slot. More cache-friendly and no pointer overhead, but deletion requires tombstones to maintain probe sequences.

## PR #2612: Add sorting complexity note and hash map intuition for Two Sum

- URL: https://github.com/labuladong/fucking-algorithm/pull/2612
- Author: joshribakoff
- Merged: 2026-01-19T09:38:44Z (created: 2026-01-19T03:48:43Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Addresses feedback from #2609.

The article suggests sorting for Two Sum without noting the complexity implication, and doesn't explain the hash map intuition.

**Before:**
> In ordinary circumstances, we will sort the unordered array first and then consider applying the dual-pointer method. TwoSum problems make us aware that HashMap or HashSet could help us to resolve unordered array problems.

**After:**
> In ordinary circumstances, we will sort the unordered array first and then consider applying the dual-pointer method. Note that sorting adds O(n log n) time—if O(n) is required, use a hash map instead: for each element, check if its complement (target - element) exists in the map.

## PR #2602: feat: detail the index difference between strings and DP table

- URL: https://github.com/labuladong/fucking-algorithm/pull/2602
- Author: IcyDesert
- Merged: 2026-02-28T10:07:31Z (created: 2025-12-28T08:28:08Z)
- Stats: +9 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

添加一段细节说明，即字符串的索引会和 dp 数组索引有偏差，并利用定义加以解释。

