// Mid-pagination failure tests for fetchPRCommits / fetchPRFiles: a failure
// partway through degrades (already-fetched pages are kept, logged), while a
// first-page failure still returns the error result. Invoked from
// tests/pr-lists.ts; mocks global fetch — no real network.
import { fetchPRCommits, fetchPRFiles } from "../src/background/github/list-pages";
import { expectIncludes, expectMatch } from "./expect-helpers";
import { BASE_CONFIG, fullCommitPage, fullFilePage, withCapturedLogs, withFetch } from "./pr-lists-helpers";

// Mid-pagination HTTP error degrades instead of discarding: page 1's items
// are kept and the log records what was kept and what failed. A first-page
// failure still returns the error unchanged.
async function testMidPaginationHttpErrorDegrades(): Promise<void> {
  let calls = 0;
  let commits = -1;
  let error = "";
  const logs = await withCapturedLogs(async () => {
    await withFetch(
      () => {
        calls++;
        return Promise.resolve(calls === 1 ? fullCommitPage() : new Response("boom", { status: 500 }));
      },
      async () => {
        const out = await fetchPRCommits(BASE_CONFIG, "octocat", "hello-world", "42");
        commits = "commits" in out ? out.commits.length : -1;
        error = "error" in out ? out.error : "";
      },
    );
  });
  expectMatch("mid-pagination error keeps page 1 items", commits, 100);
  expectMatch("mid-pagination error does not surface as an error result", error, "");
  const combined = logs.join("\n");
  expectIncludes(
    "degrade log records kept count",
    combined,
    "after 100 items from 1 page(s); keeping the partial list",
  );
  expectIncludes("degrade log names the failed page", combined, "page 2 failed");

  // Same failure with nothing fetched yet: fail loudly, no degrade.
  let firstPageError = "";
  const firstPageLogs = await withCapturedLogs(async () => {
    await withFetch(
      () => Promise.resolve(new Response("boom", { status: 500 })),
      async () => {
        const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "42");
        firstPageError = "error" in out ? out.error : "";
      },
    );
  });
  expectMatch("first-page 500 still fails loudly", firstPageError, "GITHUB_API_ERROR");
  expectMatch(
    "first-page failure never claims a partial list",
    firstPageLogs.join("\n").includes("keeping the partial list"),
    false,
  );
}

// Network failure mid-pagination (fetch rejects) degrades the same way.
async function testMidPaginationNetworkErrorDegrades(): Promise<void> {
  let calls = 0;
  let files = -1;
  let error = "";
  const logs = await withCapturedLogs(async () => {
    await withFetch(
      () => {
        calls++;
        return calls === 1 ? Promise.resolve(fullFilePage()) : Promise.reject(new Error("socket hang up"));
      },
      async () => {
        const out = await fetchPRFiles(BASE_CONFIG, "octocat", "hello-world", "42");
        files = "files" in out ? out.files.length : -1;
        error = "error" in out ? out.error : "";
      },
    );
  });
  expectMatch("mid-pagination network error keeps page 1 items", files, 100);
  expectMatch("mid-pagination network error does not surface as an error result", error, "");
  expectIncludes("network degrade log records kept items", logs.join("\n"), "fetch failed mid-pagination on page 2");
}

export async function runPartialPaginationTests(): Promise<void> {
  await testMidPaginationHttpErrorDegrades();
  await testMidPaginationNetworkErrorDegrades();
}
