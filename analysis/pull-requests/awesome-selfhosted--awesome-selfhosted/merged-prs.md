# Merged PRs: awesome-selfhosted/awesome-selfhosted

**No merged PRs could be collected (0 of 5 requested).**

The GraphQL query for merged pull requests returned an empty result set, and a direct
check confirmed `pullRequests { totalCount } = 0` for ALL states (not just MERGED).

Follow-up check (`gh api repos/awesome-selfhosted/awesome-selfhosted`) shows the repo
was **not renamed or moved**: `full_name` still matches, it is not archived, not
disabled, and was most recently pushed on 2026-08-30. However, the repository metadata
reports `"has_issues": false`, meaning the Issues/Pull Requests features are currently
disabled on the repository. This is consistent with the REST pulls endpoint
(`GET /repos/awesome-selfhosted/awesome-selfhosted/pulls`) returning **404 Not Found**
and the issue search API returning `total_count: 0` for merged PRs.

Conclusion: the repository exists and is active, but its pull request history is not
accessible via the GitHub API while Issues/PRs are disabled. No PR data is available
to record here.
