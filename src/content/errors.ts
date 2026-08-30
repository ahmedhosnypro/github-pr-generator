/** Format helpers for unknown catch values (strict mode type-safety). */

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export function errorStack(err: unknown): string {
  return err instanceof Error ? (err.stack ?? "") : "";
}
