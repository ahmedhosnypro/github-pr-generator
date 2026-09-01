# Merged PRs: anthropics/claude-code

## PR #72363: Gateway GCP example: Agent Platform rebrand and README cleanup

- URL: https://github.com/anthropics/claude-code/pull/72363
- Author: roy-ant
- Merged: 2026-06-29T23:26:38Z (created: 2026-06-29T22:51:21Z)
- Stats: +15 -15, 5 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary

Prose-only updates to `examples/gateway/gcp/`:

- **Agent Platform rebrand**: prose references to Vertex AI renamed across the example (READMEs, script and Terraform comments, config template), with "(formerly Vertex AI)" kept on first mentions for searchability. Functional identifiers are deliberately unchanged — the gateway config's `provider: vertex` / `upstream_model: { vertex: ... }` keys, `roles/aiplatform.user`, `aiplatform.googleapis.com`, and the Terraform resource label `google_project_iam_member.vertex` (renaming it would needlessly recreate the IAM binding for existing deployments).
- **README cleanup**: dropped the self-referential public-mirror link (it pointed at this same path).

## Test plan

- [x] `bash -n setup.sh` passes
- [x] Remaining `vertex` matches audited: only the functional identifiers above and the two "(formerly Vertex AI)" mentions

## PR #1: Create SECURITY.md

- URL: https://github.com/anthropics/claude-code/pull/1
- Author: bcherny
- Merged: 2025-02-24T18:18:37Z (created: 2025-02-24T18:17:58Z)
- Stats: +12 -0, 1 files
- Labels: none
- Reviews: 11 | Comments: 25
- Linked issues: none

### Description

(empty)

## PR #72451: fix: remove statsig.anthropic.com from init-firewall.sh

- URL: https://github.com/anthropics/claude-code/pull/72451
- Author: gmli-eu
- Merged: 2026-08-17T05:40:40Z (created: 2026-06-30T08:28:35Z)
- Stats: +0 -1, 1 files
- Labels: none
- Reviews: 3 | Comments: 1
- Linked issues: none

### Description

## Summary

Remove `statsig.anthropic.com` from the firewall initialisation allowlist.

## Why

The hostname `statsig.anthropic.com` no longer resolves. During devcontainer startup, `init-firewall.sh` attempts to resolve every hostname in the allowlist and exits with an error if any lookup fails.

This caused the `postStartCommand` to fail with:

```text
ERROR: Failed to resolve statsig.anthropic.com
```

which prevented the devcontainer from completing startup.

## Changes

* Remove `statsig.anthropic.com` from the list of hostnames resolved by `init-firewall.sh`.

## Testing

* Rebuilt/reloaded the devcontainer.
* Verified that the firewall initialisation completes successfully.
* Verified that the devcontainer starts without the DNS resolution error.


## PR #79898: Add Claude apps gateway on AWS example deployment assets

- URL: https://github.com/anthropics/claude-code/pull/79898
- Author: roy-ant
- Merged: 2026-07-21T19:39:14Z (created: 2026-07-21T19:27:22Z)
- Stats: +2240 -0, 13 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Summary

Reference deployment artifacts for running Claude apps gateway on AWS with Amazon Bedrock, accompanying the walkthrough at https://code.claude.com/docs/en/claude-apps-gateway-on-aws (publishing shortly). Sibling to the existing `examples/gateway/gcp` assets, under `examples/gateway/aws/`:

- `setup.sh` — scripts the walkthrough end to end via the `aws` CLI: security groups, task + execution IAM roles, ECR image build/push (with `gateway.yaml` baked into the image), private-subnet RDS for PostgreSQL, Secrets Manager secrets, and an ECS Fargate service behind an internal ALB. Idempotent and safe to re-run; every default is env-overridable.
- `Dockerfile` — distroless, nonroot runtime image. The Claude Code release binary (which includes the `gateway` subcommand) is verified against an operator-supplied sha256 before build.
- `gateway.yaml.example` — config template shaped for AWS (Bedrock upstream, Okta IdP).
- `terraform/` — module provisioning the same architecture for the ECS track (two-pass apply; see its README).

Provided as a working example to adapt, not a supported production deployment.

## Test plan

- [x] `setup.sh` exercised end to end with `aws`/`docker` stubbed on `PATH` (no AWS resources): greenfield provisioning flow, sha256 verification and checksum-mismatch quarantine (`claude.bad`), RDS CA bundle download + sanity check, missing-input gate for the deploy step
- [x] `bash -n` and shellcheck clean
- [x] Doc link slugs verified against the docs source

## PR #69226: Update frontend-design skill

- URL: https://github.com/anthropics/claude-code/pull/69226
- Author: williamqian12
- Merged: 2026-06-18T02:25:44Z (created: 2026-06-17T23:43:39Z)
- Stats: +41 -28, 3 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

Some improvements to the frontend-design skill. Bumps the plugin version to 1.1.0 so installed copies pick up the update.
