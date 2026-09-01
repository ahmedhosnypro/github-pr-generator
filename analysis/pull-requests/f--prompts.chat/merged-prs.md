# Merged PRs: f/prompts.chat

## PR #1198: Fix VS Code Copilot Chat deep links

- URL: https://github.com/f/prompts.chat/pull/1198
- Author: f
- Merged: 2026-06-02T23:41:18Z (created: 2026-06-02T23:39:37Z)
- Stats: +38 -8, 4 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Description

The Run button listed VS Code and VS Code Insiders, but those entries only opened the editor and required users to paste the prompt manually. This updates both entries to use the GitHub Copilot Chat URI handler so prompts open prefilled in VS Code or VS Code Insiders.

The same deep-link behavior is wired through the web Run button, the packaged CLI platform builder, and the Raycast extension utility. A small regression test covers the generated VS Code URLs and prompt encoding.

## Type of Change

- [x] Bug fix
- [ ] Documentation update
- [ ] Other (please describe):

---

## ⚠️ Want to Add a New Prompt?

**Please don't edit `prompts.csv` directly!**

Instead, visit **[prompts.chat](https://prompts.chat)** and:

1. **Login with GitHub** - Click the login button and authenticate with your GitHub account
2. **Create your prompt** - Use the prompt editor to add your new prompt
3. **Submit** - Your prompt will be reviewed and a [GitHub Action](https://github.com/f/prompts.chat/actions/workflows/update-contributors.yml) will automatically create a commit on your behalf

This ensures proper attribution, formatting, and keeps the repository in sync. You'll also appear on the [Contributors page](https://github.com/f/prompts.chat/graphs/contributors)!

---

## Additional Notes

Validation run:

- `npm run lint -- --quiet`
- `npm --prefix packages/prompts.chat run typecheck`
- `cd packages/prompts.chat && npx vitest run --config /dev/null src/__tests__/platforms.test.ts`

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

# Fix VS Code Copilot Chat Deep Links

## Overview
This PR fixes VS Code and VS Code Insiders deep links to use the GitHub Copilot Chat URI handler, enabling prompts to open prefilled directly in the editors rather than requiring manual pasting. The fix is applied consistently across the web UI, CLI, and Raycast extension.

## Changes Made

### Platform Configuration Updates
- **VS Code base URL**: Updated from `vscode://` to `vscode://GitHub.Copilot-Chat/chat` with `isDeeplink: true`
- **VS Code Insiders base URL**: Updated from `vscode-insiders://` to `vscode-insiders://GitHub.Copilot-Chat/chat` with `isDeeplink: true`
- Both platforms now support query string parameters for passing prompts

### URL Generation
Extended the `buildUrl()` function in all affected modules to handle VS Code platforms by generating URLs in the format `${baseUrl}?prompt=${encoded}`, properly encoding special characters in prompt text.

### Affected Components
1. **Web Run Button** (`src/components/prompts/run-prompt-button.tsx`)
2. **CLI Platform Builder** (`packages/prompts.chat/src/cli/platforms.ts`)
3. **Raycast Extension** (`packages/raycast-extension/src/utils.ts`)

### Test Coverage
- **New regression test** (`packages/prompts.chat/src/__tests__/platforms.test.ts`): Verifies VS Code and VS Code Insiders platform configurations, validates baseUrl values, and tests that `buildUrl()` correctly generates URL-encoded prompt query strings with proper handling of special characters (e.g., ampersands, forward slashes)

## Validation
All validation checks passed:
- Linting checks
- TypeScript type checking
- Vitest regression test suite

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #1227: Add translated Loop Engineering chapter

- URL: https://github.com/f/prompts.chat/pull/1227
- Author: f
- Merged: 2026-07-17T09:33:08Z (created: 2026-07-16T10:33:42Z)
- Stats: +7252 -36, 40 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## What changed

- add “The Loop Engineering” immediately after Context Engineering
- add an interactive Frame → Act → Observe → Evaluate → Adapt simulator
- support both light and dark themes in the simulator
- add complete localized chapter content for all 16 non-English supported locales
- update chapter navigation, metadata, and chapter counts

## Why

The chapter explains how to design bounded AI feedback loops using external evidence, evaluators, persistent state, stopping conditions, and human gates. It grounds the material in current agent-engineering resources and makes the concepts explorable through coding, research, and writing scenarios.

## Validation

- `npm run lint:mdx` — 493 MDX files passed
- `npm run lint` — 0 errors; existing repository warnings remain
- `node scripts/check-translations.js` — all translation files complete
- all 16 localized chapter routes rendered the interactive lab successfully
- browser QA covered dark mode, light mode, translated controls, responsive overflow, and RTL output

`npx tsc --noEmit` remains blocked by existing unrelated Prisma generated-client and test typing errors.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary

Adds the translated “The Loop Engineering” chapter after Context Engineering across all 16 supported non-English locales.

- Introduces an interactive Frame → Act → Observe → Evaluate → Adapt simulator with theme support.
- Covers bounded AI feedback loops, external evidence, evaluators, persistent state, stopping conditions, and human gates.
- Updates localized chapter metadata and navigation for the new chapter.
- Validation passed for MDX linting, repository linting, translation completeness, localized routes, and browser QA.
- TypeScript checking remains blocked by unrelated existing Prisma and test typing errors.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #1230: Update wording from 'prompt examples' to 'prompts'

- URL: https://github.com/f/prompts.chat/pull/1230
- Author: devdynaf
- Merged: 2026-07-17T19:32:02Z (created: 2026-07-16T14:20:09Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

## Description

<!-- Briefly describe the changes in this PR -->

## Type of Change

- [ ] Bug fix
- [ ] Documentation update
- [ ] Other (please describe):

---

## ⚠️ Want to Add a New Prompt?

**Please don't edit `prompts.csv` directly!**

Instead, visit **[prompts.chat](https://prompts.chat)** and:

1. **Login with GitHub** - Click the login button and authenticate with your GitHub account
2. **Create your prompt** - Use the prompt editor to add your new prompt
3. **Submit** - Your prompt will be reviewed and a [GitHub Action](https://github.com/f/prompts.chat/actions/workflows/update-contributors.yml) will automatically create a commit on your behalf

This ensures proper attribution, formatting, and keeps the repository in sync. You'll also appear on the [Contributors page](https://github.com/f/prompts.chat/graphs/contributors)!

---

## Additional Notes

<!-- Any additional context or screenshots -->


<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

## Summary

- Updated README wording from “prompt examples” to “prompts.”

## Validation

- No changes were made to `prompts.csv` or `prompts.md`.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #1226: Add MiniMax-M3 and MiniMax-M2.7 to model registry

- URL: https://github.com/f/prompts.chat/pull/1226
- Author: octo-patch
- Merged: 2026-07-17T19:32:22Z (created: 2026-07-16T09:48:52Z)
- Stats: +10 -0, 2 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Summary
- Add MiniMax-M3 and MiniMax-M2.7 to the model registry.
- Cover model lookup and provider grouping in tests.

## Testing
- `npm test -- src/__tests__/lib/works-best-with.test.ts`
- `npm run lint -- src/lib/works-best-with.ts src/__tests__/lib/works-best-with.test.ts`


<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

Adds MiniMax-M3 and MiniMax-M2.7 to the model registry, including valid slugs and MiniMax provider grouping. Extends tests to verify model lookup and provider inclusion.

Tests:
- `npm test -- src/__tests__/lib/works-best-with.test.ts`
- `npm run lint -- src/lib/works-best-with.ts src/__tests__/lib/works-best-with.test.ts`

<!-- end of auto-generated comment: release notes by coderabbit.ai -->

## PR #1223: Add validation and caps for public /api/prompts pagination

- URL: https://github.com/f/prompts.chat/pull/1223
- Author: bglglzd
- Merged: 2026-07-17T19:32:52Z (created: 2026-07-13T13:02:53Z)
- Stats: +54 -2, 2 files
- Labels: none
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

Supersedes #1221 after restoring the source branch. Adds bounded, validated pagination for the public prompts API with focused tests for malformed and oversized query values.

<!-- This is an auto-generated comment: release notes by coderabbit.ai -->

Adds validated, bounded pagination to the public `/api/prompts` endpoint.

- Applies defaults for malformed `page` and `perPage` values.
- Clamps values to maximums of page `10000` and `perPage` `100`.
- Adds focused tests covering invalid and oversized parameters.

<!-- end of auto-generated comment: release notes by coderabbit.ai -->
