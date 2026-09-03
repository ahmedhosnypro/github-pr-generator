export const SYSTEM_PROMPT = [
  "You are an expert software engineer who writes detailed, structured GitHub pull request descriptions.",
  "You analyze code diffs, commit messages, and change metadata to produce descriptions that help reviewers quickly understand what changed, why, and how to verify it.",
  "",
  "Your descriptions are:",
  "- Accurate and grounded in the actual code diff — you reference specific function names, class names, and variable names from the code",
  "- Structured with clear markdown sections",
  "- Concise but thorough — every significant change is mentioned",
  "- Actionable — reviewers know what to focus on and how to test",
  "",
  "When the description field already contains a PR template, you preserve it completely — every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence stays byte-for-byte; you only fill in the sections.",
  "Never fabricate CI run IDs, SHAs, reviewer names, reviewers' checklist outcomes, or issue numbers. When filling templates, only mark checkboxes checked if the diff provides evidence.",
].join("\n");

// Default section skeleton used when the description field is empty.
// Shared verbatim by the description-only and combined prompts.
// Wording follows the corpus presentation study
// (analysis/pull-requests/PRESENTATION.md): thesis-first summary, tables for
// comparable evidence, fenced commands, one-line bold-label bullets.
export const SECTIONS_PROMPT = [
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
].join("");

// Corpus-derived rules (analysis/pull-requests/implementation-plan.md Phase A)
// shared verbatim by the combined and description-only RULES blocks.
export const ANCHOR_RULE =
  "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file. For large diffs (many files), focus on substantive claims and include anchors for the most important files only; for small diffs, keep one or more references for every file mentioned. Use ONLY links from the Anchors section — if this prompt has no Anchors section, emit no diffhunk links at all.\n";

export const BREAKING_CHANGES_RULE =
  "- Only if the diff genuinely breaks API/behavior (removed exports, renamed functions, changed contracts), add a ## Breaking Changes section with diff hunk references; otherwise do not create the section. When the diff proves there are no behavior changes, you may state that in one sentence inside Summary instead.\n";

export const NO_BOT_SIGNATURES_RULE =
  "- Do NOT imitate bot output: no 'Summary by <tool>' headings, badge images, mermaid diagrams, confidence scores, HTML comment markers like <!-- ... --> you invented, or sign-off footers. No emoji unless the existing template uses them.\n";

export const SCOPE_BOUNDARIES_RULE =
  "- When relevant, explicitly state what was deliberately NOT changed, left as-is, or not verified (e.g. 'Not verified: integration tests requiring external credentials') to establish clear review boundaries.\n";

export const NO_EMPTY_OR_PLACEHOLDERS_RULE =
  "- Never output an empty description or leave template placeholders (like '_TODO_', '{your_pr_number}', or empty stubs) in the output. Replace every placeholder with real content or an explicit 'N/A: <reason>'.\n";

export const INTENT_TITLES_RULE =
  "- Titles must describe the intent of the change, not enumerate raw file names or lists of identifiers.\n";

// Render-quality rules distilled from the corpus presentation study
// (analysis/pull-requests/PRESENTATION.md → anti-pattern catalog).
export const FORMATTING_RULES: string[] = [
  "- Commands, logs, errors, and code excerpts go in fenced code blocks with a language tag (```bash, ```diff, ```text) — never inline in prose. Label each evidence fence with the state it proves ('### Before (fails)' / '### After (passes)'), and paste at most ~10 salient log lines.\n",
  "- Use a markdown table with a one-line bold verdict caption above it for any comparison of 2+ rows (before/after, per-suite results, per-platform evidence).\n",
  "- Bullets are one line (≤ ~25 words) each; past 4 items, group them under ### subsections or bold labels. Sections are H2 ('##'), their children H3 ('###') — never bare-text pseudo-headers like 'Summary:' and never skip heading levels.\n",
  "- Paragraphs carry one idea and at most 3 sentences. Every fact appears exactly once. Every fence is balanced (open and close).\n",
  "- End the body on an artifact — a verdict line, 'Closes #N', or scope accounting — never on 'please review' or an empty checklist.\n",
  "- No prose line exceeds 400 characters (bullets carrying long identifiers may run to ~600; fenced commands/logs are exempt). Every bullet is one line of at most ~25 words (max ~60 words absolute cap). Numbered testing steps MUST put the command on its own line and 'Expected:' on the next line — never combine command + expected outcome on the same line. Expected lines MUST also not exceed 400 characters; wrap long expected outcomes across multiple lines.\n",
];

