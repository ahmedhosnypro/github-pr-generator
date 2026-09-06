// Stub element classes for tests/dom-stub.ts — the mini DOM node hierarchy
// (query/event/tree behavior) without any globals. The selector matching lives
// in dom-selector-engine.ts; the chrome/location globals in dom-stub.ts.

import { compileSimple, queryAll } from "./dom-selector-engine";

type StubListener = (ev: { type: string }) => void;

export class StubElement {
  readonly tagName: string;
  readonly attrs = new Map<string, string>();
  children: StubElement[] = [];
  parentNode: StubElement | null = null;
  ownText = "";
  dataset: Record<string, string> = {};
  style: Record<string, string> = {};
  disabled = false;
  scrollTop = 0;
  scrollHeight = 0;
  title = "";
  private valueStore = "";
  private listeners = new Map<string, StubListener[]>();
  private html = "";

  constructor(tag: string) {
    this.tagName = tag.toUpperCase();
  }

  get value(): string {
    return this.valueStore;
  }
  set value(v: string) {
    this.valueStore = v;
  }

  get id(): string {
    return this.attrs.get("id") ?? "";
  }
  set id(v: string) {
    this.attrs.set("id", v);
  }

  get className(): string {
    return this.attrs.get("class") ?? "";
  }
  set className(v: string) {
    this.attrs.set("class", v);
  }

  get classNameList(): string[] {
    return this.className.split(/\s+/).filter((c) => c.length > 0);
  }

  get classList(): {
    add: (...cs: string[]) => void;
    remove: (...cs: string[]) => void;
    contains: (c: string) => boolean;
  } {
    return {
      add: (...cs: string[]) => {
        const cur = new Set(this.classNameList);
        for (const c of cs) cur.add(c);
        this.className = [...cur].join(" ");
      },
      remove: (...cs: string[]) => {
        const drop = new Set(cs);
        this.className = this.classNameList.filter((c) => !drop.has(c)).join(" ");
      },
      contains: (c: string) => this.classNameList.includes(c),
    };
  }

  get textContent(): string {
    return this.ownText + this.children.map((c) => c.textContent).join("");
  }
  set textContent(v: string) {
    this.children = [];
    this.ownText = v;
  }

  get innerText(): string {
    return this.textContent;
  }

  get innerHTML(): string {
    return this.html;
  }
  set innerHTML(v: string) {
    this.html = v;
    this.children = [];
  }

  get nextSibling(): StubElement | null {
    if (this.parentNode === null) return null;
    const idx = this.parentNode.children.indexOf(this);
    return this.parentNode.children[idx + 1] ?? null;
  }

  get parentElement(): StubElement | null {
    return this.parentNode;
  }

  setAttribute(name: string, value: string): void {
    this.attrs.set(name, value);
  }
  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }
  hasAttribute(name: string): boolean {
    return this.attrs.has(name);
  }
  removeAttribute(name: string): void {
    this.attrs.delete(name);
  }

  appendChild<T extends StubElement>(child: T): T {
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore<T extends StubElement>(node: T, ref: StubElement | null): T {
    if (ref === null) return this.appendChild(node);
    node.parentNode?.removeChild(node);
    node.parentNode = this;
    const idx = this.children.indexOf(ref);
    if (idx === -1) this.children.push(node);
    else this.children.splice(idx, 0, node);
    return node;
  }

  prepend(child: StubElement): void {
    this.insertBefore(child, this.children[0] ?? null);
  }

  removeChild<T extends StubElement>(child: T): T {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
    child.parentNode = null;
    return child;
  }

  remove(): void {
    this.parentNode?.removeChild(this);
  }

  addEventListener(type: string, fn: StubListener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(fn);
    this.listeners.set(type, list);
  }

  dispatchEvent(ev: { type: string }): boolean {
    for (const fn of this.listeners.get(ev.type) ?? []) fn(ev);
    return true;
  }

  click(): void {
    this.dispatchEvent({ type: "click" });
  }
  focus(): void {
    // no-op: focus does not exist in the stub
  }
  blur(): void {
    // no-op: focus does not exist in the stub
  }

  closest(selector: string): StubElement | null {
    const matcher = compileSimple(selector);
    if (matcher(this)) return this;
    for (let cur = this.parentNode; cur !== null; cur = cur.parentNode) {
      if (matcher(cur)) return cur;
    }
    return null;
  }

  querySelector(selector: string): StubElement | null {
    return queryAll(this, selector, false)[0] ?? null;
  }

  querySelectorAll(selector: string): StubElement[] {
    return queryAll(this, selector, false);
  }
}

// value lives as a prototype accessor so setReactValue's
// Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
// finds the native-style setter path; the override must therefore be an
// accessor on this subclass's own prototype, not a base-class field.
export class StubValueElement extends StubElement {
  private innerValue = "";
  override get value(): string {
    return this.innerValue;
  }
  override set value(v: string) {
    this.innerValue = v;
  }
}

export class StubHTMLInputElement extends StubValueElement {}
export class StubHTMLTextAreaElement extends StubValueElement {}
export class StubHTMLSelectElement extends StubValueElement {}
export class StubHTMLButtonElement extends StubElement {}

export function createStubElement(tag: string): StubElement {
  switch (tag.toLowerCase()) {
    case "input":
      return new StubHTMLInputElement(tag);
    case "textarea":
      return new StubHTMLTextAreaElement(tag);
    case "select":
      return new StubHTMLSelectElement(tag);
    case "button":
      return new StubHTMLButtonElement(tag);
    default:
      return new StubElement(tag);
  }
}
