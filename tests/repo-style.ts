import type { PrSample } from "../src/background/repo-style";
import { inferLength, inferRepoStyle, inferTitleStyle } from "../src/background/repo-style";
import { expectMatch, getFailures } from "./expect-helpers";

// Real merged titles from the analysis corpus (analysis/pull-requests/).
const CC_TITLES = [
  "fix(hysteria2): default the port to 443 when the share URI omits it",
  "perf(backend): cache redundant active-subscription lookups",
  "refactor(editor): Extract frontend test helpers into @n8n/frontend-test-utils (no-changelog)",
  "feat(ui): add dark-mode toggle",
  "chore: bump dependencies",
];
const COLON_TITLES = [
  "zlib: avoid waiting for paused ZIP iterators",
  "sessions: Show chat status on its own row",
  "ggml : fix ggml_backend_buft_get_alloc_size() guard",
  "metal: enable fast math for matmul",
];
const BRACKET_TITLES = [
  "[DOM] Copy `source` onto the synthetic toggle event",
  "[0.86] Add feature flag for the new bridge",
  "[ie/applepodcasts] Fix token caching",
  "[XLA:CPU] Fix shape inference for gather",
];
const MIXED_TITLES = [
  "fix: crash on boot",
  "Add export button",
  "[ui] align panels",
  "net: retry once",
  "Update README",
];
const TOO_FEW = ["fix: one", "fix: two", "fix: three"];

function sample(body: string): PrSample {
  return { title: "x", body };
}

function words(n: number): string {
  return Array.from({ length: n }, (_, i) => "word" + String(i)).join(" ");
}

function testTitleStyleInference(): void {
  expectMatch("conventional titles detected", inferTitleStyle(CC_TITLES).style, "conventional");
  expectMatch("colon-prefix titles detected", inferTitleStyle(COLON_TITLES).style, "colon-prefix");
  expectMatch("bracket-prefix titles detected", inferTitleStyle(BRACKET_TITLES).style, "bracket-prefix");
  expectMatch("mixed conventions detected", inferTitleStyle(MIXED_TITLES).style, "mixed");
  expectMatch("insufficient samples give no style", inferTitleStyle(TOO_FEW).style, null);
  expectMatch("empty samples give no style", inferTitleStyle([]).style, null);
  const conv = inferTitleStyle(CC_TITLES);
  expectMatch(
    "examples come from dominant style",
    conv.examples.every((t) => t.includes(":")),
    true,
  );
}

function testLengthInference(): void {
  const small = [10, 20, 30, 15, 25].map((n) => sample(words(n)));
  expectMatch("short bodies infer S", inferLength(small), "S");
  const medium = [60, 100, 150, 90].map((n) => sample(words(n)));
  expectMatch("medium bodies infer M", inferLength(medium), "M");
  const large = [300, 400, 500].map((n) => sample(words(n)));
  expectMatch("long bodies infer L", inferLength(large), "L");
  const boilerplate = sample("<!-- " + words(150) + " -->\n## Summary\n" + words(20) + "\n- [ ] " + words(40));
  const authored = [boilerplate, sample(words(30)), sample(words(10))];
  expectMatch("template boilerplate excluded from word count", inferLength(authored), "S");
  expectMatch("too few bodies give no length", inferLength([sample(words(10)), sample(words(300))]), null);
}

function testRepoStyleAggregation(): void {
  const templateBodies = [
    sample("## Checklist\n<!-- hints -->\n- [ ] test\n- [ ] docs\n## Notes\nfilled"),
    sample("## Checklist\n- [x] test\n- [x] docs\n<!-- more -->\n## Other\nfilled"),
    sample("## A\nx\n## B\ny"),
  ];
  const style = inferRepoStyle("TEMPLATE!", templateBodies.concat(sample("fix: human-authored change")));
  expectMatch("template content passes through", style.template, "TEMPLATE!");
  const heavy = inferRepoStyle("T", templateBodies.concat(sample(words(400))));
  expectMatch("template-heavy detected from scaffold bodies", heavy.templateHeavy, true);
  const freeformBodies = [
    sample(words(50)),
    sample(words(60)),
    sample(words(70)),
    sample(words(80)),
    sample(words(90)),
  ];
  const freeform = inferRepoStyle(null, freeformBodies);
  expectMatch("freeform stream not template-heavy", freeform.templateHeavy, false);
  expectMatch("freeform stream length inferred", freeform.length, "M");
  expectMatch("bots-less empty sample yields nulls", inferRepoStyle(null, []).titleStyle, null);
}

console.log("=== Repo Style Inference Tests ===\n");
testTitleStyleInference();
testLengthInference();
testRepoStyleAggregation();

const failures = getFailures();
if (failures > 0) {
  console.log(`\n❌ ${String(failures)} check(s) FAILED`);
  process.exit(1);
}
console.log("\n✅ All repo-style inference checks passed");
