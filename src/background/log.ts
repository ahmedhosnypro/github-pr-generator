export function logMsg(msg: string): void {
  console.log("[PR Generator BG v8] " + msg);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
