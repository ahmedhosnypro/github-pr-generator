// Selector matching for tests/dom-stub-element.ts: a compact engine covering
// the selector shapes the src/content scripts actually use — tag/#id/.class,
// attribute presence/[=,^=,$=,*=,~=], :not(), :scope > child, comma groups
// and descendant combinators. Values are compared against StubElement attrs.
//
// Imports StubElement type-only so there is no runtime cycle with the element module.
import type { StubElement } from "./dom-stub-element";

export type Matcher = (el: StubElement) => boolean;

function matchAttr(el: StubElement, name: string, op: string | undefined, value: string): boolean {
  const actual = el.attrs.get(name);
  if (op === undefined) return actual !== undefined;
  if (actual === undefined) return false;
  switch (op) {
    case "=":
      return actual === value;
    case "^=":
      return actual.startsWith(value);
    case "$=":
      return actual.endsWith(value);
    case "*=":
      return actual.includes(value);
    case "~=":
      return actual.split(/\s+/).includes(value);
    default:
      return false;
  }
}

// Quoted attribute values only appear double-quoted in the src selectors.
const ATTR_RE = /^\[\s*([\w-]+)\s*(?:([~|^$*]?=)\s*"([^"]*)")?\s*\]/;
const TAG_RE = /^([a-zA-Z][\w-]*|\*)/;
const ID_RE = /^#([\w-]+)/;
const CLASS_RE = /^\.([\w-]+)/;
const NOT_RE = /^:not\(((?:[^()]|\([^()]*\))*)\)/;

function consumeAttr(part: string, matchers: Matcher[]): number | null {
  const m = ATTR_RE.exec(part);
  if (m === null) return null;
  const name = m[1] ?? "";
  const op = m[2];
  const value = m[3] ?? "";
  matchers.push((el) => matchAttr(el, name, op, value));
  return m[0].length;
}

function consumeNot(part: string, matchers: Matcher[]): number | null {
  const m = NOT_RE.exec(part);
  if (m === null) return null;
  const inner = compileSimple(m[1] ?? "");
  matchers.push((el) => !inner(el));
  return m[0].length;
}

function consumeToken(part: string, matchers: Matcher[]): number {
  const tagM = TAG_RE.exec(part);
  if (tagM !== null) {
    const tag = tagM[1] ?? "*";
    if (tag !== "*") {
      const upper = tag.toUpperCase();
      matchers.push((el) => el.tagName === upper);
    }
    return tagM[0].length;
  }
  const idM = ID_RE.exec(part);
  if (idM !== null) {
    const id = idM[1] ?? "";
    matchers.push((el) => el.attrs.get("id") === id);
    return idM[0].length;
  }
  const classM = CLASS_RE.exec(part);
  if (classM !== null) {
    const cls = classM[1] ?? "";
    matchers.push((el) => el.classNameList.includes(cls));
    return classM[0].length;
  }
  const attrLen = consumeAttr(part, matchers);
  if (attrLen !== null) return attrLen;
  const notLen = consumeNot(part, matchers);
  if (notLen !== null) return notLen;
  throw new Error("dom-stub: unsupported selector part: " + part);
}

export function compileSimple(part: string): Matcher {
  const matchers: Matcher[] = [];
  let rest = part;
  while (rest.length > 0) {
    rest = rest.slice(consumeToken(rest, matchers));
  }
  return (el) => matchers.every((mm) => mm(el));
}

// Splits on the delimiter (comma, or whitespace for descendant combinators)
// while respecting quotes and []/() nesting — e.g. the attribute value in
// 'textarea[placeholder*="extended description"]' must not split the part.
function splitTopLevel(input: string, comma: boolean): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = "";
  for (const ch of input) {
    if (quote !== null) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
      continue;
    }
    if (ch === "[" || ch === "(") depth++;
    if (ch === "]" || ch === ")") depth--;
    if (depth === 0 && (comma ? ch === "," : /\s/.test(ch))) {
      if (cur.trim().length > 0) parts.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur.trim().length > 0) parts.push(cur.trim());
  return parts;
}

export function walk(root: StubElement, includeRoot: boolean): StubElement[] {
  const out: StubElement[] = [];
  const visit = (el: StubElement): void => {
    out.push(el);
    for (const c of el.children) visit(c);
  };
  if (includeRoot) visit(root);
  else for (const c of root.children) visit(c);
  return out;
}

function matchesAncestors(el: StubElement, ancestorMs: Matcher[]): boolean {
  let idx = ancestorMs.length - 1;
  for (let cur = el.parentNode; cur !== null && idx >= 0; cur = cur.parentNode) {
    if (ancestorMs[idx]?.(cur) === true) idx--;
  }
  return idx < 0;
}

export function queryAll(root: StubElement, selector: string, includeRoot: boolean): StubElement[] {
  const results: StubElement[] = [];
  for (const groupRaw of splitTopLevel(selector, true)) {
    let group = groupRaw;
    let childrenOnly = false;
    if (group.startsWith(":scope")) {
      const after = group.slice(":scope".length).trim();
      if (after.startsWith(">")) {
        childrenOnly = true;
        group = after.slice(1).trim();
      } else if (after.length > 0) {
        group = after;
      } else {
        continue;
      }
    }
    const parts = splitTopLevel(group, false);
    const last = parts[parts.length - 1];
    if (last === undefined) continue;
    const finalMatch = compileSimple(last);
    const ancestorMs = parts.slice(0, -1).map(compileSimple);
    const candidates = childrenOnly ? root.children : walk(root, includeRoot);
    for (const el of candidates) {
      if (!finalMatch(el)) continue;
      if (!matchesAncestors(el, ancestorMs)) continue;
      if (!results.includes(el)) results.push(el);
    }
  }
  return results;
}
