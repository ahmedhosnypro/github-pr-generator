import { buildHouseStyleNote, type RepoStyle } from "../repo-style";
import { buildExistingContentSection, buildScreenshotsHint, buildSizeTierNote, buildTemplateFillBlock } from "./common";

/**
 * Assembles the description-body blocks shared by the combined and
 * description-only prompts: the existing-content/template-fill branch, the
 * house-style note, and the screenshots/size-tier hints derived from the
 * changes summary. Also reports whether an existing body was present, since
 * both callers use that to decide between SECTIONS_PROMPT and the
 * template-fill rule.
 */
export function buildDescriptionBodyBlocks(
  changesSummary: string,
  existingBody: string,
  style?: RepoStyle,
): { blocks: string; hasExistingBody: boolean } {
  const hasExistingBody = existingBody.trim().length > 0;
  let blocks = "";
  if (hasExistingBody) {
    blocks += buildExistingContentSection(existingBody);
  } else if (style?.template) {
    blocks += buildTemplateFillBlock(style.template);
  }

  if (style) {
    blocks += buildHouseStyleNote(style);
  }

  blocks += buildScreenshotsHint(changesSummary);
  blocks += buildSizeTierNote(changesSummary);
  return { blocks, hasExistingBody };
}
