# Merged PRs: Graphify-Labs/graphify

## PR #1366: fix(skill): pin extraction source_file + root the full build so --update stops duplicating

- URL: https://github.com/Graphify-Labs/graphify/pull/1366
- Author: RelywOo
- Merged: 2026-06-18T00:28:51Z (created: 2026-06-17T13:08:02Z)
- Stats: +262 -113, 44 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Problem

After #1344 (build_merge replace-on-re-extract) and #1361 (pass `root=` to `build_merge` in the `--update` runbook), the full build and an incremental `/graphify --update` could still emit **different `source_file` bases for the same file** (e.g. `docs/wiki/overview.md` from one run vs basename `overview.md` from another). Because `build_merge`'s replace keys on the `source_file` string, the mismatch made it miss the stored node, so re-extraction **accumulated duplicates** instead of replacing. Two gaps remained:

1. **`extraction-spec(.md/-compact.md)`** — the subagent's `source_file` slot was an unpinned `"relative/path"`, so it invented a base per run. The node id (derived from the same path) drifted too.
2. **`core.md`** — the full build called `build_from_json` **without `root=`**, so #1361's update-side `root=` had no matching base on the full-build side; the two halves never agreed.

## Fix (engine `build.py` unchanged)

- **extraction-spec(+compact):** pin `source_file` to the **verbatim `FILE_LIST` path** — no basename, no re-relativize, no separator change. `_norm_source_file(root)` then canonicalizes every run identically.
- **core.md:** pass `root='INPUT_PATH'` at **both** `build_from_json` sites (Step 4 export, Step 5 report), matching #1361's update-side root so full build and `--update` relativize to the same base.
- **update.md:** `prune_sources = deleted` only. Changed files are already replaced by `build_merge` (#1344); once `root=` aligns the bases, leaving `changed` in `prune_sources` would **delete the freshly re-extracted nodes**.

All skill artifacts regenerated via `python tools/skillgen/gen.py`.

## Test

Adds `test_build_merge_root_collapses_convention_drift`: a drifted relative base with no root leaves 3 nodes (stale + duplicate); the verbatim path + `root=` collapses to 1 canonical node and drops the stale node. `tests/test_build.py` — 35 passed.

Builds on #1344 and #1361 (same bug family).

## PR #512: feat: add Kilo Code support

- URL: https://github.com/Graphify-Labs/graphify/pull/512
- Author: alacasse
- Merged: 2026-06-01T15:05:07Z (created: 2026-04-22T20:45:39Z)
- Stats: +1100 -69, 7 files
- Labels: none
- Reviews: 0 | Comments: 10
- Linked issues: Closes #477

### Description

Closes #477

Added support for Kilo Code.

## Summary
- Added Kilo Code as a supported platform in README and install scripts
- Added Kilo-specific skill and command files
- Added install/uninstall logic including plugin registration
- Extended tests for install flow, command detection, and registration
- Updated metadata for Kilo integration

## PR #1737: refactor: decompose extract.py and __main__.py into focused modules

- URL: https://github.com/Graphify-Labs/graphify/pull/1737
- Author: TPAteeq
- Merged: 2026-07-08T21:15:20Z (created: 2026-07-08T20:50:23Z)
- Stats: +19477 -19060, 33 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description


Splits the two largest modules into cohesive, single-responsibility modules —
**verbatim moves only**, every original import path preserved via re-exports, and
the full suite unchanged (3036 passed, 29 skipped) after every commit.

## Why

`extract.py` (17,054 LOC) and `__main__.py` (5,368 LOC) were by far the largest
files in the package and mixed several independent subsystems each. This is pure
decomposition: no behavior change, no renames, no reformatting.

## Size impact

| File | before | after |
|---|---|---|
| `graphify/extract.py` | 17,054 | **4,740** (−72%) |
| `graphify/__main__.py` | 5,368 | **673** (−87%) |
| `graphify/export.py` | 1,671 | **962** (−42%) |

## What moved (one subsystem per commit)

**extract.py → `graphify/extractors/`** (continues the `MIGRATION.md` / #1212 effort):
- `engine.py` — the `_extract_generic` tree-sitter engine + its 67-function closure and 10 private type-tables (~4.1k LOC).
- `resolution.py` — the cross-file symbol/import resolution passes (60 fns).
- `models.py` — shared types (`LanguageConfig`, the `_Symbol*Fact` dataclasses) + two shared caches.
- 23 bespoke language extractors: dart, rust, go, powershell, fortran, sql, dm, bash, apex, terraform, sln, pascal_forms, json_config, verilog, markdown, pascal, objc, julia.

**__main__.py**:
- `install.py` — the whole install/uninstall subsystem **and** the install/platform CLI dispatch (`dispatch_install_cli`).
- `cli.py` — every non-install subcommand (`dispatch_command`).

**export.py → `graphify/exporters/`**: `html.py`, `graphdb.py`, `base.py`.

## Why it's safe

- **Verbatim.** Each move was validated by AST closure-privacy analysis and byte-identity checks; nothing was rewritten.
- **No import cycles.** Strict layering `extract → engine → resolution → models/base`; `__main__ → cli`; the one back-edge (the `graphify <path>` redirect's recursive `main()`) uses a lazy import.
- **Nothing to update downstream.** `extract.py` / `__main__.py` / `export.py` re-export every moved name, so `from graphify.extract import extract_dart`, `from graphify.__main__ import claude_install`, etc. all still resolve (object identity preserved). No test or importer changed.
- **Packaging.** Added `graphify.exporters` to the setuptools package list; verified a fresh-venv wheel install imports every new module and runs `graphify` end-to-end (build a multi-language graph, `query`/`path`/`explain`, install/uninstall, the path-redirect).
- `ruff check` clean; `skillgen --check` OK.

## Left as-is (intentionally)

The rest of `extract.py` is the dispatcher + config-driven extractor family (js/ts/vue/svelte/astro/xaml) that share `_JS_CONFIG`/dispatch caches — kept together per `MIGRATION.md`. `llm.py` (backend layer entangled with orchestration) and `callflow_html.py` (one cohesive renderer) were assessed and left untouched.


## PR #583: feat(detect): add hidden path allowlist

- URL: https://github.com/Graphify-Labs/graphify/pull/583
- Author: Bichalla
- Merged: 2026-05-02T13:15:12Z (created: 2026-04-28T06:23:05Z)
- Stats: +130 -23, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- Add `.graphifyinclude` loading to `detect()`.
- Keep hidden paths skipped by default, but traverse allowlisted hidden paths needed for curated docs.
- Keep sensitive-looking filenames hard-skipped even when allowlisted.
- Add regression tests for `.hermes/plans/**/*.md` inclusion and sensitive allowlist hard-skip.

## Verification
- `uv run --with pytest python -m pytest tests/test_detect.py -q` → 30 passed
- `uv run --with pytest python -m pytest -q` → 443 passed

## Context
This supports SSOT-safe project operating docs: hidden operating folders like `.hermes/plans/` can remain canonical while Graphify indexes only explicitly curated Markdown paths.

## PR #648: feat: add VB.NET (.vb) language support via tree-sitter

- URL: https://github.com/Graphify-Labs/graphify/pull/648
- Author: rrangraj
- Merged: 2026-05-02T15:52:32Z (created: 2026-05-01T18:30:11Z)
- Stats: +244 -6, 6 files
- Labels: none
- Reviews: 0 | Comments: 4
- Linked issues: none

### Description

This commit adds full VB.NET language support to graphify, raising the supported language count from 25 to 26. The implementation follows the established LanguageConfig pattern used by all other tree-sitter-backed extractors.

New dependency:
- Adds optional extra [vbnet] backed by tree-sitter-vbnet (published to PyPI at https://pypi.org/project/tree-sitter-vbnet/0.1.0/). Install with: pip install graphifyy[vbnet]

graphify/detect.py:
- Added .vb to CODE_EXTENSIONS so VB.NET files are discovered during corpus ingestion and file-system watching.

graphify/extract.py:
- _import_vbnet(): import handler for imports_statement nodes; emits imports edges using the namespace_name child text.
- _vbnet_extra_walk(): extra-walk hook that intercepts namespace_block nodes, emits a namespace node, and recurses.
- _VBNET_CONFIG: full LanguageConfig covering class_block / module_block / structure_block / interface_block as class types; method_declaration / constructor_declaration / property_declaration as function types; invocation call nodes with target/member_access fields.
- VB.NET-specific branches in _extract_generic:
  * Class body: VB.NET has no wrapper body node; inherits and implements are named fields directly on the class_block. Emits separate inherits and implements edges for each base type, stripping generic arguments.
  * Constructor name: constructor_declaration carries no name field in the grammar; always resolves to New.
  * Function body: uses the declaration node itself as body sentinel so the call-graph pass can find invocations inside methods.
- extract_vbnet(path): public wrapper that delegates to _extract_generic.
- _DISPATCH['.vb']: routes .vb files to extract_vbnet.

pyproject.toml:
- Added vbnet = ['tree-sitter-vbnet'] optional dependency group.
- Added 'tree-sitter-vbnet' to the all extra.

tests/fixtures/sample.vb:
- New fixture file exercising: Imports statements, Namespace block, Interface, Class with Inherits + Implements, Module, Structure, Sub/Function/Property methods, and method calls.

tests/test_languages.py:
- Added 13 tests covering: no-error, class/interface/module/structure detection, method detection, imports relation, inherits edge, implements edge, and no-dangling-edges invariant.

README.md:
- Updated language count 25 to 26.
- Added VB.NET to language list and file-extension table.
