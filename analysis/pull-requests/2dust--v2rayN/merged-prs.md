# Merged PRs: 2dust/v2rayN

## PR #10026: fix(hysteria2): default the port to 443 when the share URI omits it

- URL: https://github.com/2dust/v2rayN/pull/10026
- Author: aleksandr-miheichev
- Merged: 2026-08-28T06:33:05Z (created: 2026-08-23T21:32:41Z)
- Stats: +59 -1, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

The [URI scheme](https://v2.hysteria.network/docs/developers/URI-Scheme/) makes the port optional: "The hostname and optional port of the server. If the port is omitted, it defaults to 443."

`Hysteria2Fmt.Resolve` assigns `url.Port` straight through, and `System.Uri` answers `-1` for an unregistered scheme that carries no port. So `hysteria2://password@hy2.example/` imports as a profile with `Port = -1`, and `ProfileItem.IsValid` rejects anything outside 1..65535 — the link produces a profile that can never be used, without saying why.

```diff
-        item.Port = url.Port;
+        item.Port = url.Port == -1 ? 443 : url.Port;
```

`-1` is the only value that means "the port was omitted", and a `:` with no digits after it maps to `-1` as well. An explicit `:0` parses as `0`, so it keeps the fate it has today — rejected by `IsValid` — rather than being redirected to a server the link never named.

`Hysteria2Fmt.ResolveRealm` takes its port from `HyRealm.RendezvousPort` instead of the URI, so it is unaffected.

## Testing

Windows, .NET SDK 10.0.400.

The tests were written first and fail on `master`:

```
сбой ResolveConfig_WithoutPort_ShouldDefaultTo443(hysteria2://password@hy2.example/)
сбой ResolveConfig_WithoutPort_ShouldDefaultTo443(hysteria2://password@hy2.example)
сбой ResolveConfig_WithoutPort_ShouldDefaultTo443(hysteria2://password@hy2.example:/)
сбой ResolveConfig_WithoutPort_ShouldDefaultTo443(hy2://password@hy2.example/?sni=real.example)
сбой ResolveConfig_WithoutPort_ShouldProduceAValidProfile
  total: 76   failed: 5   succeeded: 71
```

and pass with the change:

```
  total: 76   failed: 0   succeeded: 76
```

Two of them are controls rather than regression guards. `ResolveConfig_WithExplicitPort_ShouldKeepIt` passes before and after, so the default cannot override a port that was given. `ResolveConfig_WithExplicitZeroPort_ShouldNotApplyTheDefault` also passes before and after — it pins the boundary of the default itself, since a condition like `url.Port > 0` would have quietly turned `:0` into `:443`.

## PR #10015: i18n(ru): translate newly added UI strings

- URL: https://github.com/2dust/v2rayN/pull/10015
- Author: aleksandr-miheichev
- Merged: 2026-08-28T06:26:02Z (created: 2026-08-22T09:48:19Z)
- Stats: +10 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Adds the three Russian strings that were missing from `ResUI.ru.resx` after the DNS "Block AAAA Queries" toggle and the Xray-only certificate-pinning hint were introduced — `TbXrayOnly`, `TbBlockAAAAQueries` and `TbBlockAAAAQueriesTips` — and translates `TbBlockSVCBHTTPSQueriesTips`, whose key already existed in the Russian resource but still held the untranslated English text.

Everything is translated from the `zh-Hans` source and cross-checked against the neutral English resource. `Xray`, `ECH`, `HTTP/3` and the `AAAA` record type stay untranslated, matching the established glossary; the new label mirrors the neighbouring `TbBlockSVCBHTTPSQueries` wording, and both tips follow the "При включении …" pattern already used by `TbEnableHappyEyeballsTip`.

Russian is back to full key parity with `ResUI.resx` (583/583), key order mirrors the English resource file, and no already-translated string is modified. The two changes are kept in separate commits, so the untranslated-value fix can be dropped independently of the new strings.

Verified locally: both heads build in Release (`v2rayN` WPF and `v2rayN.Desktop`) with no warnings, `ServiceLib.Tests` passes 69/69, and the keys resolve from the compiled `ru` satellite assembly at runtime.

## PR #10017: test: cover the share-URI round trip for the remaining protocols

- URL: https://github.com/2dust/v2rayN/pull/10017
- Author: aleksandr-miheichev
- Merged: 2026-08-28T06:27:51Z (created: 2026-08-22T10:23:21Z)
- Stats: +395 -2, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

`FmtHandlerTests` round-trips VMess, VLESS, Shadowsocks and SOCKS through `GetShareUri` and `ResolveConfig`. `FmtHandler.GetShareUri` dispatches ten protocols, so Trojan, Hysteria2, TUIC, Anytls, WireGuard and Naive were exported and re-imported untested, and `WireguardFmt` was covered in the `Resolve` direction only, by `WireguardFmtTests`.

One file changed, no source changes.

## Round trips

| Test | Fields it pins |
| --- | --- |
| `..._Trojan_ShouldRoundTripBasicFields` | password, sni, `flow`, transport, allow-insecure |
| `..._Hysteria2_ShouldRoundTripObfsAndNormalizePortRange` | password, sni, alpn, ech, obfs password, port range |
| `..._Tuic_ShouldRoundTripUserInfoAndCongestionControl` | the `uuid:password` pair, sni, alpn, `congestion_control` |
| `..._Anytls_ShouldRoundTripBasicFields` | password, sni, alpn, transport, allow-insecure |
| `..._Wireguard_ShouldRoundTripKeysAndInterface` | peer keys, `reserved`, interface address, MTU |
| `..._Naive_ShouldRoundTripCredentialsOverHttps` / `..._NaiveQuic_...` | credentials, `insecure-concurrency`, both schemes |
| `..._Trojan_ShouldRoundTripEncodedCredentials` | reserved and non-Latin characters in the password and the remarks |

## Guard against the next protocol

`ShareUriSuite_ShouldCoverAndRoundTripEveryExportableProtocol` compares the profile-factory map with `Global.ProtocolShares` and round-trips every entry. Adding a protocol to `ProtocolShares` without a case here turns it red, and the failure names the protocol.

## What a round trip cannot prove

An exporter and an importer that agree on the wrong parameter name round-trip perfectly, so three things are asserted on the wire form instead.

Since #9888 the allow-insecure flag is spelled per protocol: `allowInsecure` and `insecure` for Trojan, `allow_insecure` for TUIC, `insecure` for Anytls and Hysteria2. Each test asserts the exported URI contains the spelling its protocol owns. VLESS, WireGuard and Naive are left alone — they do not serialise the flag.

The WireGuard test pins the percent-encoding of the base64 keys and the brackets around the IPv6 literal.

Hysteria2 keeps `CertSha` unset on purpose. `ResolveHy2UriQuery` turns `AllowInsecure` on by itself when a `pinSHA256` is present, so a fixture carrying both would still pass if the exporter stopped emitting `insecure=1`.

## Fixtures

Deterministic and no longer plain ASCII: a fixed uuid for TUIC (a colon separates the two halves of its user info, so it cannot appear in the uuid), real 32-byte base64 keys and an IPv6 address for WireGuard, and reserved plus non-Latin characters in passwords and remarks.

`ExportThenImport` now derives the expected scheme. `NaiveFmt` emits `naive+https://` or `naive+quic://` and never the `naive://` prefix that `Global.ProtocolShares` records for that type; that entry is only read on the import side.

## Testing

Windows, .NET SDK 10.0.400:

```
dotnet test --project ./v2rayN/ServiceLib.Tests -c Release
  total: 80   failed: 0   succeeded: 80   skipped: 0
```

A test that has never failed is not evidence, so each new group was checked against a deliberate mutation of the code it covers:

| Mutation | Test that turned red |
| --- | --- |
| `Hysteria2Fmt` stops normalising `5000:6000` to `5000-6000` | Hysteria2 round trip |
| `TrojanFmt` emits only one spelling of the insecure flag | Trojan round trip |
| `TuicFmt` writes `allowInsecure` instead of `allow_insecure` | TUIC round trip |
| `AnytlsFmt` stops emitting the insecure flag | Anytls round trip |
| `WireguardFmt` stops percent-encoding the public key | WireGuard encoding test |
| `TrojanFmt` stops decoding the user info on import | both encoded-credentials cases |
| a protocol is removed from the coverage map | the coverage suite |

Nine failures for seven mutations, no pre-existing test disturbed, and every mutation reverted afterwards.

## PR #10027: fix(fmt): stop share-URI query values from being decoded twice or dropped

- URL: https://github.com/2dust/v2rayN/pull/10027
- Author: aleksandr-miheichev
- Merged: 2026-08-28T06:38:02Z (created: 2026-08-23T21:32:56Z)
- Stats: +82 -2, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Two defects in the same place, both on the import side, both silent.

## The value is unescaped twice

`Utils.ParseQueryString` already unescapes every value, and `BaseFmt.GetQueryDecoded` unescaped it a second time. A value that still holds a valid percent sequence after the first pass decays on the second: an obfuscation password of `ob%41fs` exports as `ob%2541fs` and imports back as `obAfs`.

Only well-formed sequences are affected, which is exactly why this is hard to notice — `100%` and `66%ff` survive untouched, because `Uri.UnescapeDataString` leaves a malformed escape alone. Both are covered as test arguments so the boundary stays pinned.

## A value containing `=` is dropped

The same function split each pair on every `=` and skipped the pair unless exactly two halves came out. RFC 3986 lists `=` among the sub-delimiters a query value may carry, so only the first `=` separates the key from the value — `HttpUtility.ParseQueryString` reads a query string the same way. Splitting on all of them discarded a syntactically valid pair without a word:

- `?ech=AAj+DQAEAAAAAA==` — the whole parameter was dropped and the ECH config silently lost;
- a `plugin` value in the non-canonical SIP002 spelling — those are `;` separated `key=value` lists, so left unescaped they never reached `ShadowsocksFmt` and the obfuscation was silently not configured.

v2rayN percent-encodes both on export, so its own links were never affected. What changes is that the parser now follows the grammar instead of discarding a pair it cannot split in two.

## The change

```diff
-            var keyValue = part.Split('=');
+            var keyValue = part.Split('=', 2);
```

```diff
-        return Utils.UrlDecode(GetQueryValue(query, key, defaultValue));
+        return GetQueryValue(query, key, defaultValue);
```

`ParseQueryString` keeps decoding, because `ConfigHandler.AddSubItem` reads `queryVars["remarks"]` from the collection directly and expects a decoded value.

`GetQueryDecoded` and `GetQueryValue` are equivalent after this. They are left separate to keep the change to two lines; collapsing them touches 36 call sites, so that seemed better as your call than mine.

## One behaviour change worth naming

The collection keeps the first occurrence of a repeated key. For a query that both repeats a key and leaves a bare `=` in the first of them — `?sni=a=b&sni=real.example` — the old code dropped the unsplittable pair and resolved `sni` to `real.example`, while the new code keeps `a=b`. It is the only input class I found where the previous behaviour gave the better result.

## Testing

Windows, .NET SDK 10.0.400.

The tests were written first. On `master` three of them fail:

```
сбой ResolveConfig_QueryValueWithUnescapedEquals_ShouldNotBeDropped
сбой ResolveConfig_NonCanonicalSip002PluginWithLiteralEquals_ShouldConfigureObfs
сбой GetShareUriAndResolveConfig_QueryValueWithPercent_ShouldSurviveTheRoundTrip(ob%41fs)
  total: 75   failed: 3   succeeded: 72
```

With the change:

```
  total: 75   failed: 0   succeeded: 75
```

The 69 pre-existing tests pass unchanged, which is the part that matters for removing a decode from a shared helper: no exporter double-encodes, so nothing relied on the second pass.

`ResolveConfig_EscapedQueryValue_ShouldStillDecodeExactlyOnce` is the control for the opposite direction — a properly escaped `ech` and an `obfs-password` of `a%20b` must still arrive decoded exactly once.

## PR #10054: ci: run the test job on pushes to master

- URL: https://github.com/2dust/v2rayN/pull/10054
- Author: aleksandr-miheichev
- Merged: 2026-08-29T01:42:40Z (created: 2026-08-28T16:57:05Z)
- Stats: +11 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

`Code Test` currently has only a `pull_request` trigger, so the suite never runs against master itself. Two gaps follow:

- a direct push to master is never tested;
- a merge can break the suite even when the pull request's own check was green: checks run on the PR head, not on the merged result, so two individually green changes that conflict semantically fail only after the merge - and nothing runs there today.

This adds a `push` trigger for master with the same paths filter, keeping `pull_request` as is. The paths list is duplicated because workflow YAML does not support anchors.

On push events `publish-unit-test-result-action` publishes its result as a check run on the commit (with failure annotations); the PR comment mode simply has no pull request to post to.
