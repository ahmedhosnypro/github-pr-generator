// Shared assertion helpers for console-based test scripts (tests/parse.ts,
// tests/prompt-logic.ts). Failures are accumulated module-side; each script
// reads the count via getFailures() at the end to decide its exit code.

let failures = 0;

export function expectMatch(name: string, actual: unknown, expected: unknown): void {
  if (actual === expected) {
    console.log(`✅ ${name}`);
  } else {
    console.log(`❌ ${name}`);
    failures++;
  }
}

export function expectIncludes(name: string, haystack: string, needle: string): void {
  expectMatch(name, haystack.includes(needle), true);
}

export function expectExcludes(name: string, haystack: string, needle: string): void {
  expectMatch(name, haystack.includes(needle), false);
}

export function getFailures(): number {
  return failures;
}
