export function isPRCreationPage(): boolean {
  const url = window.location.href;
  const hasTitle = Boolean(document.querySelector('input[name="pull_request[title]"]'));
  const hasBody = Boolean(document.querySelector("textarea#pull_request_body"));
  return url.includes("github.com") && (url.includes("/compare/") || url.includes("/pull/")) && hasTitle && hasBody;
}

export function isPROpenedPage(): boolean {
  const url = window.location.href;
  if (!url.includes("github.com")) return false;
  if (url.includes("/compare/") || /\/pull\/\d+\/edit/.test(url)) return false;
  if (!/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url)) return false;
  const pathParts = window.location.pathname.split("/").filter((p) => p.length > 0);
  if (pathParts.length > 4) return false;
  const hasTitle = Boolean(document.querySelector('[data-component="PH_Title"] span.markdown-title'));
  return hasTitle;
}

export function isMergeConfirmationPage(): boolean {
  const url = window.location.href;
  if (!url.includes("github.com")) return false;
  if (!/github\.com\/[^/]+\/[^/]+\/pull\/\d+/.test(url)) return false;

  // GitHub's merge dialog uses React components with auto-generated IDs
  // Look for the confirm merge container or the input/textarea patterns
  const hasConfirmMerge = Boolean(document.querySelector('[class*="ConfirmMerge"]'));
  const hasMergeInput = Boolean(
    document.querySelector('input[data-component="input"][type="text"][value*="Merge pull request"]'),
  );
  const hasMergeTextarea = Boolean(
    document.querySelector('textarea[class*="prc-Textarea-TextArea"], textarea[placeholder*="extended description"]'),
  );
  return hasConfirmMerge || (hasMergeInput && hasMergeTextarea);
}
