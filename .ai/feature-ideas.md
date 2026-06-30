# Future Feature Ideas

## High Value, Low Effort

### 1. AI Review Comments
Button on PR diff pages to generate review comments on specific files/hunks, posted via `POST /repos/{owner}/{repo}/pulls/{number}/comments`.

### 2. Suggest Reviewers
Analyze the diff to recommend reviewers based on who authored/touched the changed files (via `GET /repos/{owner}/{repo}/commits/{sha}` for author info).

### 3. PR Summary Comment
Post the generated description as a comment on the PR (useful for reviewers who get notified via comments, not title/body changes).

### 4. Custom Prompt Templates
Let users save/edit prompt templates in the popup (e.g., "concise mode", "detailed mode", team-specific templates).

## Medium Effort

### 5. Streaming Responses
Show the LLM output typing in real-time instead of waiting for the full response.

### 6. Multi-model Support
Cycle through different models/providers for different tasks (e.g., cheap model for titles, powerful model for descriptions).

### 7. PR Checklist Generation
Auto-generate a testing/review checklist based on the diff.

### 8. Auto-label
Suggest and apply GitHub labels based on the changes (bug, feature, breaking, etc.) via `PUT /repos/{owner}/{repo}/issues/{number}/labels`.

### 9. Draft Detection
If PR is a draft, generate a WIP-style title/description automatically.

## Bigger Scope

### 10. Batch PR Generation
For monorepo/multi-PR workflows, generate descriptions for multiple open PRs at once.

### 11. Code Review Copilot
Inline suggestions while reviewing code on the Files Changed tab.

### 12. Changelog Generator
Aggregate merged PRs to generate a release changelog.
