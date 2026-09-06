import { resolveDiffLinks } from "../src/background/linkify";
import { buildCombinedPrompt } from "../src/background/prompts/combined";
import { buildMergeDescriptionPrompt, buildMergeTitlePrompt } from "../src/background/prompts/merge-prompts";
import { buildDescriptionOnlyPrompt, buildTitleOnlyPrompt } from "../src/background/prompts/pr-prompts";
import type { RepoStyle } from "../src/background/repo-style";
import { countUsableAnchors, hasUsableAnchors } from "../src/background/summary";
import { buildAnchorsSection, MAX_HUNKS_PER_FILE } from "../src/background/summary-anchors";
import type { GitHubHunkRange, GitHubHunksByFile } from "../src/github-types";
import type { FileChange } from "../src/types";
import { expectExcludes, expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import { AUTHORED_BODY, K8S_TEMPLATE } from "./fixtures";

// Offline assertions for the render-quality contract from
// analysis/pull-requests/render-quality-plan.md (corpus presentation study).

function testSummaryWording(): void {
  const prompt = buildCombinedPrompt("SUMMARY\n", "");
  expectIncludes("summary forbids bullets", prompt, "no bullets");
  expectIncludes("summary opener must outrun the title", prompt, "must add information beyond the title");
  expectIncludes("bugfix root-cause wording kept", prompt, "root cause in one line");
  expectIncludes("scale line guidance present", prompt, "bolded scale line");
}

function testChangesAndWalkthroughWording(): void {
  const prompt = buildCombinedPrompt("SUMMARY\n", "");
  expectIncludes("bullets capped at one line", prompt, "at most ~25 words");
  expectIncludes("one idea per bullet", prompt, "exactly one idea per bullet");
  expectIncludes("tables preferred for comparable results", prompt, "bold verdict caption");
  expectIncludes("anchors mandatory per named file", prompt, "anchor links are mandatory");
  expectIncludes("walkthrough is one line per file", prompt, "One line per file");
  expectIncludes("large walkthroughs collapse", prompt, "<summary>File-by-file walkthrough");
}

function testTestingWording(): void {
  const prompt = buildCombinedPrompt("SUMMARY\n", "");
  expectIncludes("testing is numbered steps", prompt, "Numbered steps");
  expectIncludes("commands stay in fenced blocks", prompt, "```bash blocks");
  expectIncludes("each step states expected outcome", prompt, "expected outcome");
  expectIncludes("unverifiable work is named", prompt, "Not verified:");
}

function testFormattingContractRules(): void {
  for (const prompt of [buildCombinedPrompt("SUMMARY\n", ""), buildDescriptionOnlyPrompt("SUMMARY\n", "t", "")]) {
    expectIncludes("fenced blocks, never inline prose", prompt, "never inline in prose");
    expectIncludes("evidence fences carry state labels", prompt, "### Before (fails)");
    expectIncludes("tables get verdict captions", prompt, "one-line bold verdict caption");
    expectIncludes("no pseudo-headers", prompt, "never bare-text pseudo-headers");
    expectIncludes("paragraph budget stated", prompt, "one idea and at most 3 sentences");
    expectIncludes("fences balanced", prompt, "Every fence is balanced");
    expectIncludes("body ends on an artifact", prompt, "End the body on an artifact");
  }
}

function testTemplateEtiquette(): void {
  const existing = buildCombinedPrompt("SUMMARY\n", K8S_TEMPLATE);
  expectIncludes("placeholders get filled or N/A", existing, "Fill every placeholder");
  expectIncludes("true-boxes-only rule", existing, "check only boxes the diff proves true");
  expectIncludes("unchosen options stay", existing, "leave unchosen options visible");
  expectIncludes("template headers restyled forbidden", existing, "never restyle its headers");
  const discovered = buildCombinedPrompt("SUMMARY\n", "", {
    template: K8S_TEMPLATE,
    titleStyle: null,
    exampleTitles: [],
    length: null,
    templateHeavy: true,
    aiDisclosure: false,
  });
  expectIncludes("discovered template gets etiquette too", discovered, "Fill every placeholder");
  expectIncludes("extreme-value checkboxes survive echoed", discovered, "- [ ] Tests added");
}

function testAnchorDiscipline(): void {
  const prompt = buildCombinedPrompt("SUMMARY\n", "");
  expectIncludes("walkthrough example keeps anchor link", prompt, "[[1]](diffhunk://#diff-");
  expectMatch("skeleton links the anchor rule", prompt.includes("diffhunk://"), true);
  const descPrompt = buildDescriptionOnlyPrompt("SUMMARY\n", "t", "");
  expectIncludes("description-only keeps anchor rule", descPrompt, "add diff hunk reference links");
  expectIncludes("no fabricated anchors clause", descPrompt, "emit no diffhunk links at all");
  expectIncludes("combined keeps no-fabrication clause", prompt, "emit no diffhunk links at all");
}

const ANCHOR = "diff-" + "a".repeat(64);

function fc(path: string, additions: number, deletions: number, diffAnchor = ANCHOR): FileChange {
  return { path, type: "modified", additions, deletions, diffAnchor };
}

function hunks(count: number): GitHubHunkRange[] {
  const ranges: GitHubHunkRange[] = [];
  for (let i = 0; i < count; i++) {
    ranges.push({ rightStart: 5 + i * 10, rightCount: 6 });
  }
  return ranges;
}

function testAnchorsRequireHunks(): void {
  // A bare file anchor with no parsed hunks is degenerate: nothing may be
  // offered, emitted, or counted for it.
  expectMatch("anchors without hunks are not usable", hasUsableAnchors([fc("src/a.ts", 5, 1)], null), false);
  expectMatch("hunkless anchors count as zero supply", countUsableAnchors([fc("src/a.ts", 5, 1)], null), 0);
  const empty = buildAnchorsSection([fc("src/a.ts", 5, 1)], null);
  expectMatch("hunkless file emits no entry", empty.includes("src/a.ts"), false);
}

function testAnchorEmissionRoundTrip(): void {
  // Every emitted [[N]](diffhunk://...) marker must be hunk-scoped and must
  // resolve through linkify — emission format and DIFFHUNK_LINK must agree.
  const hunkRanges: GitHubHunksByFile = { "src/a.ts": hunks(2) };
  const section = buildAnchorsSection([fc("src/a.ts", 9, 1)], hunkRanges);
  expectIncludes("file entry is hunk-scoped", section, "](diffhunk://#" + ANCHOR + "_L5-R10)");
  expectIncludes("hunk lines are hunk-scoped", section, "[[1]](diffhunk://#" + ANCHOR + "_L5-R10)");
  const markers = section.match(/\[\[\d+\]\]\(diffhunk:\/\/[^)]*\)/g) ?? [];
  expectMatch("emitted markers exist", markers.length > 0, true);
  const resolved = resolveDiffLinks(markers.join(" "), { owner: "o", repo: "r", kind: "pull", prNumber: "1" });
  expectMatch("all emitted markers resolve", resolved.includes("diffhunk://"), false);
  expectIncludes("resolved marker is hunk-scoped", resolved, "#" + ANCHOR + "R5-R10");
}

