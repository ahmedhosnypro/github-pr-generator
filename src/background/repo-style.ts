/**
 * Live repo-style inference. Instead of hardcoded per-repo profiles, the
 * extension samples the repo's recently merged PRs (titles + bodies) and its
 * PR template, then derives conventions on the fly. Works for any repository.
 */
import { isLikelyTemplate } from "./prompts/common";

export type TitleStyle = "conventional" | "imperative" | "colon-prefix" | "bracket-prefix" | "mixed";
export type LengthBucket = "S" | "M" | "L";

export interface PrSample {
  title: string;
  body: string;
}

export interface RepoStyle {
  /** The repo's PR template content, discovered from .github/ or repo root. */
  template: string | null;
  /** Dominant merged-PR title convention; null when too little human data. */
  titleStyle: TitleStyle | null;
  /** Representative recently-merged titles (verbatim, dominant style first). */
  exampleTitles: string[];
  /** Typical merged description length; null when too little human data. */
  length: LengthBucket | null;
  /** True when most sampled merged PRs follow a template scaffold. */
  templateHeavy: boolean;
}

export const EMPTY_REPO_STYLE: RepoStyle = {
  template: null,
  titleStyle: null,
  exampleTitles: [],
  length: null,
  templateHeavy: false,
};

const CONVENTIONAL_TITLE =
  /^(?:feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert|enh|enhancement|hotfix|release)(\([^()]*\))?!?:\s*\S/;
const BRACKET_TITLE = /^\[[^\]]{1,40}\]\s*\S/;
const COLON_TITLE = /^\w[\w ./-]{0,40}:\s*\S/;
const MIN_TITLE_SAMPLE = 4;
const DOMINANT_SHARE = 0.6;

function classifyTitle(title: string): TitleStyle {
  if (CONVENTIONAL_TITLE.test(title)) return "conventional";
  if (BRACKET_TITLE.test(title)) return "bracket-prefix";
  if (COLON_TITLE.test(title)) return "colon-prefix";
  return "imperative";
}

export function inferTitleStyle(titles: string[]): { style: TitleStyle | null; examples: string[] } {
  if (titles.length < MIN_TITLE_SAMPLE) return { style: null, examples: [] };
  const counts = new Map<TitleStyle, number>();
  for (const title of titles) {
    const style = classifyTitle(title);
    counts.set(style, (counts.get(style) ?? 0) + 1);
  }
  let best: TitleStyle = "mixed";
  let bestCount = 0;
  for (const [style, count] of counts) {
    if (count > bestCount) {
      best = style;
      bestCount = count;
    }
  }
  if (bestCount / titles.length < DOMINANT_SHARE) {
    return { style: "mixed", examples: titles.slice(0, 3) };
  }
  return { style: best, examples: titles.filter((t) => classifyTitle(t) === best).slice(0, 3) };
}

// Word count with template boilerplate stripped, so scaffold-heavy repos are
// measured on authored content only (cf. corpus "template-heavy bimodal counts").
// Comment removal is indexOf-based (no multi-line regex backtracking).
function stripHtmlComments(text: string): string {
  let out = "";
  let rest = text;
  let start = rest.indexOf("<!--");
  while (start !== -1) {
    out += rest.slice(0, start);
    const end = rest.indexOf("-->", start + 4);
    if (end === -1) return out;
    rest = rest.slice(end + 3);
    start = rest.indexOf("<!--");
  }
  return out + rest;
}

function authoredWordCount(body: string): number {
  let total = 0;
  for (const line of stripHtmlComments(body).split("\n")) {
    if (/^#{1,6}\s/.test(line)) continue;
    if (/^[-*]\s+\[[ x]\]/i.test(line)) continue;
    total += line.split(/\s+/).filter((w) => w.length > 0).length;
  }
  return total;
}

export function inferLength(samples: PrSample[]): LengthBucket | null {
  if (samples.length < 3) return null;
  // oxlint-disable-next-line no-array-sort -- toSorted unavailable (tsconfig targets ES2022); Array.from owns the copy being sorted
  const counts = Array.from(samples, (s) => authoredWordCount(s.body)).sort((a, b) => a - b);
  const median = counts[Math.floor(counts.length / 2)] ?? 0;
  if (median < 50) return "S";
  if (median <= 200) return "M";
  return "L";
}

export function inferRepoStyle(template: string | null, samples: PrSample[]): RepoStyle {
  const { style, examples } = inferTitleStyle(samples.map((s) => s.title));
  const templateBodies = samples.filter((s) => isLikelyTemplate(s.body)).length;
  return {
    template,
    titleStyle: style,
    exampleTitles: examples,
    length: inferLength(samples),
    templateHeavy: samples.length >= 3 && templateBodies / samples.length >= DOMINANT_SHARE,
  };
}

const TITLE_STYLE_TEXT: Record<TitleStyle, string> = {
  conventional: "conventional-commit titles (type(scope): description)",
  imperative: "plain imperative titles with no type prefix (e.g. 'Add X', 'Fix Y')",
  "colon-prefix": "'subsystem: verb' titles (a colon prefix, no type)",
  "bracket-prefix": "'[Area]'/'[version]' bracketed prefix titles",
  mixed: "no single dominant title convention — mirror the style of the commit messages",
};

const LENGTH_TEXT: Record<LengthBucket, string> = {
  S: "very short descriptions are the norm (often under ~50 words); a one-liner with the key facts merges here",
  M: "moderate-length descriptions are the norm (~50-200 words)",
  L: "detailed, evidence-rich descriptions are the norm (200+ words when warranted)",
};

export function buildHouseStyleNote(style: RepoStyle): string {
  if (!style.titleStyle && !style.length && !style.templateHeavy) return "";
  let note = "## House Style (inferred from this repo's recently merged PRs)\n";
  if (style.titleStyle) {
    note += "- Titles here use " + TITLE_STYLE_TEXT[style.titleStyle] + ".\n";
    for (const example of style.exampleTitles) {
      note += '  - e.g. "' + example + '"\n';
    }
  }
  if (style.length) {
    note += "- Descriptions: " + LENGTH_TEXT[style.length] + ".\n";
  }
  if (style.templateHeavy) {
    note +=
      "- Most merged PRs follow the repo's PR template — template fidelity is critical; preserve all boilerplate byte-for-byte, including HTML comments and checkboxes.\n";
  }
  return note + "\n";
}
