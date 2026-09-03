// Mirror of src/background/prompts/*. Must stay byte-identical in wording to the
// src prompt builders (see "Invariants" in analysis/pull-requests/implementation-plan.md);
// tests/prompt-logic.ts fails when this mirror drifts from src.
// isLikelyTemplate is logic, not wording, so it is imported from src directly
// (as tests/prompt-logic.ts already does) rather than mirrored.
import {
  buildScreenshotsHint,
  buildSizeTierNote,
  FORMATTING_RULES,
  isLikelyTemplate,
} from "../src/background/prompts/common";

const SECTIONS_LINES = [
  "Use these sections, scaled to the change: omit sections that would be empty, and for small diffs (a handful of files or ~50 changed lines) prefer a compact output — Summary plus Testing when verifiable, with commits folded into Summary — over a long scaffold. Commit Coverage remains mandatory in all sizes, even if rendered as one sentence.\n\n",
  "## Summary\n",
  "2-4 sentences, no bullets, each sentence on its own line. For bug fixes, open with the root cause in one line — the observable symptom, then the mechanism that caused it — before describing the fix; for features or chores, state what the PR does and why it's needed. The first sentence must add information beyond the title — never restate it. Reference concrete identifiers from the diff, not generic descriptions. Large diffs may add one bolded scale line (e.g. **61 files, +1,669/−1,281**).\n\n",
  "(Conditional) ## Problem\n",
  "For bug fixes or behavioral changes whose failure mode is identifiable from the diff, insert this short section between Summary and Changes: the symptom, the mechanism that caused it, and where it manifests in the diff (one short paragraph or up to 3 bullets). Skip it for features, chores, and fixes whose cause would be guesswork.\n\n",
  "## Changes\n",
  "Group by area under ### subsections (skip subsections when only a few files changed). Every bullet is one line: `- **Bold label** — one concrete statement of at most ~25 words`, identifiers and paths in backticks, exactly one idea per bullet. Every file you name carries a diff hunk link from the Anchors section: [[N]](diffhunk://ANCHOR_Lstart-Rend). With 2+ comparable numeric results (before/after, per-suite, per-platform), use a markdown table with a one-line bold verdict caption instead of bullets.\n\n",
  "## Walkthrough\n",
  "One line per file: `- `path` — what changed [[N]](diffhunk://ANCHOR_Lstart-Rend)` using the Anchors section — anchor links are mandatory for every file named. Example: `frontend/app/globals.css` — Updated CSS variables for theme consistency. [[1]](diffhunk://#diff-4a5d3f2_L10-R25). Beyond ~10 files, group by area and wrap the list in a <details> block with <summary>File-by-file walkthrough (N files)</summary>.\n\n",
  "## Commit Coverage\n",
  "**IMPORTANT: You MUST cover every commit listed in the '## Commits' section above.** For each commit, mention what it does and reference the relevant files/diffs. Do not skip any commits — even small fixes or infrastructure changes. Group related commits together if they address the same feature, but ensure every commit message is represented in the description.\n\n",
  "## Testing\n",
  "Use the exact section header '## Testing' (not 'Verification' or any synonym). Numbered steps a reviewer can run (1. 2. 3. …), each step stating its expected outcome. Prefer exact, copy-pasteable commands a reviewer can re-run (test commands, build commands, CLI invocations) in fenced ```bash blocks — never inline in prose — infer them from the diff only when a script/test file in the diff makes them concrete. Every step must have an 'Expected:' line describing the pass criteria. When counts or before/after results are knowable from the diff, state them; with 2+ comparable results, use a markdown table with a bold verdict caption. If verification cannot be inferred from the diff, say so in one sentence rather than inventing commands, and end with a 'Not verified:' line naming what was not verified. The last line of the entire description MUST be a closing artifact — a verdict line, 'Closes #N', or scope accounting — never 'please review' or an empty checklist.\n\n",
  "## Linked Issues\n",
  "If commit messages reference issues or PRs, surface them as a single closing line in standard GitHub form ('Fixes #123', 'Closes #123', or 'Part of #123' when the commit does not fully resolve it) rather than a bare list. Omit if none — do not invent issue numbers.\n\n",
];

const TITLE_STYLE_GUIDANCE =
  "Match the repo's title style if inferable from commit messages in this prompt (e.g. 'subsystem: verb', '[Area]', conventional commits); otherwise default to conventional commits";

