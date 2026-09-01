# Merged PRs: microsoft/markitdown

## PR #2223: Fix typos and formatting in comments, docstrings, and markdown

- URL: https://github.com/microsoft/markitdown/pull/2223
- Author: chienyuanchang
- Merged: 2026-07-21T21:31:52Z (created: 2026-07-17T20:21:07Z)
- Stats: +64 -61, 20 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: none

### Description

Cleanup pass fixing typos and formatting issues in comments, docstrings, and markdown files. **No functional/API code was changed** — only prose inside comments, docstrings, and Markdown, plus a few code-fence whitespace normalizations in READMEs.

Verified clean at the end with [`codespell`](https://github.com/codespell-project/codespell) 2.4.2 across the entire repo (excluding binary test fixtures, third-party notices, Microsoft boilerplate, and the vendored dwml code under `converter_utils/docx/math/`).

## Fixes by file

### Comments & docstrings
- `packages/markitdown/src/markitdown/_base_converter.py`
  - `steam_info` → `stream_info`
  - "This is primarily based \`stream_info\`" → "based **on** \`stream_info\`"
  - "used **to** in cases" → "used in cases"
  - "advance**s** the position" → "advance the position"
  - "In these case" → "In these cases"
  - Duplicated "MUST be reset it MUST be reset" → "MUST be reset"
  - "charset, **set**)" → "charset, **etc.**)" (×2)
- `packages/markitdown/src/markitdown/_markitdown.py`
  - `# Add legaxy kwargs` → `# Add legacy kwargs`
  - `"""DEPRECATED: User register_converter instead."""` → `Use register_converter`
  - Second `PRIORITY_SPECIFIC_FILE_FORMAT (== 10)` → `PRIORITY_GENERIC_FILE_FORMAT (== 10)` in `register_converter` docstring (was referencing the wrong constant)
  - `"Plugins converters are already enabled."` → `"Plugin converters are already enabled."`
- `packages/markitdown/src/markitdown/__main__.py` — `(e.g, UTF-8)` → `(e.g., UTF-8)` in `--charset` help
- `packages/markitdown/src/markitdown/_exceptions.py` — `"Represents an a single attempt"` → `"Represents a single attempt"`
- `packages/markitdown/src/markitdown/converters/_docx_converter.py`, `_epub_converter.py` — `(e.g.m headings)` → `(e.g., headings)`
- `packages/markitdown/src/markitdown/converters/_epub_converter.py` — stray closing `"""` inside a `#` comment removed
- `packages/markitdown/src/markitdown/converters/_outlook_msg_converter.py` — `# Brue force` → `# Brute force`
- `packages/markitdown/src/markitdown/converters/_markdownify.py` — `Javascript` → `JavaScript` in docstring
- `packages/markitdown/src/markitdown/converters/_bing_serp_converter.py` — stray `"` after `Base64URL` removed
- `packages/markitdown/src/markitdown/converters/_doc_intel_converter.py` — `availiable` → `available` in `_analysis_features` docstring
- `packages/markitdown-sample-plugin/src/markitdown_sample_plugin/_plugin.py`
  - `"""Converts an RTF file to in the simplest possible way."""` → `"""Converts an RTF file in the simplest possible way."""`
  - `# Read the file stream into an str using hte provided charset` → `into a str using the provided charset`

### Test files
- `packages/markitdown-sample-plugin/tests/test_sample_plugin.py` — `Tests the RTF converter dirctly` → `directly`
- `packages/markitdown/tests/test_cli_vectors.py` — `Test that the CLI readds from stdin correctly` → `reads`
- `packages/markitdown/tests/test_module_misc.py` — `# Make sure the targted attribute` → `targeted` (×2)

### Markdown formatting
- `README.md` — `Youtube URLs` → `YouTube URLs` (consistent with `YouTube video transcription` elsewhere in the file)
- `packages/markitdown-mcp/README.md`
  - Removed stray trailing TAB characters after two \`\`\`bash code-fence openers
  - Converted tab-indented JSON array elements in the Claude Desktop config example to 8-space indentation, matching the surrounding structure
- `packages/markitdown-sample-plugin/README.md`
  - First `Next, implement your custom DocumentConverter:` → `First, implement...` (there is no prior step for "Next" to follow from — the following two blocks correctly say "Next" and "Finally")
  - Normalized tab-indented lines inside the Python code samples to space indentation matching the surrounding 4/8-space code
  - Stripped a few trailing spaces

## Deliberately not changed
- `SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md` — Microsoft boilerplate, left as-is
- `packages/markitdown/ThirdPartyNotices.md` — contains a verbatim Apache-2.0 license copy, must not be modified
- `packages/markitdown/src/markitdown/converter_utils/docx/math/{latex_dict.py,omml.py}` — vendored from dwml (Apache-2.0), kept verbatim per the notice
- All test fixture files under `test_files/` and `ocr_test_data/` — expected outputs used for comparison

## Verification
- \`get_errors\` clean on all touched Python files
- \`codespell . --skip='...binaries/fixtures/legal...'\` returns exit 0 across the whole repo

## PR #2233: fix: handle PPTX SVG images without a rasterized fallback

- URL: https://github.com/microsoft/markitdown/pull/2233
- Author: guoyu-wang
- Merged: 2026-07-23T22:33:27Z (created: 2026-07-22T22:47:52Z)
- Stats: +190 -10, 3 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

PowerPoint stores an SVG picture as an <a:blip> whose r:embed points to a raster PNG fallback plus an <asvg:svgBlip> extension for the SVG. When a picture has no raster fallback, the <a:blip> has no r:embed, so python-pptx's shape.image raises ValueError("no embedded image"). This caused PptxConverter to fail the entire conversion.

Resolve the SVG part directly from the svgBlip extension via a new _get_image_info helper, and guard _is_picture against the exception (hasattr only swallows AttributeError). Add unit tests plus a small synthetic PPTX fixture covering the SVG-without-fallback case.

## PR #2257: Fix omml template bugs.

- URL: https://github.com/microsoft/markitdown/pull/2257
- Author: afourney
- Merged: 2026-07-29T17:08:31Z (created: 2026-07-29T17:05:51Z)
- Stats: +13 -7, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Fix fallback handling for unrecognized OMML attribute values

  `get_val()` returned the lookup key itself when an OMML attribute value was not
  found in its mapping table. Callers use that result as a `str.format()` template,
  so an unrecognized value produced malformed LaTeX or raised (`ValueError`,
  `IndexError`, `KeyError`) rather than falling back to a sensible default. Because
  `pre_process_docx` catches exceptions per part, a single unrecognized value
  silently disabled equation conversion for an entire `document.xml`.

  `get_val()` now falls back to the caller's `default` on a miss, so only templates
  defined in `latex_dict.py` reach `.format()`. The two call sites that legitimately
  pass a character through as literal text (`do_d` delimiters, `do_nary` operators)
  now use a new `get_char()` helper that retains the previous behavior.

  `do_groupchr()` passed no default at all; added `CHR_DEFAULT["GROUP_CHR_VAL"]`
  (`\underbrace`, matching ECMA-376's U+23DF default for the grouping character).
  This also fixes an `AttributeError` when `<m:groupChr>` has no `<m:chr>` child.

  Affected handlers: `do_acc`, `do_bar`, `do_f`, `do_groupchr`. Recognized values are
  unchanged. Existing tests pass, including `test_docx_equations`.

## PR #2258: Bump version to 0.1.7

- URL: https://github.com/microsoft/markitdown/pull/2258
- Author: afourney
- Merged: 2026-07-29T18:16:04Z (created: 2026-07-29T18:13:15Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Bump version to 0.1.7 for a new release.

## PR #2316: Pin GitHub Actions to full-length commit SHAs

- URL: https://github.com/microsoft/markitdown/pull/2316
- Author: danfiedler-msft
- Merged: 2026-08-19T19:34:00Z (created: 2026-08-19T01:38:50Z)
- Stats: +6 -4, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

## Summary

This PR pins GitHub Actions to full-length commit SHAs for improved security and reproducibility and adds a 7 day cooldown to Dependabot configuration for GitHub Actions. This work is described in more detail at https://aka.ms/action-pinning.

## Why?

Pinning actions to commit SHAs prevents supply-chain attacks where a tag could be moved to point to malicious code. This is a recommended security best practice per the [GitHub Actions security hardening guide](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions#using-third-party-actions).

This change mitigates the risk of tag retargeting to malicious code as seen in incidents like the [tj-actions/changed-files action compromise](https://www.stepsecurity.io/blog/harden-runner-detection-tj-actions-changed-files-action-is-compromised) or [codfish/semantic-release-action compromise](https://www.stepsecurity.io/blog/supply-chain-compromise-codfish-semantic-release-action) and improves the integrity and reproducibility of the CI/CD pipeline.

## What changed?

**Action pinning:** Third-party action references in `.github/workflows/` that used mutable tag-based references (e.g., `actions/checkout@v4`) have been updated to full-length commit SHAs with a version comment (e.g., `actions/checkout@<sha> # v4`) using the [pinact](https://github.com/suzuki-shunsuke/pinact) tool. References that were already pinned to a SHA, or that used immutable release tags, were left unchanged.

**Dependabot configuration:** `.github/dependabot.yml` has been updated to ensure a `github-actions` package-ecosystem section is present with a `cooldown` configuration (`default-days: 7`). If the file did not exist, it was created. If a `github-actions` section already existed, only the `cooldown` block was added or its `default-days` value was increased to 7 if it was lower. The 7-day cooldown provides a window for the community to detect and report compromised releases before they are automatically proposed as updates, reducing exposure to supply-chain attacks via newly published malicious versions.

## Is this safe to merge?

Yes. The pinned SHAs correspond to the same commits that the existing tags pointed to. No behavioral changes in action execution are introduced. You can verify the pinned SHA value using the GitHub REST API (e.g., the commit hash for `actions/checkout@v7` can be found in the `sha` property in the JSON response for `GET https://api.github.com/repos/actions/checkout/commits/v7`).

## Additional Information

For more information, please see https://aka.ms/action-pinning

