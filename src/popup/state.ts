/**
 * Autosave guard: per-field persistence is ignored until the initial
 * loadSettings() pass has written the stored values into the inputs,
 * otherwise the untouched inputs would clobber storage on popup open.
 */
let loaded = false;

export function isLoaded(): boolean {
  return loaded;
}

export function markLoaded(): void {
  loaded = true;
}
