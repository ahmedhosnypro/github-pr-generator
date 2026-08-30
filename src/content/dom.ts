/** Shared DOM helpers: button/toast widgets and React-aware value setting. */

export function getButton(id: string): HTMLButtonElement | null {
  const el = document.getElementById(id);
  return el instanceof HTMLButtonElement ? el : null;
}

export function setReactValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  const inputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
  const textareaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");

  if (element.tagName === "INPUT" && inputSetter?.set) {
    inputSetter.set.call(element, value);
  } else if (element.tagName === "TEXTAREA" && textareaSetter?.set) {
    textareaSetter.set.call(element, value);
  } else {
    element.value = value;
  }

  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
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
