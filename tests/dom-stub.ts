// Minimal DOM/window/chrome stub for content-script unit tests. No DOM
// implementation (jsdom/happy-dom) exists in the dependency tree, so this
// fakes just the surface src/content/* touches: the element classes live in
// dom-stub-element.ts, selector matching in dom-selector-engine.ts, and this
// module installs the document/window/chrome globals (including the
// chrome.runtime.connect stream port tests drive via setStreamHandler).
//
// Globals are installed at module-evaluation time, so this module must be
// imported FIRST (before any src/content/* module) — log.ts guards on
// `typeof window` at import time and dom.ts reads window.HTML* prototypes.

import { queryAll, walk } from "./dom-selector-engine";
import {
  createStubElement,
  StubElement,
  StubHTMLButtonElement,
  StubHTMLInputElement,
  StubHTMLSelectElement,
  StubHTMLTextAreaElement,
  StubValueElement,
} from "./dom-stub-element";

export { StubElement } from "./dom-stub-element";

const body = new StubElement("body");

const documentStub = {
  createElement: (tag: string): StubElement => createStubElement(tag),
  getElementById: (id: string): StubElement | null => walk(body, true).find((el) => el.attrs.get("id") === id) ?? null,
  querySelector: (selector: string): StubElement | null => queryAll(body, selector, true)[0] ?? null,
  querySelectorAll: (selector: string): StubElement[] => queryAll(body, selector, true),
  addEventListener: (_type: string, _fn: () => void) => undefined,
  visibilityState: "visible",
  body,
};

const stubLocation = { href: "https://github.com/", pathname: "/" };

export function setLocation(url: string): void {
  stubLocation.href = url;
  stubLocation.pathname = new URL(url).pathname;
}

export type StreamEmit = (msg: { kind: string; text?: string; result?: unknown; error?: string }) => void;
export type StreamRequestHandler = (request: unknown, emit: StreamEmit) => void;

let streamHandler: StreamRequestHandler | null = null;
let streamPosts: unknown[] = [];

/** Registers the fake background side of the streaming port for the next requests. */
export function setStreamHandler(handler: StreamRequestHandler | null): void {
  streamHandler = handler;
}

/** Every message content scripts posted over stream ports, in order. */
export function streamRequests(): unknown[] {
  return [...streamPosts];
}

function makePort(name: string): Record<string, unknown> {
  const msgListeners: ((msg: unknown) => void)[] = [];
  const discListeners: (() => void)[] = [];
  return {
    name,
    onMessage: {
      addListener: (fn: (msg: unknown) => void) => {
        msgListeners.push(fn);
      },
    },
    onDisconnect: {
      addListener: (fn: () => void) => {
        discListeners.push(fn);
      },
    },
    postMessage: (msg: unknown) => {
      streamPosts.push(msg);
      const handler = streamHandler;
      if (handler !== null) {
        handler(msg, (m) => {
          for (const fn of msgListeners) fn(m);
        });
      }
    },
    disconnect: () => {
      for (const fn of discListeners) fn();
    },
  };
}

const chromeStub = {
  runtime: {
    lastError: undefined as { message: string } | undefined,
    getURL: (path: string) => "chrome-extension://stub/" + path,
    connect: (info: { name?: string }) => makePort(info.name ?? ""),
  },
  storage: {
    local: {
      get: (_keys: unknown, callback: (items: Record<string, unknown>) => void) => {
        callback({});
      },
      set: (_items: Record<string, unknown>, callback?: () => void) => {
        if (callback) callback();
      },
      remove: (_keys: unknown) => Promise.resolve(),
    },
  },
};

const g = globalThis as unknown as Record<string, unknown>;
g.document = documentStub;
g.window = {
  HTMLInputElement: StubHTMLInputElement,
  HTMLTextAreaElement: StubHTMLTextAreaElement,
  location: stubLocation,
  addEventListener: () => undefined,
};
g.HTMLElement = StubElement;
g.HTMLInputElement = StubHTMLInputElement;
g.HTMLTextAreaElement = StubHTMLTextAreaElement;
g.HTMLSelectElement = StubHTMLSelectElement;
g.HTMLButtonElement = StubHTMLButtonElement;
g.chrome = chromeStub;

/** Clears the page (body), stream history/handler, and points location at the given URL. */
export function resetPage(url: string): StubElement {
  body.children = [];
  body.ownText = "";
  streamHandler = null;
  streamPosts = [];
  setLocation(url);
  return body;
}

/** Fixture builder: attrs are set as attributes; "value" also sets the property; strings become text. */
export function h(tag: string, attrs: Record<string, string> = {}, ...children: (StubElement | string)[]): StubElement {
  const el = createStubElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (name === "value" && el instanceof StubValueElement) el.value = value;
    else el.setAttribute(name, value);
  }
  for (const child of children) {
    if (typeof child === "string") el.ownText += child;
    else el.appendChild(child);
  }
  return el;
}

/** Waits one macrotask so click-dispatched `void handleGenerate()` chains settle. */
export function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