// Title convention guidance (A8): corpus split across 94 repos is roughly
// 30 conventional-commits / 26 plain-imperative / 26 mixed / 12 prefix styles.
export const TITLE_STYLE_GUIDANCE =
  "Match the repo's title style if inferable from commit messages in this prompt (e.g. 'subsystem: verb', '[Area]', conventional commits); otherwise default to conventional commits";

// UI-style extensions that signal the change affects something a user can see.
const UI_FILE_RE = /\.(css|scss|sass|less|styl|tsx|jsx|vue|svelte|html?)$/i;

/**
 * Returns a Screenshots-section hint when the changed-files list is dominated
 * by UI files, "" otherwise. Corpus basis (analysis/recommendations.md P3):
 * screenshots are standard practice in UI-heavy repos, so the model is told to
 * offer placeholder slots — never fabricated screenshots. Detection is
 * heuristic: the prompt builders only receive the changes-summary text, so the
 * "## Changed Files"/"## File Changes" bullet list is scanned for file tokens.
 */
export function buildScreenshotsHint(changesSummary: string): string {
  const sectionMatch = changesSummary.match(/## (?:Changed Files|File Changes)\n+([\s\S]*?)(?=\n## |\s*$)/);
  const section = sectionMatch?.[1];
  if (!section) return "";

  const paths: string[] = [];
  for (const raw of section.split("\n")) {
    const line = raw.trim();
    if (!line.startsWith("-")) continue;
    const token = line.match(/[\w./@-]+\.[a-z0-9]{1,6}\b/i);
    if (token) paths.push(token[0]);
  }

  const uiCount = paths.filter((p) => UI_FILE_RE.test(p)).length;
  if (uiCount < 2 || uiCount * 2 < paths.length) return "";

  return (
    "## Screenshots Hint\n" +
    "This change is dominated by UI files. If it alters anything a user can see, add a `## Screenshots` section with plain placeholder slots the author can fill manually (e.g. `**Before:**` … / `**After:**` …). Never fabricate screenshots or claim visuals you cannot verify from the diff. Skip the section entirely when the change has no visible effect.\n\n"
  );
}

/**
 * Computed size-tier note (recommendations.md P2.1): the skeleton says "scaled
 * to the change", but models anchor to concrete numbers, not adjectives. Reads
 * the "## Stats" block and states the tier explicitly: small diffs (≤3 files or
 * ≤50 changed lines) get a hard compact-output directive ("small but complete"
 * is the corpus' merged ideal); large diffs get explicit permission for the
 * full skeleton. Returns "" when stats are absent.
 */
export function buildSizeTierNote(changesSummary: string): string {
  const block = changesSummary.match(/## Stats\n([\s\S]*?)(?=\n## |$(?![\s\S]))/m)?.[1];
  if (!block) return "";
  const files = Number.parseInt(/\d+/.exec(block)?.[0] ?? "", 10);
  const additions = Number.parseInt(/- (\d+) additions/.exec(block)?.[1] ?? "", 10);
  const deletions = Number.parseInt(/- (\d+) deletions/.exec(block)?.[1] ?? "", 10);
  if (Number.isNaN(files) || Number.isNaN(additions) || Number.isNaN(deletions)) return "";
  const changedLines = additions + deletions;

  if (files <= 3 || changedLines <= 50) {
    return (
      "## Size Tier — Small Change\n" +
      `This diff is small (${String(files)} file(s), ${String(changedLines)} changed lines). Keep the description compact and complete: an S-shaped Summary (root cause first if this is a fix), Commit Coverage folded in, and a Testing line only if verifiable from the diff. Skip Walkthrough and multi-section scaffolding entirely. The Summary stays pure prose — 2-4 sentences, no bullet list — with any diff-hunk links carried inline in those sentences; do not merge sections under hybrid titles like '## Summary of Changes'. A short, dense description is the ideal here.\n\n`
    );
  }
  if (files >= 30 || changedLines >= 2000) {
    return (
      "## Size Tier — Large Change\n" +
      `This diff is large (${String(files)} files, ${String(changedLines)} changed lines). Use the full section skeleton, group Changes under ### subsections, and wrap the file-by-file Walkthrough in a <details> block.\n\n`
    );
  }
  return "";
}

/**
 * True when a PR body looks like a repo-provided template (headers plus HTML
 * comments, checkboxes, or a multi-header scaffold) rather than authored prose.
 */
export function isLikelyTemplate(body: string): boolean {
  return (
    /(^|\n)#{1,6}\s+/.test(body) &&
    (body.includes("<!--") ||
      body.includes("- [ ]") ||
      body.includes("- [x]") ||
      (body.match(/^#{1,6}\s+/gm) ?? []).length >= 2)
  );
}

// Checkbox/placeholder etiquette for template filling (PRESENTATION.md
// "template-fidelity ladder"): honest boxes, filled slots, template voice kept.
const TEMPLATE_FILL_ETIQUETTE =
  " Fill every placeholder (like '#xxx', 'XXXXX', 'Explain:') with real content or an explicit 'N/A — <reason>'. Use exact '- [x]' / '- [ ]' checkbox syntax — check only boxes the diff proves true, and leave unchosen options visible unless the template text itself says to remove them. Keep release-note fences, slash-commands, and machine trailers byte-exact. Add your own subsections only inside the template's free-text slots and never restyle its headers. After filling the template's own fields, the free-text area (or the end of the body, when the template offers no free-text slot) still gets the structured content: first a '## Summary' section of 2-4 pure-prose sentences, then — under THEIR OWN heading, never directly inside the '## Summary' section (for small diffs use '## Changes' or an '### Key Changes' subsection after the Summary prose) — the change bullets, each shaped '- **Bold label** — one concrete statement' and carrying the diff-hunk links, then a '## Testing' section (exact header) of numbered steps with fenced commands or a single 'Not verified: <reason>' line.";

/**
 * Builds the "Existing Content" prompt block with two modes: template bodies
 * get a preserve-everything instruction; authored prose gets a light-touch,
 * complete-missing-parts-only instruction (never overwrite the user's words).
 */
export function buildExistingContentSection(existingBody: string): string {
  let section = "## Existing Content in Description Field\n";
  if (isLikelyTemplate(existingBody)) {
    section +=
      "The user has provided a PR template. Respect its structure completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Output the full template with all existing content preserved, plus your additions:" +
      TEMPLATE_FILL_ETIQUETTE +
      "\n\n";
  } else {
    section +=
      "The user has written custom content. Only complete missing parts (Testing section, issue links) — do not restructure or rewrite existing sentences, and preserve the author's wording and brevity:\n\n";
  }
  return section + existingBody + "\n\n";
}

/**
 * Instruction block used when the description field is empty but the repo's
 * own PR template was discovered from the repository — fill that template
 * instead of the generic section skeleton. Commit coverage stays mandatory.
 */
export function buildTemplateFillBlock(template: string): string {
  let block = "## Repository PR Template\n";
  block +=
    "This repository defines a PR description template. Respect it completely — keep every header, HTML comment (<!-- ... -->), checkbox, footer, and boilerplate sentence byte-for-byte; only fill in the sections. Do not delete, reorder, or reword template text. Commit Coverage still applies: mention what each commit does, folded into the most relevant template section." +
    TEMPLATE_FILL_ETIQUETTE +
    "\n\n";
  return block + template + "\n\n";
}
