// Shared test fixtures: a kubernetes-style template body (headers, HTML
// comments, checkboxes) used across the prompt-logic, prompt-format, and parse suites.
export const K8S_TEMPLATE =
  "## What this PR does\n<!-- tell us why; keep it short -->\n- [ ] Tests added\n- [ ] Docs updated\n\n#### Special notes for your reviewer:\n";

// A hand-authored (non-template) existing body.
export const AUTHORED_BODY = "Fixes the crash on startup.\n\nThe null check was missing in init().";