function defaultSectionsPrompt(): string {
  return SECTIONS_LINES.join("");
}

// Mirror of src/background/prompts/common.ts buildExistingContentSection
function existingContentSection(existingBody: string): string {
  let section = "## Existing Content in Description Field\n";
  if (isLikelyTemplate(existingBody)) {
    section +=
      "The user has provided a PR template. Respect its structure completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Output the full template with all existing content preserved, plus your additions: Fill every placeholder (like '#xxx', 'XXXXX', 'Explain:') with real content or an explicit 'N/A — <reason>'. Use exact '- [x]' / '- [ ]' checkbox syntax — check only boxes the diff proves true, and leave unchosen options visible unless the template text itself says to remove them. Keep release-note fences, slash-commands, and machine trailers byte-exact. Add your own subsections only inside the template's free-text slots and never restyle its headers. After filling the template's own fields, the free-text area (or the end of the body, when the template offers no free-text slot) still gets the structured content: first a '## Summary' section of 2-4 pure-prose sentences, then — under THEIR OWN heading, never directly inside the '## Summary' section (for small diffs use '## Changes' or an '### Key Changes' subsection after the Summary prose) — the change bullets, each shaped '- **Bold label** — one concrete statement' and carrying the diff-hunk links, then a '## Testing' section (exact header) of numbered steps with fenced commands or a single 'Not verified: <reason>' line.\n\n";
  } else {
    section +=
      "The user has written custom content. Only complete missing parts (Testing section, issue links) — do not restructure or rewrite existing sentences, and preserve the author's wording and brevity:\n\n";
  }
  return section + existingBody + "\n\n";
}

function combinedRules(): string {
  return [
    "- Be specific — reference actual code entities from the diff, not generic descriptions\n",
    "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file. For large diffs (many files), focus on substantive claims and include anchors for the most important files only; for small diffs, keep one or more references for every file mentioned. Use ONLY links from the Anchors section — if this prompt has no Anchors section, emit no diffhunk links at all.\n",
    '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n',
    "- Do NOT wrap the output in backtick fences\n",
    "- Do NOT add meta-commentary about the description itself\n",
    "- Only if the diff genuinely breaks API/behavior (removed exports, renamed functions, changed contracts), add a ## Breaking Changes section with diff hunk references; otherwise do not create the section. When the diff proves there are no behavior changes, you may state that in one sentence inside Summary instead.\n",
    "- Do NOT imitate bot output: no 'Summary by <tool>' headings, badge images, mermaid diagrams, confidence scores, HTML comment markers like <!-- ... --> you invented, or sign-off footers. No emoji unless the existing template uses them.\n",
    "- When relevant, explicitly state what was deliberately NOT changed, left as-is, or not verified (e.g. 'Not verified: integration tests requiring external credentials') to establish clear review boundaries.\n",
    "- Never output an empty description or leave template placeholders (like '_TODO_', '{your_pr_number}', or empty stubs) in the output. Replace every placeholder with real content or an explicit 'N/A: <reason>'.\n",
    "- Titles must describe the intent of the change, not enumerate raw file names or lists of identifiers.\n",
    ...FORMATTING_RULES,
    "- **Examples**:",
    "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n",
    "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n",
    "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n",
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n",
  ].join("");
}

// Mirror of src/background/prompts/combined.ts buildCombinedPrompt (no-style path).
export function buildCombinedPrompt(changesSummary: string, existingBody: string): string {
  let prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += `${changesSummary}\n`;

  if (existingBody.trim().length > 0) {
    prompt += existingContentSection(existingBody);
  }

  prompt += buildScreenshotsHint(changesSummary);
  prompt += buildSizeTierNote(changesSummary);

  prompt += "OUTPUT FORMAT:\n";
  prompt += "1. First line: PR title only. " + TITLE_STYLE_GUIDANCE + ". Under 72 characters.\n";
  prompt += '   No quotes, no markdown, no prefix like "Title:".\n';
  prompt += "2. Empty line.\n";
  prompt += "3. PR description body as structured markdown.\n\n";

  if (existingBody.trim().length === 0) {
    prompt += defaultSectionsPrompt();
  }
  prompt += "RULES:\n";
  prompt += combinedRules();

  return prompt;
}
