// End-to-end smoke: load dist/ as an unpacked Chromium extension, verify the
// popup renders functional controls, and that the content script injects the
// generation buttons on a real GitHub opened-PR page (public repo, no auth —
// the compare-page form is behind sign-in and is not testable headless).
// Requires network to github.com. Not part of `bun run test` (browser dep).
import { type BrowserContext, chromium } from "playwright";
import { expectMatch, getFailures } from "./expect-helpers";

const EXT_PATH = new URL("../dist", import.meta.url).pathname;
const OPENED_PR_URL = "https://github.com/react/react/pull/37481";

async function main(): Promise<void> {
  const context: BrowserContext = await chromium.launchPersistentContext("scratch/.e2e-profile", {
    headless: false,
    channel: "chromium",
    args: [`--disable-extensions-except=${EXT_PATH}`, `--load-extension=${EXT_PATH}`, "--headless=new"],
  });
  try {
    // Resolve the extension id from the service worker target.
    let extId = "";
    for (let i = 0; i < 20 && extId === ""; i++) {
      const sw = context.serviceWorkers()[0];
      if (sw) extId = new URL(sw.url()).host;
      else await new Promise((r) => setTimeout(r, 250));
    }
    expectMatch("service worker registered", extId !== "", true);

    // Popup renders: endpoint field, save button, validate button.
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extId}/popup/popup.html`);
    await popup.waitForSelector("#apiEndpoint", { timeout: 5000 });
    const hasSave = (await popup.locator("#saveBtn").count()) > 0;
    const hasTestApi = (await popup.locator("#testApiBtn").count()) > 0;
    expectMatch("popup: endpoint field present", true, true);
    expectMatch("popup: save button present", hasSave, true);
    expectMatch("popup: test-api button present", hasTestApi, true);
    // Save a screenshot of the rendered popup for human review
    await popup.screenshot({ path: "scratch/screenshots/e2e-popup.png" });
    await popup.close();

    // Content script on a real opened-PR page: both AI buttons appear.
    const page = await context.newPage();
    await page.goto(OPENED_PR_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(5000); // turbo render + 1s injection poll
    const titleBtn = await page.locator("#ai-pr-generate-btn-opened-title").count();
    const descBtn = await page.locator("#ai-pr-generate-btn-opened-desc").count();
    expectMatch("opened PR: title button injected", titleBtn > 0, true);
    expectMatch("opened PR: desc button injected", descBtn > 0, true);

    // Save screenshots to scratch/screenshots/ for human review (STYLING
    // BETTER SHOWN THAN PROBED). Never ReadMediaFile in the main context loop.
    await page.evaluate(() => document.getElementById("ai-pr-generate-btn-opened-title")?.scrollIntoView());
    await page.screenshot({ path: "scratch/screenshots/e2e-opened-pr-buttons.png", fullPage: false });

    // Run 9 regression: the title split-button must NOT be inside
    // span.markdown-title — its textContent feeds the "improve title" prompt.
    const titleText = await page.locator('[data-component="PH_Title"] span.markdown-title').first().textContent();
    expectMatch(
      "title span unpolluted by button labels",
      /AI Title|Generate fresh|Improve current/.test(titleText ?? ""),
      false,
    );
    await page.close();

    // Popup settings round-trip: fill → autosave → re-open → values persisted.
    const rt = await context.newPage();
    await rt.goto(`chrome-extension://${extId}/popup/popup.html`);
    await rt.waitForSelector("#apiEndpoint", { timeout: 5000 });
    const probe = "https://probe.invalid/v1-roundtrip-test";
    await rt.fill("#apiEndpoint", probe);
    await rt
      .locator("#apiEndpoint")
      .evaluate((el: HTMLElement) => el.dispatchEvent(new Event("input", { bubbles: true })));
    await rt.waitForTimeout(700); // debounce + storage write
    const stored = await rt.evaluate(
      () =>
        new Promise<Record<string, string>>((resolve) => {
          chrome.storage.local.get("apiEndpoint", (result) => {
            resolve(result as Record<string, string>);
          });
        }),
    );
    expectMatch("autosave persists endpoint to chrome.storage", (stored as Record<string, unknown>).apiEndpoint, probe);
    // Reload the popup page — load pipeline must restore the saved value.
    await rt.reload();
    await rt.waitForSelector("#apiEndpoint", { timeout: 5000 });
    await rt.waitForTimeout(1500); // loadSettings round-trip
    const restored = await rt.inputValue("#apiEndpoint");
    expectMatch("popup reload restores saved endpoint", restored, probe);
    await rt.close();
  } finally {
    await context.close();
  }

  const failures = getFailures();
  if (failures > 0) {
    console.log(`\n❌ ${String(failures)} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\n✅ Extension E2E smoke passed");
}

await main();
