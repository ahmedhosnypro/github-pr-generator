/** Shared DOM helpers: button/toast widgets and React-aware value setting. */

export function getButton(id: string): HTMLButtonElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLButtonElement ? el : null;
}

function assignElementValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");

  if (element.tagName === "INPUT" && inputSetter?.set) {
    inputSetter.set.call(element, value);
  } else if (element.tagName === "TEXTAREA" && textareaSetter?.set) {
    textareaSetter.set.call(element, value);
  } else {
    element.value = value;
  }
}

function dispatchInputChange(element: HTMLInputElement | HTMLTextAreaElement): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  assignElementValue(element, value);
  dispatchInputChange(element);
}

// Streaming fill writes the latest value on every token but dispatches the
// synthetic input+change pair at most once per batch window — hundreds of
// events per generation would otherwise keep the page's change handlers busy
// for the whole stream. finish() guarantees a final input+change so the last
// value is always committed, even mid-window.
const STREAM_EVENT_BATCH_MS = 50;

export interface StreamingFieldFill {
  update: (value: string) => void;
  finish: () => void;
}

export function createStreamingFill(element: HTMLInputElement | HTMLTextAreaElement): StreamingFieldFill {
  let dirty = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!dirty) return;
    dirty = false;
    dispatchInputChange(element);
  };
  return {
    update(value: string): void {
      assignElementValue(element, value);
      dirty = true;
      if (timer === null) {
        timer = setTimeout(flush, STREAM_EVENT_BATCH_MS);
      }
    },
    finish: flush,
  };
}

export function createButton(id: string, label: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = id;
  btn.type = "button";
  btn.className = "ai-generate-btn";
  const gid = "aigrad-" + id;
  const svg =
    '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="vertical-align: text-bottom; margin-right: 4px;">' +
    '<defs><linearGradient id="' +
    gid +
    '" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2da44e"/><stop offset="100%" stop-color="#0969da"/></linearGradient></defs>' +
    '<rect x="1" y="1" width="14" height="14" rx="3" fill="url(#' +
    gid +
    ')"/>' +
    '<g stroke="#fff" stroke-width="1.2" stroke-linecap="round" fill="none">' +
    '<line x1="5" y1="12" x2="5" y2="7.5"/><line x1="11" y1="12" x2="11" y2="9.5"/><line x1="5" y1="9" x2="11" y2="9"/>' +
    '<circle cx="5" cy="5.5" r="1.3" fill="#fff" stroke="none"/>' +
    '<circle cx="11" cy="12" r="1.3" fill="#fff" stroke="none"/>' +
    '<circle cx="5" cy="12" r="1.3" fill="#fff" stroke="none"/>' +
    "</g>" +
    '<path d="M13 2l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#fff"/>' +
    "</svg>";
  btn.innerHTML = svg + label;
  btn.addEventListener("click", onClick);
  return btn;
}

