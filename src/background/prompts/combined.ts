import { SECTIONS_PROMPT } from "./common";

export function buildCombinedPrompt(changesSummary: string, existingBody: string): string {
  let prompt = "Generate a GitHub pull request title and description for the following changes.\n\n";
  prompt += changesSummary + "\n";

  if (existingBody && existingBody.trim().length > 0) {
    prompt += "## Existing Content in Description Field\n";
    prompt +=
      "The user already has the following content in the description field. Respect its structure — keep its headers, fill in its sections, and do not remove any existing content:\n\n";
    prompt += existingBody + "\n\n";
  }

  prompt += "OUTPUT FORMAT:\n";
  prompt +=
    '1. First line: PR title only (conventional commit format, e.g. "feat: add JWT auth", "fix: resolve token expiry", "refactor: extract validation logic"). Under 72 characters. No quotes, no markdown, no prefix like "Title:".\n';
  prompt += "2. Empty line.\n";
  prompt += "3. PR description body as structured markdown.\n\n";

  if (!existingBody || existingBody.trim().length === 0) {
    prompt += SECTIONS_PROMPT;
  }

  prompt += "RULES:\n";
  prompt += combinedRules();
  return prompt;
}

function combinedRules(): string {
  return [
    "- Be specific — reference actual code entities from the diff, not generic descriptions\n",
    "- In the Changes and Walkthrough sections, **add diff hunk reference links for every file you mention**: Format: `[[N]](diffhunk://ANCHOR_Lstart-Rend)` (e.g., `[[1]](diffhunk://#diff-4a5d3f2_L5-R25)`) using the reference numbers from the Anchors section. **Use only right-side line ranges** (L5-R25 means lines 5-25 in the new file). Add 1+ references per file.\n",
    '- Do NOT start with filler like "This PR introduces..." or "In this pull request..."\n',
    "- Do NOT wrap the output in backtick fences\n",
    "- Do NOT add meta-commentary about the description itself\n",
    "- **Examples**:",
    "  ✅ ✔️ `src/auth.ts` — Added JWT token validation. [[1]](diffhunk://#diff-46b776ea_L5-R25)\n",
    "  ✅ ✔️ Updated loading backgrounds in `loading.tsx` to use theme variables. [[2]](diffhunk://#diff-b688a522_L10-R30), [[3]](diffhunk://#diff-b688a522_L40-R80)\n",
    "  ❌ ❌ **Don't:** Many files updated to fix dark mode theming. (No diff links)\n",
    "- If the user has existing content in the description field (a PR template), fill in its sections instead of using the section structure above\n",
  ].join("");
}
