# Merged PRs: shadcn-ui/ui

## PR #11640: docs(registry): update @wensity URL, homepage, and description

- URL: https://github.com/shadcn-ui/ui/pull/11640
- Author: ksparth12
- Merged: 2026-08-30T07:35:35Z (created: 2026-08-26T15:46:37Z)
- Stats: +3 -3, 1 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

Updates the existing `@wensity` entry in `apps/v4/registry/directory.json`. Three fields on one object; no other entries are touched.

### What changed

| Field | Before | After |
| --- | --- | --- |
| `url` | `.../ksparth12/wensity-shadcn-registry/main/{name}.json` | `.../wensity/registry/main/{name}.json` |
| `homepage` | `https://wensity.com` | `https://ui.wensity.com/components` |
| `description` | Led on "AI interfaces" | Describes the catalog's actual breadth |

### Why

**URL.** The registry was first published from a personal account and has since moved to the Wensity organization at [wensity/registry](https://github.com/wensity/registry), which is now the canonical public host. The old repository remains published and unchanged, so anyone who hardcoded the previous raw URL in their own `components.json` keeps working.

The payloads at both locations are byte-identical (verified by SHA-256 on `registry.json` and item files), so resolution through the new URL returns exactly the same content. Verified with a clean project and no local `registries` config:

```
npx shadcn@latest add https://raw.githubusercontent.com/wensity/registry/main/button.json
✔ Created 3 files
```

**Homepage.** `wensity.com` is the studio site. `ui.wensity.com/components` is the component catalog, which is what someone clicking through from the directory is looking for.

**Description.** The previous wording led with "AI interfaces", which is 4 of 70 items. The replacement describes the registry as it actually is: UI primitives, components, and motion, on Base UI and Tailwind CSS v4.

### Notes

- The registry remains free-only and MIT; Pro components are not published to it.
- Flat registry, no nested items, no `content` property in the index `files` array.
- `registry.json` and all 70 item payloads resolve over HTTPS.

## PR #11710: feat(registry): add @afterglow to the registry directory

- URL: https://github.com/shadcn-ui/ui/pull/11710
- Author: thebuilder
- Merged: 2026-08-30T07:32:46Z (created: 2026-08-29T22:50:09Z)
- Stats: +7 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Adds the Afterglow terminal UI registry under the `@afterglow` namespace.

- Homepage: https://afterglow.thebuilder.dk
- Registry: https://afterglow.thebuilder.dk/r/{name}.json
- Includes the monochrome Afterglow mark using `currentColor`

## Verification

- `pnpm validate:registries`
- `pnpm prettier --check apps/v4/registry/directory.json`

## PR #11713: Add official site SEO metadata

- URL: https://github.com/shadcn-ui/ui/pull/11713
- Author: shadcn
- Merged: 2026-08-30T08:58:50Z (created: 2026-08-30T08:52:43Z)
- Stats: +157 -14, 14 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Adds canonical metadata, WebSite structured data, robots.txt, and a generated sitemap for the official site. It also adds an unlisted official-resources doc, canonical package and README links, and refreshes the homepage description and calls to action.

## PR #11715: fix(docs): restore sidebar block preview on mobile

- URL: https://github.com/shadcn-ui/ui/pull/11715
- Author: shadcn
- Merged: 2026-08-30T10:19:50Z (created: 2026-08-30T10:17:49Z)
- Stats: +13 -10, 5 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Point mobile block screenshots at `/r/styles/new-york` (the `new-york-v4` path 404s), use the sidebar-07 shots for the sidebar docs preview, and keep typeset from letterboxing that image.

## PR #11716: style(www): use radix-luma buttons in page headers

- URL: https://github.com/shadcn-ui/ui/pull/11716
- Author: shadcn
- Merged: 2026-08-30T11:29:52Z (created: 2026-08-30T11:21:46Z)
- Stats: +12 -12, 4 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

Use radix-luma buttons in the Blocks, Charts, Colors, and Examples page headers so they match the homepage.
