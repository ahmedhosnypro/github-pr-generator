import { buildCombinedPrompt } from "../src/background/prompts/combined";
import { buildDescriptionOnlyPrompt } from "../src/background/prompts/pr-prompts";
import { expectIncludes, expectMatch, getFailures } from "./expect-helpers";
import { K8S_TEMPLATE } from "./fixtures";

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

console.log("=== Render-Quality Prompt Assertions ===\n");
testSummaryWording();
testChangesAndWalkthroughWording();
testTestingWording();
testFormattingContractRules();
testTemplateEtiquette();
testAnchorDiscipline();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All render-quality prompt assertions passed");
