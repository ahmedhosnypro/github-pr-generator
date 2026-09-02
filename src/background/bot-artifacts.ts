import { isLikelyTemplate } from "./prompts/common";

// Machine-generated artifacts an LLM might hallucinate into a description
// (analysis/pull-requests/implementation-plan.md Phase D; corpus anatomy:
// comment marker → "## Summary by <tool>" → **Category** bullets → badge/footer,
// plus copyberry footers and copybara "Automated Code Change" bodies).
// Implemented as per-line classifiers (simple linear regexes) rather than
// multi-line backtracking patterns, so template content is never re-flowed.

const GENERATED_CREDIT = /\b(?:generated|created|produced|written)\s+(?:by|with|using)\b/i;
const CREDIT_TOOL = /\b(?:CodeRabbit|cubic|Greptile|Copilot|Claude|ChatGPT|Gemini|LLM|AI assistant)\b/i;
const HEADER_TOOL = /\bby\s+(?:CodeRabbit|cubic|Greptile|GitHub Copilot|AI assistant|ellipsis)\b/i;
const TRAILER_TOOL = /\b(?:CodeRabbit|coderabbitai|cubic|Greptile|Copilot|bot)\b/i;
const CATEGORY_BULLET = /\*\*(?:Bug Fixes|New Features|Documentation|Enhancements|Chores)\*\*/i;
const BADGE_ONLY = /^(?:!\[[^\]]*\]\([^)]*\)|\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\))$/;

// Rubber-stamped "tested/verified" checklist lines (AutoGPT/x1xhlol anti-pattern).
// Removed only from non-template output — a real template's checklist is
// legitimate boilerplate that must survive byte-for-byte.
function isRubberStampLine(line: string): boolean {
  return /^[-*]\s+\[[ x]\]\s+/i.test(line) && /\b(?:tested|verified|validated)\b/i.test(line);
}

function isBotLine(line: string): boolean {
  const trimmed = line.trim();
  if (/^#{1,6}\s/.test(trimmed) && HEADER_TOOL.test(line)) return true;
  if (GENERATED_CREDIT.test(line) && CREDIT_TOOL.test(line)) return true;
  if (/^(?:Co-Authored-By|Assisted-by|Authored-by|Signed-off-by)\s*:/i.test(trimmed) && TRAILER_TOOL.test(line)) {
    return true;
  }
  if (CATEGORY_BULLET.test(line)) return true;
  if (/^Automated Code Change$/i.test(trimmed)) return true;
  return BADGE_ONLY.test(trimmed);
}

/**
 * Remove hallucinated bot/AI-tool signatures from a generated description.
 * Conservative by design: when the text looks like a preserved PR template
 * (headers + HTML comments/checkboxes), checklist lines are left untouched
 * and only unambiguous tool markers are removed. A bot-authored heading
 * (e.g. "## Summary by CodeRabbit") also swallows its own section content
 * up to the next heading — but never anything beyond it.
 */
export function stripBotArtifacts(description: string): string {
  const templateLike = isLikelyTemplate(description);
  // Whole-comment markers are harmless inline too — strip them everywhere first.
  const text = description.replaceAll(/<!--\s*(?:copyberry-projection-id|coderabbit|greptile)[^>]*-->/gi, "");
  const kept: string[] = [];
  let inBotSection = false;
  for (const line of text.split("\n")) {
    if (/^#{1,6}\s/.test(line.trim())) {
      inBotSection = HEADER_TOOL.test(line);
      if (inBotSection) continue;
    } else if (inBotSection && line.trim() !== "") {
      // Content lines of a bot-authored section — drop until next heading.
      continue;
    }
    if (isBotLine(line)) continue;
    if (!templateLike && isRubberStampLine(line)) continue;
    kept.push(line);
  }
  const cleaned = kept.join("\n");
  // Untouched input returns as-is so template fidelity stays byte-for-byte.
  if (cleaned === description) return description;
  // Collapse blank-line runs left behind by removals.
  return cleaned.replace(/\n{3,}/g, "\n\n").trim();
}
