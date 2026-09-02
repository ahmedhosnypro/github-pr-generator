import { stripBotArtifacts } from "../src/background/bot-artifacts";
import { buildCombinedPrompt as buildSrcCombinedPrompt } from "../src/background/prompts/combined";
import { isLikelyTemplate } from "../src/background/prompts/common";
import { buildMergeDescriptionPrompt, buildMergeTitlePrompt } from "../src/background/prompts/merge-prompts";
import { buildDescriptionOnlyPrompt, buildTitleOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { buildHouseStyleNote, type RepoStyle } from "../src/background/repo-style";
import { expectExcludes, expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import { AUTHORED_BODY, K8S_TEMPLATE } from "./fixtures";
import { buildCombinedPrompt as buildMirrorCombinedPrompt } from "./prompt-mirror";

const TWO_HEADER_BODY = "## Notes\nsome context\n\n## More\nextra detail\n";

const COLON_PREFIX_STYLE: RepoStyle = {
  template: null,
  titleStyle: "colon-prefix",
  exampleTitles: ["zlib: avoid waiting for paused ZIP iterators", "sessions: Show chat status on its own row"],
  length: "S",
  templateHeavy: true,
  aiDisclosure: false,
};

const TEMPLATE_STYLE: RepoStyle = {
  template: K8S_TEMPLATE,
  titleStyle: null,
  exampleTitles: [],
  length: null,
  templateHeavy: true,
  aiDisclosure: false,
};

function bodyKind(body: string): string {
  if (body === "") return "empty body";
  if (isLikelyTemplate(body)) return "template body";
  return "authored body";
}

function testMirrorDrift(): void {
  for (const body of ["", K8S_TEMPLATE, AUTHORED_BODY]) {
    expectMatch(
      `mirror matches src (${bodyKind(body)})`,
      buildMirrorCombinedPrompt("SUMMARY\n", body),
      buildSrcCombinedPrompt("SUMMARY\n", body),
    );
  }
}

function testTemplateDetection(): void {
  expectMatch("kubernetes-style template detected", isLikelyTemplate(K8S_TEMPLATE), true);
  expectMatch("checkbox+header scaffold detected", isLikelyTemplate("## Checklist\n- [x] tested\n"), true);
  expectMatch("multi-header scaffold detected", isLikelyTemplate(TWO_HEADER_BODY), true);
  expectMatch("authored prose not a template", isLikelyTemplate(AUTHORED_BODY), false);
  expectMatch("single header alone not a template", isLikelyTemplate("## Notes\njust one section\n"), false);
  expectMatch("empty body not a template", isLikelyTemplate(""), false);
}

function testExistingContentModes(): void {
  const templatePrompt = buildSrcCombinedPrompt("SUMMARY\n", K8S_TEMPLATE);
  expectIncludes("template mode preserves byte-for-byte", templatePrompt, "byte-for-byte");
  expectIncludes("template body echoed verbatim", templatePrompt, "<!-- tell us why; keep it short -->");
  const authoredPrompt = buildSrcCombinedPrompt("SUMMARY\n", AUTHORED_BODY);
  expectIncludes("authored mode is light-touch", authoredPrompt, "Only complete missing parts");
  expectIncludes("authored mode forbids restructuring", authoredPrompt, "do not restructure or rewrite");
}

function testCorpusWording(): void {
  const prompt = buildSrcCombinedPrompt("SUMMARY\n", "");
  expectIncludes("A1 small-diff scaling present", prompt, "scaled to the change");
  expectIncludes("A1 commit coverage still mandatory", prompt, "MUST cover every commit");
  expectIncludes("A2 root-cause-first present", prompt, "root cause in one line");
  expectIncludes("A4 copy-pasteable verification present", prompt, "copy-pasteable");
  expectExcludes("A3 no hardcoded Breaking Changes section", prompt, "## Breaking Changes\nAny");
  expectIncludes("A3 conditional breaking rule present", prompt, "genuinely breaks API/behavior");
  expectIncludes("A7 bot-imitation ban present", prompt, "Do NOT imitate bot output");
  expectIncludes("A11 scope-boundary rule present", prompt, "deliberately NOT changed");
  expectIncludes("A12 no-placeholder rule present", prompt, "'{your_pr_number}'");
  expectIncludes("A12 intent-title rule present", prompt, "describe the intent of the change");
  expectIncludes("A5 issue linking rule present", prompt, "'Part of #123'");
}

function testTitleAndDescriptionPrompts(): void {
  const title = buildTitleOnlyPrompt("SUMMARY\n", "");
  expectIncludes("A8 flexible title style present", title, "Match the repo's title style");
  expectIncludes("A8 conventional commit fallback kept", title, "otherwise default to conventional commits");
  expectExcludes("fresh title prompt omits existing-title section", title, "## Existing Title");
  expectExcludes("fresh title prompt never mentions the current title", title, "Fix flaky login retry");
  const improve = buildTitleOnlyPrompt("SUMMARY\n", "Fix flaky login retry");
  expectIncludes("improve prompt includes existing-title section", improve, "## Existing Title");
  expectIncludes("improve prompt asks for an improved version", improve, "Generate an improved version");
  const freshVariant = buildTitleOnlyPrompt("SUMMARY\n", "", undefined, "the user-facing behavior");
  expectIncludes("fresh prompt demands a brand-new title", freshVariant, "## Fresh Title");
  expectIncludes("fresh prompt names the angle", freshVariant, "the user-facing behavior");
  expectExcludes("fresh prompt has no existing-title section", freshVariant, "## Existing Title");
  expectExcludes("improve prompt has no fresh section", improve, "## Fresh Title");
  const desc = buildDescriptionOnlyPrompt("SUMMARY\n", "t", "");
  expectIncludes("description-only shares corpus rules", desc, "Do NOT imitate bot output");
  expectIncludes("description-only keeps commit coverage", desc, "MUST cover every commit");
}

function testRepoStyleNotes(): void {
  const note = buildHouseStyleNote(COLON_PREFIX_STYLE);
  expectIncludes("note mentions colon-prefix titles", note, "colon prefix");
  expectIncludes("note quotes a real merged title", note, "zlib: avoid waiting for paused ZIP iterators");
  expectIncludes("note mentions short descriptions", note, "very short descriptions");
  expectIncludes("note flags template-heavy repo", note, "template fidelity is critical");
  const empty = buildHouseStyleNote({
    template: null,
    titleStyle: null,
    exampleTitles: [],
    length: null,
    templateHeavy: false,
    aiDisclosure: false,
  });
  expectMatch("empty style gives no note", empty, "");
  const prompt = buildSrcCombinedPrompt("SUMMARY\n", "", COLON_PREFIX_STYLE);
  expectIncludes("house style injected into prompt", prompt, "## House Style");
  expectExcludes("no house style without style", buildSrcCombinedPrompt("SUMMARY\n", ""), "## House Style");
}

function testDiscoveredTemplateInjection(): void {
  const prompt = buildSrcCombinedPrompt("SUMMARY\n", "", TEMPLATE_STYLE);
  expectIncludes("discovered template block present", prompt, "## Repository PR Template");
  expectIncludes("discovered template echoed verbatim", prompt, "<!-- tell us why; keep it short -->");
  expectIncludes("template path keeps commit coverage", prompt, "Commit Coverage still applies");
  expectExcludes("template replaces default skeleton", prompt, "## Walkthrough\n");
  const descPrompt = buildDescriptionOnlyPrompt("SUMMARY\n", "", "", TEMPLATE_STYLE);
  expectIncludes("description-only injects template", descPrompt, "## Repository PR Template");
  expectExcludes("description-only skips skeleton", descPrompt, "## Walkthrough\n");
  const withBody = buildSrcCombinedPrompt("SUMMARY\n", AUTHORED_BODY, TEMPLATE_STYLE);
  expectExcludes("existing body wins over discovered template", withBody, "## Repository PR Template");
}

function testBotStrippingSmoke(): void {
  const withBot = "## Summary\nReal fix.\n\n## Summary by CodeRabbit\n\n**Bug Fixes**\n- bullet\n";
  const cleaned = stripBotArtifacts(withBot);
  expectExcludes("bot header stripped", cleaned, "CodeRabbit");
  expectExcludes("category bullet header stripped", cleaned, "**Bug Fixes**");
  expectIncludes("real content kept", cleaned, "Real fix.");
  expectMatch("kubernetes template survives stripping", stripBotArtifacts(K8S_TEMPLATE), K8S_TEMPLATE);
}

function testScreenshotsHint(): void {
  const uiSummary = "## Changed Files\n\n- M popup/popup.css (+3/-1)\n- A src/popup/panel.tsx (+40/-0)\n";
  expectIncludes(
    "UI-dominated combined prompt gets hint",
    buildSrcCombinedPrompt(uiSummary, ""),
    "## Screenshots Hint",
  );
  expectIncludes(
    "hint forbids fabricated screenshots",
    buildSrcCombinedPrompt(uiSummary, ""),
    "Never fabricate screenshots",
  );
  expectIncludes(
    "description-only prompt gets hint",
    buildDescriptionOnlyPrompt(uiSummary, "", ""),
    "## Screenshots Hint",
  );
  const codeSummary = "## Changed Files\n\n- M src/background/parse.ts (+3/-1)\n- M src/types.ts (+1/-0)\n";
  expectExcludes("code-only prompt gets no hint", buildSrcCombinedPrompt(codeSummary, ""), "## Screenshots Hint");
  expectExcludes(
    "summary without file section gets no hint",
    buildSrcCombinedPrompt("SUMMARY\n", ""),
    "## Screenshots Hint",
  );
  expectExcludes("title-only prompt never gets hint", buildTitleOnlyPrompt(uiSummary, ""), "## Screenshots Hint");
}

function testSizeTierNote(): void {
  const small = "## Stats\n\n- 2 changed files\n- 10 additions\n- 5 deletions\n";
  expectIncludes("small diff gets compact directive", buildSrcCombinedPrompt(small, ""), "## Size Tier — Small Change");
  const large = "## Stats\n\n- 40 changed files\n- 800 additions\n- 300 deletions\n";
  expectIncludes(
    "large diff gets full-skeleton note",
    buildSrcCombinedPrompt(large, ""),
    "## Size Tier — Large Change",
  );
  const mid = "## Stats\n\n- 10 changed files\n- 100 additions\n- 50 deletions\n";
  expectExcludes("mid-range diff gets no tier note", buildSrcCombinedPrompt(mid, ""), "## Size Tier —");
  expectExcludes("stats-less summary gets no note", buildSrcCombinedPrompt("SUMMARY\n", ""), "## Size Tier —");
  expectExcludes("title-only prompt never gets tier note", buildTitleOnlyPrompt(small, ""), "## Size Tier —");
}

function testMergePrompts(): void {
  const title = buildMergeTitlePrompt("SUMMARY\n", "fix: the old title", "old merge title");
  expectIncludes(
    "merge title includes existing merge title",
    title,
    'The current merge commit title is: "old merge title"',
  );
  expectIncludes("merge title cites PR title as reference", title, 'The pull request title is: "fix: the old title"');
  expectIncludes("merge title shares title-style guidance", title, "Match the repo's title style");
  expectIncludes("merge title includes intent rule", title, "intent of the change");
  const desc = buildMergeDescriptionPrompt("SUMMARY\n", "fix: x", "PR body text", "merge t", "merge d");
  expectIncludes("merge desc includes existing merge desc", desc, "merge d");
  expectExcludes("merge desc omits title line instruction", desc, "## Existing Merge Commit Title\nThe current");
  expectIncludes("merge desc tells model not to use diffhunk links", desc, "Do NOT include diff hunk references");
}

console.log("=== Prompt & Logic Unit Tests ===\n");
testMirrorDrift();
testTemplateDetection();
testExistingContentModes();
testCorpusWording();
testTitleAndDescriptionPrompts();
testRepoStyleNotes();
testDiscoveredTemplateInjection();
testBotStrippingSmoke();
testScreenshotsHint();
testSizeTierNote();
testMergePrompts();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All prompt logic checks passed");
