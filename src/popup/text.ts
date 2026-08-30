/** Strips trailing slashes from a URL ( `/+$/` without the super-linear regex ). */
export function stripTrailingSlashes(url: string): string {
  let result = url;
  while (result.endsWith("/")) {
    result = result.substring(0, result.length - 1);
  }
  return result;
}
