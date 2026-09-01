# Merged PRs: EbookFoundation/free-programming-books

## PR #13421: fix(id): remove dead Niagahoster Bootstrap 5 tutorial link

- URL: https://github.com/EbookFoundation/free-programming-books/pull/13421
- Author: mamad2411
- Merged: 2026-08-29T12:01:47Z (created: 2026-08-23T14:35:12Z)
- Stats: +0 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

The Niagahoster Bootstrap 5 tutorial link in `books/free-programming-books-id.md` no longer works.

It redirects twice (`niagahoster.co.id` → `hostinger.co.id` → `hostinger.com/id`) and the final destination returns HTTP 404. There's also no archived snapshot available on the Wayback Machine, so per the CONTRIBUTING guidelines I removed the dead entry instead of trying to replace it.

## PR #13422: Add Sourcemap to Software Engineering courses

- URL: https://github.com/EbookFoundation/free-programming-books/pull/13422
- Author: mihhhir08
- Merged: 2026-08-29T12:05:30Z (created: 2026-08-23T21:48:14Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Adds one entry to the Software Engineering section of `courses/free-courses-en.md`.

```
* [Sourcemap: Ninety Days to Read Any System](https://sourcemap.co) - Mihirsinh Chavda
```

**What it is:** a free 90-day curriculum covering software engineering, system design and AI engineering. Each day gives one objective, a prompt written for that day to use with an AI assistant, 3 to 6 hand-checked external resources, a small exercise, and active-recall questions.

**Against the guidelines:**

- **Free:** all 90 days are readable in full without an account and nothing is paywalled. An optional sign-in exists only to save progress across devices.
- **No email required:** no address is needed to read any of it.
- **Not a book:** it is a course, so it belongs under `courses/` rather than the book lists.
- **Formatting:** `* [Title](URL) - Author`, placed alphabetically after "Software Engineering — The Easy Way".
- **Language:** English, so `free-courses-en.md`.

**Disclosure:** I am the author. Happy to move it to a different section or drop it if it is not a fit.

## PR #13430: Add AI Agent Evaluation (Artificial Intelligence)

- URL: https://github.com/EbookFoundation/free-programming-books/pull/13430
- Author: hallieren
- Merged: 2026-08-29T12:20:54Z (created: 2026-08-27T19:01:30Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Adds **AI Agent Evaluation** to `books/free-programming-books-subjects.md`, section *Artificial Intelligence*.

- Free, open-source book on evaluating LLM agents (16 chapters; 1-8 published, remaining chapters landing roughly weekly), with per-chapter template packs and zero-dependency labs. Marked *( :construction: in process)* accordingly.
- Read online (HTML): https://hallieren.github.io/ai-agent-evaluation/
- Source repository: https://github.com/hallieren/ai-agent-evaluation
- License: CC BY-NC-SA 4.0 (prose), MIT (code)

Disclosure: I am the author. Entry follows the list's format (alphabetical order, `- Author (Format)`, license note) and I searched the list for duplicates; none found.

## PR #13433: Add PracHub to problem sets

- URL: https://github.com/EbookFoundation/free-programming-books/pull/13433
- Author: AndyNian
- Merged: 2026-08-29T12:26:19Z (created: 2026-08-29T02:16:56Z)
- Stats: +1 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Adds PracHub to the Problem Sets section as a free, browser-accessible source of candidate-reported coding interview questions that can be filtered by company, role, round, topic, and difficulty.

Founder disclosure: I am the founder of PracHub and am submitting this resource for independent maintainer review. Browsing the question bank does not require an email address. The change is one alphabetized link and does not remove or replace any existing resource.

## PR #13427: Add Linux and SQL terminal simulators (interactive tutorials, en)

- URL: https://github.com/EbookFoundation/free-programming-books/pull/13427
- Author: bobbyonmagic
- Merged: 2026-08-30T08:24:39Z (created: 2026-08-25T19:24:07Z)
- Stats: +2 -0, 1 files
- Labels: waiting for changes
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

Adds two free interactive tutorials: a Linux terminal simulator (Operating systems) and a SQL terminal simulator (SQL). Both run guided lessons in the browser, free with no signup or ads, from the open source DevOps Daily project.

Disclosure: I help maintain the site.