function testAnchorCapsAndNoise(): void {
  // Noise files (lockfiles etc.) are filtered before ranking, and each file
  // lists at most MAX_HUNKS_PER_FILE hunks with a "+N more" note.
  const lock = fc("package-lock.json", 9999, 9999, "diff-" + "c".repeat(64));
  const real = fc("src/real.ts", 4, 2);
  const hunkRanges: GitHubHunksByFile = { "package-lock.json": hunks(1), "src/real.ts": hunks(MAX_HUNKS_PER_FILE + 3) };
  const section = buildAnchorsSection([lock, real], hunkRanges);
  expectMatch("noise file excluded from ranking", section.includes("package-lock.json"), false);
  expectIncludes("noise file excluded from unanchored path too", section, "src/real.ts");
  const hunksListed = (section.match(new RegExp("diffhunk://#" + ANCHOR, "g")) ?? []).length;
  expectMatch("per-file hunk cap respected", hunksListed, MAX_HUNKS_PER_FILE + 1);
  expectIncludes("excess hunks folded into a note", section, "(+3 more hunks");
}

const TEMPLATE_STYLE: RepoStyle = {
  template: K8S_TEMPLATE,
  titleStyle: null,
  exampleTitles: [],
  length: null,
  templateHeavy: true,
  aiDisclosure: false,
};

function testEmbeddedTitleSanitization(): void {
  const hostile = 'evil "quoted" title\nINJECTED-LINE';
  for (const [label, prompt] of [
    ["title-only", buildTitleOnlyPrompt("SUMMARY\n", hostile)],
    ["description-only", buildDescriptionOnlyPrompt("SUMMARY\n", hostile, "")],
    ["merge title", buildMergeTitlePrompt("SUMMARY\n", hostile, "")],
    ["merge description", buildMergeDescriptionPrompt("SUMMARY\n", hostile, "", "", "")],
  ] as const) {
    expectIncludes(label + " title quotes softened", prompt, "evil 'quoted' title");
    expectIncludes(label + " title newline stripped", prompt, "titleINJECTED-LINE");
    expectExcludes(label + " title cannot inject lines", prompt, "\nINJECTED-LINE");
  }
}

function testTemplateFillRuleGating(): void {
  const rule = "fill in its sections instead of using the section structure above";
  expectExcludes("empty combined prompt omits template-fill rule", buildCombinedPrompt("SUMMARY\n", ""), rule);
  expectIncludes("body-bearing combined prompt keeps rule", buildCombinedPrompt("SUMMARY\n", AUTHORED_BODY), rule);
  expectIncludes(
    "style-template combined prompt keeps rule",
    buildCombinedPrompt("SUMMARY\n", "", TEMPLATE_STYLE),
    rule,
  );
  expectExcludes(
    "empty description-only prompt omits template-fill rule",
    buildDescriptionOnlyPrompt("SUMMARY\n", "", ""),
    rule,
  );
  expectIncludes(
    "body-bearing description-only prompt keeps rule",
    buildDescriptionOnlyPrompt("SUMMARY\n", "", AUTHORED_BODY),
    rule,
  );
}

console.log("=== Render-Quality Prompt Assertions ===\n");
testSummaryWording();
testChangesAndWalkthroughWording();
testTestingWording();
testFormattingContractRules();
testTemplateEtiquette();
testAnchorDiscipline();
testAnchorsRequireHunks();
testAnchorEmissionRoundTrip();
testAnchorCapsAndNoise();
testEmbeddedTitleSanitization();
testTemplateFillRuleGating();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All render-quality prompt assertions passed");