export function showToast(message: string, isError = false): void {
  const existing = document.getElementById("ai-pr-generator-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "ai-pr-generator-toast";
  toast.className = "ai-pr-generator-toast" + (isError ? " ai-pr-generator-toast--error" : "");
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("ai-pr-generator-toast--visible");
  }, 10);
  setTimeout(() => {
    toast.classList.remove("ai-pr-generator-toast--visible");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

export function setButtonLoading(btn: HTMLButtonElement): void {
  btn.disabled = true;
  btn.dataset.originalHtml = btn.innerHTML;
  const spinnerSvg =
    '<svg class="ai-generate-spinner" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" style="vertical-align: text-bottom; margin-right: 4px; animation: ai-spin 0.8s linear infinite;">' +
    '<path d="M8 0a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V0z"/>' +
    "</svg>";
  btn.innerHTML = spinnerSvg + "Generating...";
  btn.classList.add("ai-generate-btn--loading");
}

export function clearButtonLoading(btn: HTMLButtonElement): void {
  btn.disabled = false;
  btn.innerHTML = btn.dataset.originalHtml ?? btn.innerHTML;
  btn.classList.remove("ai-generate-btn--loading");
}

/** Controls handed to the review modal's onApply callback. */
export interface ReviewControls {
  /** Disable/enable the form while the apply request is in flight. */
  setBusy: (busy: boolean) => void;
  /** Dismiss the modal (also removes its Escape/click-away listeners). */
  close: () => void;
}

export interface ReviewModalOptions {
  /** Header text, e.g. "Review proposed PR title". */
  heading: string;
  /** Proposed text the user can edit before applying. */
  value: string;
  /** true → textarea (description), false/absent → single-line input (title). */
  multiline?: boolean;
  /** Called with the edited text; apply failures must call controls.setBusy(false). */
  onApply: (value: string, controls: ReviewControls) => void;
  /** Called when the user cancels (Cancel button, Escape, or click-away). */
  onCancel?: () => void;
}

const REVIEW_MODAL_ID = "ai-pr-review-modal";

// Only one review modal can be live at a time. A replacement must go through
// close() — a bare remove() would strand the old instance's document-level
// Escape listener, which would then cancel into the old (stale) onCancel.
let openModal: { close: () => void } | null = null;

/**
 * On-page review panel for LLM proposals before they are written to the PR.
 * Everything is built with createElement/textContent so proposal text is never
 * interpreted as HTML.
 */
export function showReviewModal(options: ReviewModalOptions): void {
  openModal?.close();
  openModal = null;
  // Safety net for a modal left by an older script instance (pre-tracking).
  document.getElementById(REVIEW_MODAL_ID)?.remove();

  const overlay = document.createElement("div");
  overlay.id = REVIEW_MODAL_ID;
  overlay.className = "ai-review-overlay";

  const panel = document.createElement("div");
  panel.className = "ai-review-modal";
  overlay.appendChild(panel);

  const header = document.createElement("div");
  header.className = "ai-review-modal__header";
  header.textContent = options.heading;
  panel.appendChild(header);

  const hint = document.createElement("div");
  hint.className = "ai-review-modal__hint";
  hint.textContent = "Review and edit the AI proposal below. Nothing changes on the PR until you click Apply.";
  panel.appendChild(hint);

  const field: HTMLInputElement | HTMLTextAreaElement = options.multiline
    ? document.createElement("textarea")
    : document.createElement("input");
  if (field instanceof HTMLInputElement) field.type = "text";
  field.className = "ai-review-modal__field";
  field.value = options.value;
  if (field instanceof HTMLTextAreaElement) field.rows = 14;
  panel.appendChild(field);

  const actions = document.createElement("div");
  actions.className = "ai-review-modal__actions";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ai-review-modal__btn ai-review-modal__btn--cancel";
  cancelBtn.textContent = "Cancel";

  const applyBtn = document.createElement("button");
  applyBtn.type = "button";
  applyBtn.className = "ai-review-modal__btn ai-review-modal__btn--apply";
  applyBtn.textContent = "Apply to PR";

  actions.appendChild(cancelBtn);
  actions.appendChild(applyBtn);
  panel.appendChild(actions);

  let closed = false;
  const cancel = (): void => {
    close();
    options.onCancel?.();
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.stopPropagation();
      cancel();
    }
  };
  const close = (): void => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown, true);
    overlay.remove();
    if (openModal?.close === close) openModal = null;
  };
  const setBusy = (busy: boolean): void => {
    applyBtn.disabled = busy;
    cancelBtn.disabled = busy;
    field.disabled = busy;
  };

  cancelBtn.addEventListener("click", cancel);
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) cancel();
  });
  applyBtn.addEventListener("click", () => {
    const value = field.value.trim();
    if (!value) {
      showToast("The proposed text cannot be empty.", true);
      return;
    }
    setBusy(true);
    options.onApply(value, { setBusy, close });
  });
  document.addEventListener("keydown", onKeydown, true);
  openModal = { close };

  document.body.appendChild(overlay);
  field.focus();
}
