import { probeMergeDialogFields } from "./merge-fields";

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

  // Primary: the merge dialog's wrapper class (minified; matched
  // hash-agnostically because the suffix rotates with each Primer release).
  if (document.querySelector('[class*="ConfirmMerge"]')) return true;

  // Fallback: live scan of the dialog fields. Reads the current .value
  // property (React hydration drops the original value= attribute) and
  // avoids locale-dependent UI copy such as placeholder text.
  const probe = probeMergeDialogFields();
  return probe.hasTitle && probe.hasDescription;
}
