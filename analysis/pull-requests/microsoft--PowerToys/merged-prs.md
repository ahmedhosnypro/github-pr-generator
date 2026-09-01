# Merged PRs: microsoft/PowerToys

## PR #50198: [Settings] Fix Simplified Chinese Quick Access translation

- URL: https://github.com/microsoft/PowerToys/pull/50198
- Author: moooyo
- Merged: 2026-08-28T15:27:22Z (created: 2026-08-28T06:42:27Z)
- Stats: +1 -0, 1 files
- Labels: Product-Settings, Ready for review
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

## Summary of the Pull Request

Adds Simplified Chinese translator guidance for the General page Quick Access description so the complete translation uses `快速操作和模块切换` instead of the incorrect `快速访问快速作和模块切换`.

## PR Checklist

- [x] Closes: #50172
- [ ] **Communication:** I've discussed this with core contributors already. If the work hasn't been agreed, this work might be rejected
- [ ] **Tests:** Added/updated and all pass
- [x] **Localization:** All end-user-facing strings can be localized
- [ ] **Dev docs:** Added/updated
- [ ] **New binaries:** Added on the required places
   - [ ] [JSON for signing](https://github.com/microsoft/PowerToys/blob/main/.pipelines/ESRPSigning_core.json) for new binaries
   - [ ] [WXS for installer](https://github.com/microsoft/PowerToys/blob/main/installer/PowerToysSetup/Product.wxs) for new binaries and localization folder
   - [ ] [YML for CI pipeline](https://github.com/microsoft/PowerToys/blob/main/.pipelines/ci/templates/build-powertoys-steps.yml) for new test projects
   - [ ] [YML for signed pipeline](https://github.com/microsoft/PowerToys/blob/main/.pipelines/release.yml)
- [ ] **Documentation updated:** If checked, please file a pull request on [our docs repo](https://github.com/MicrosoftDocs/windows-uwp/tree/docs/hub/powertoys) and link it here: #xxx

## Detailed Description of the Pull Request / Additional comments

Issue #50172 reports that the Simplified Chinese translation of `GeneralPage_EnableQuickAccess.Description` is rendered as `快速访问快速作和模块切换`. The intended Simplified Chinese translation is `快速操作和模块切换`.

PowerToys localized resources are generated through the Touchdown localization pipeline, so this PR adds an explicit translator comment to the English resource entry. The English value, resource key, XAML, Traditional Chinese and other locales, and runtime behavior remain unchanged.

## Validation Steps Performed

- Parsed the modified `Resources.resw` successfully as XML.
- Verified the affected entry contains only Simplified Chinese guidance with the exact intended translation.
- Confirmed the diff changes only the translator comment and passes `git diff --check`.
- No build or automated tests were run because this is a translator-comment-only localization change with no runtime impact.


## PR #50210: CmdPal: Restore content viewer spec and regenerate IDL

- URL: https://github.com/microsoft/PowerToys/pull/50210
- Author: jiripolasek
- Merged: 2026-08-28T19:56:53Z (created: 2026-08-28T15:59:11Z)
- Stats: +202 -100, 3 files
- Labels: Product-Command Palette, Ready for review
- Reviews: 1 | Comments: 4
- Linked issues: none

### Description

## Summary of the Pull Request

Restore the image and plain-text content documentation that was omitted from merged PR #43964. Preserve the original documentation while fixing its frontmatter typo and trailing whitespace.

Reconcile older grid, filter, ContentSize, and fallback definitions in the Markdown with the existing SDK before regenerating the IDL. All 76 current SDK declarations, including members, UUIDs, and contracts, are preserved.

Mark the IDL as generated, reject missing or failed Markdown parsers, normalize generated whitespace, and correct the regeneration instructions.

Restored-from: 6c5a415fd41da51560803129a6784c3388297be3

<!-- Please review the items on the PR checklist before submitting-->
## PR Checklist

- [ ] Closes: #xxx
<!--  - [ ] Closes: #yyy (add separate lines for additional resolved issues) -->
- [ ] **Communication:** I've discussed this with core contributors already. If the work hasn't been agreed, this work might be rejected
- [ ] **Tests:** Added/updated and all pass
- [ ] **Localization:** All end-user-facing strings can be localized
- [ ] **Dev docs:** Added/updated
- [ ] **New binaries:** Added on the required places
   - [ ] [JSON for signing](https://github.com/microsoft/PowerToys/blob/main/.pipelines/ESRPSigning_core.json) for new binaries
   - [ ] [WXS for installer](https://github.com/microsoft/PowerToys/blob/main/installer/PowerToysSetup/Product.wxs) for new binaries and localization folder
   - [ ] [YML for CI pipeline](https://github.com/microsoft/PowerToys/blob/main/.pipelines/ci/templates/build-powertoys-steps.yml) for new test projects
   - [ ] [YML for signed pipeline](https://github.com/microsoft/PowerToys/blob/main/.pipelines/release.yml)
- [ ] **Documentation updated:** If checked, please file a pull request on [our docs repo](https://github.com/MicrosoftDocs/windows-uwp/tree/docs/hub/powertoys) and link it here: #xxx

<!-- Provide a more detailed description of the PR, other things fixed, or any additional comments/features here -->
## Detailed Description of the Pull Request / Additional comments

<!-- Describe how you validated the behavior. Add automated tests wherever possible, but list manual validation steps taken as well -->
## Validation Steps Performed




## PR #50178: CmdPal: Add IFormContent2 support

- URL: https://github.com/microsoft/PowerToys/pull/50178
- Author: zadjii-msft
- Merged: 2026-08-28T21:47:16Z (created: 2026-08-27T20:48:53Z)
- Stats: +51 -3, 6 files
- Labels: Product-Command Palette, CmdPal-API, 0.102, Ready for review
- Reviews: 3 | Comments: 1
- Linked issues: none

### Description

When you create an action in adaptive cards, you can assign an ID to that action. That ID helps identify what the user activated. It might _not_ be a part of the action JSON. Sometimes it comes through as a separate piece of data. 

If we wanted to be more technically correct (and we do), then our `SubmitForm` should also accept an action ID. 

This adds an update to `IFormContent` to do just that.
`IFormContent2` adds `SubmitAction` which is just `SubmitForm`, but with an ID. If you don't manually implement `SubmitAction` in the next version of the toolkit, we'll forward it along to the old `SubmitForm`.

Built it and ran the sample locally. 

Closes: _future work item_


## PR #50230: [UITests][MouseUtilities] Migrate to .Next and add test for Cursor Wrap

- URL: https://github.com/microsoft/PowerToys/pull/50230
- Author: khmyznikov
- Merged: 2026-08-30T17:07:40Z (created: 2026-08-29T06:36:39Z)
- Stats: +3519 -148, 29 files
- Labels: Area-Tests, Product-Mouse Utilities, Ready for review
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

<!-- Suggested title: [UITests][Mouse Utilities] Migrate and expand UI tests to UITest.Next -->

## Summary of the Pull Request

Adds a side-by-side `Microsoft.PowerToys.UITest.Next` end-to-end suite for Mouse Utilities. The new Microsoft Testing Platform executable uses winappcli and contains 40 tests across Find My Mouse, Mouse Highlighter, Mouse Pointer Crosshairs, Mouse Jump, and Cursor Wrap.

The suite replaces legacy driver assumptions with effect-based assertions against module windows, named events, processes, cursor movement, and rendered pixels. It also opts Mouse Utils into the pipeline's existing test-signing setup for authenticated Runner/Settings IPC, hardens the shared `.Next` input/event helpers, and adds agent-owned Azure/local-VM completion safeguards used to validate the suite autonomously.

No Mouse Utilities runtime behavior or third-party dependencies are added. The only product-UI change is a stable AutomationId for the existing Cursor Wrap toggle.

## PR Checklist

- [x] Closes: #40667 
- [x] **Communication:** Confirm with core contributors before marking the PR ready for review
- [x] **Tests:** Added and validated locally and in Azure DevOps
- [x] **Localization:** No end-user-facing strings were added
- [x] **Dev docs:** Updated the release-checklist migration map and documented hardware-only gaps
- [x] **New binaries:** No shipped binary was added; the new executable is a test project registered in `PowerToys.slnx`
  - [x] JSON for signing: N/A - no shipped binary
  - [x] WXS for installer: N/A - no installed component
  - [x] YML for CI pipeline: Updated test setup to sign the Runner and Settings IPC companions when Mouse Utils is selected
  - [x] YML for signed pipeline: N/A - no release artifact
- [ ] **Documentation updated:** N/A - no public MicrosoftDocs change is required

## Detailed Description of the Pull Request / Additional comments

### Mouse Utilities UI-test project

Adds `src/modules/MouseUtils/MouseUtils.UITests.Next` as a Microsoft Testing Platform executable using `UITestAutomation.Next` and winappcli. The project is registered for x64 and ARM64 in `PowerToys.slnx`.

The 40 tests are distributed as follows:

| Module | Tests | Coverage highlights |
|---|---:|---|
| Cursor Wrap | 10 | Module lifecycle, all edge directions, horizontal/vertical modes, Ctrl/Shift activation, drag suppression, single-monitor suppression, auto-activate, and changed shortcut |
| Find My Mouse | 9 | Keyboard/mouse dismissal, disable/re-enable, colors and alpha, radius, initial zoom, duration, right Ctrl, custom shortcut, Win-key gating, and excluded apps |
| Mouse Highlighter | 9 | Click/drag tracking, changed shortcut, disable behavior, colors and alpha, radius, fade timing, Spotlight mode, Ripple size/intensity/duration, drag trail, release pulse, and auto-activate |
| Mouse Jump | 6 | Process/event/HWND readiness, default and changed shortcuts, preview click mapping, disable behavior, focus loss, aspect-preserving bounds, and custom colors |
| Mouse Pointer Crosshairs | 6 | Activation/tracking/hide, disable/re-enable, changed shortcut, dimensions and border, opacity, orientation/fixed length, auto-activate, and Gliding Cursor |

Each class enables exactly one module and replaces that module's settings with a deterministic snapshot before launch. Structured JSON is used for Find My Mouse settings, and module readiness is established through authoritative events, processes, and windows rather than proxy UI state.

### Effect-based test support

The selected `UITestAutomation.Next` additions provide:

- Named-event constants and availability/signal waits for all five Mouse Utilities modules.
- Correct event-absence semantics: only a missing event is treated as unavailable; access and other failures remain visible.
- Side-specific Ctrl input and a keyboard-layout guard for OEM-period scenarios.
- Stepped relative mouse movement for modules that consume low-level movement.
- Checked `SetCursorPos` and `GetCursorPos` calls so Win32 failures cannot become false `(0,0)` observations.
- A title-bound Notepad fixture that follows the real editor window across inbox and modern launcher behavior.

Transient overlays are observed with `WindowShowWatcher` rather than UI polling. Visual assertions use shared calibrated desktop-pixel and bitmap helpers, including full-annulus Ripple detection and exact Crosshairs/Spotlight geometry checks. Positive transient effects may retry the complete input-and-observation sequence under constrained scheduling; negative assertions are not retried.

### Authenticated Settings IPC in Release CI

Runner IPC authentication added by #49527 requires the Release Runner to validate the Settings binary before accepting module lifecycle commands. Unsigned PR artifacts cannot satisfy that gate without test setup.

The UI Test Automation pipeline already solves this for PowerRename by signing `PowerToys.exe` and `PowerToys.Settings.exe` with a disposable, machine-trusted test identity whose publisher matches the Release IPC policy. This PR opts `MouseUtils.UITests.Next` into that same existing mechanism.

The test certificate and private key are removed by the pipeline cleanup. Production authentication code and policy are unchanged.

All Mouse Utilities lifecycle tests use the real Settings UI directly. After changing a module switch, they assert the immediate runtime effect through the module's named event, process, window, shortcut, or cursor behavior. There is no settings-file or restart fallback in the tests.

### Autonomous validation hardening

The same branch hardens the execution path used to prove the new tests:

- Adds a synchronous `Wait-AzureDevOpsBuild.ps1` waiter bound to the exact build ID, branch, and source SHA, with typed progress/terminal events and best-effort host sleep prevention.
- Makes Azure build snapshots safe under PowerShell StrictMode when optional REST fields are omitted, covered by canned `notStarted`, `inProgress`, and `completed` Pester cases.
- Hardens local-VM execution with bounded task-start/task-exit checks, retrying task-state reads, and best-effort host sleep prevention so a missing result cannot silently wait until the suite timeout.
- Documents the foreground agent-owned wait requirement and the evidence needed before declaring a CI run complete.

### Checklist migration and manual boundaries

Updates `Release-Test-Checklist-Migration-Progress.md` to map every automated assertion to its test class. The unchecked rows are fixtures the single-monitor Hyper-V environment cannot represent faithfully:

- Exclusive/native fullscreen game-mode behavior.
- Physical raw-mouse shake activation.
- Cross-process hidden-cursor state.
- Multi-monitor topology, mixed DPI, hot-plug, negative coordinates, display gaps, and complex Cursor Wrap edge geometry.

## Validation Steps Performed

### Build and focused validation

- `MouseUtils.UITests.Next` x64 and ARM64 Debug builds: **passed**, empty errors logs.
- Settings UI, Screen Ruler `.Next`, and FancyZones `.Next` x64 builds: **passed**.
- Azure waiter Pester tests: **3/3 passed**.
- Shared `UITestAutomation.Next` unit tests: **19/19 passed**.
- Mouse Utils inventory: **40** test methods, with zero ignored, inconclusive, or not-executed declarations.
- Editor diagnostics and `git diff --check`: **passed**.

### Local VM validation

The complete Mouse Utilities suite passed on both supported x64 operating systems and resource profiles:

| Environment | Allocation | Result | Run ID |
|---|---:|---:|---|
| Windows 10 default | 4 vCPU / 8 GB | **40/40 passed** | `localvm-20260829-004323-60f44915` |
| Windows 11 default | 4 vCPU / 8 GB | **40/40 passed** | `localvm-20260829-004920-412fbecb` |
| Windows 10 constrained | 1 vCPU / 4 GB | **40/40 passed** | `localvm-20260829-002136-d40f5345` |
| Windows 11 constrained | 1 vCPU / 4 GB | **40/40 passed** | `localvm-20260829-003130-d8057027` |

Every listed run executed all 40 tests with zero skipped/not-executed tests and zero evidence-export errors. CPU and memory allocations were verified from Hyper-V while each run was active.

Additional checks passed on both Windows 10 and Windows 11:

- The five direct Settings lifecycle scenarios.
- Screen Ruler's direct `MouseHelper.MoveTo` scenario.
- FancyZones' direct `MouseHelper.MoveTo` scenario.

### Azure DevOps UI Test Automation

Final combined verification build: [156199762 / 20260829.1](https://dev.azure.com/microsoft/c93e867a-8815-43c1-92c4-e7dd5404f1e1/_build/results?buildId=156199762)

Source SHA: `3163ff7db66c92944dabcf1533c2c4f6de14db9a`

Modules: `MouseUtils.UITests.Next`, `ScreenRuler.UITests.Next`, and `FancyZones.UITests.Next`.

The run built fresh ARM64 and x64 product artifacts. Every platform job signed and Authenticode-verified `PowerToys.exe` and `PowerToys.Settings.exe` before testing; stale-certificate removal and final certificate cleanup also succeeded.

| Platform | Azure Test run | FancyZones | Mouse Utils | Screen Ruler | Total |
|---|---:|---:|---:|---:|---:|
| ARM64 | [1654312169](https://microsoft.visualstudio.com/Dart/_TestManagement/Runs?runId=1654312169&_a=runCharts) | **21/21** | **40/40** | **5/5** | **66/66** |
| Windows 10 x64 | [1654313603](https://microsoft.visualstudio.com/Dart/_TestManagement/Runs?runId=1654313603&_a=runCharts) | **21/21** | **40/40** | **5/5** | **66/66** |
| Windows 11 x64 | [1654315321](https://microsoft.visualstudio.com/Dart/_TestManagement/Runs?runId=1654315321&_a=runCharts) | **21/21** | **40/40** | **5/5** | **66/66** |

Final CI result: **198/198 passed**. All five stages succeeded, the timeline contains zero failed records, and there were no failed, skipped, inconclusive, aborted, timed-out, or not-executed results. Normal `build-arm64-Release` and `build-x64-Release` artifacts were published.

Each publish step warned that five optional Screen Ruler `TestExecutionLog_*` attachments were no longer present in the temporary deployment directory. Those tests passed on every platform, and the same diagnostics remain inline in the test results; this is non-blocking evidence loss in the pre-existing best-effort logger.

<img width="1153" height="458" alt="image" src="https://github.com/user-attachments/assets/9d109fc6-8343-4110-9169-67e7bcbcb1ef" />
<img width="990" height="842" alt="image" src="https://github.com/user-attachments/assets/44f17a82-c3ac-477f-ab39-c742c6eca275" />


## Reviewer guide

Suggested review order:

1. `src/modules/MouseUtils/MouseUtils.UITests.Next/MouseUtilsTestHelper.cs` - deterministic setup, Settings navigation, and module-toggle handling.
2. The five test classes in `src/modules/MouseUtils/MouseUtils.UITests.Next` - behavioral coverage and effect assertions.
3. `src/common/UITestAutomation.Next/NamedEventHelper.cs`, `KeyboardHelper.cs`, and `MouseHelper.cs` - shared input/event behavior.
4. `.pipelines/v2/templates/job-test-project.yml` - reuse of the existing companion-signing path.
5. `.github/skills/ui-tests-pipeline-ci` and `.github/skills/ui-tests-local-vm` - foreground waiting and execution hardening.
6. `src/modules/MouseUtils/MouseUtils.UITests/Release-Test-Checklist-Migration-Progress.md` - automated coverage and remaining hardware-only checks.
7. `PowerToys.slnx` and `MouseUtils.UITests.Next.csproj` - x64/ARM64 project registration.


## PR #50220: [GH Actions][UITests] Trigger new UI tests automatically per modified module

- URL: https://github.com/microsoft/PowerToys/pull/50220
- Author: khmyznikov
- Merged: 2026-08-30T17:08:00Z (created: 2026-08-29T00:08:51Z)
- Stats: +259 -3, 7 files
- Labels: Ready for review
- Reviews: 2 | Comments: 1
- Linked issues: none

### Description

Automatically runs affected UI tests for pull requests as part of the existing PowerToys CI build. Only test projects that reference `UITestAutomation.Next` are selected; legacy-only UI test projects are skipped.

The UI test jobs reuse artifacts from the successful x64 and ARM64 product builds instead of building PowerToys again. These automatic jobs are non-blocking while the workflow is being evaluated.

## PR Checklist

- [ ] Closes: N/A (no linked issue)
- [x] **Communication:** Discussed with core contributors
- [x] **Tests:** Added/updated and all pass
- [x] **Localization:** N/A; no end-user-facing strings
- [x] **Dev docs:** N/A; pipeline-only change
- [x] **New binaries:** N/A
- [x] **Documentation updated:** N/A; no user-facing documentation change

## Detailed Description of the Pull Request / Additional comments

- Detects modules changed by a PR from the merge-base diff against its target branch.
- Parses each touched module's `.csproj` files and selects only projects that reference `UITestAutomation.Next.csproj`. Selection does not depend on the project name, so migrated projects such as `FileLocksmith.UITests` remain eligible without a `.Next` suffix.
- Skips modules that have no UI tests on the new framework, including modules with only legacy UI tests.
- Runs selected test assemblies by exact project name to prevent legacy and `.Next` projects from matching each other.
- Adds the affected UI test jobs to the existing x64 and ARM64 CI stages. They depend on the corresponding successful product build and reuse its published installer and test outputs through `buildNowSlim`.
- Runs x64 UI tests on Windows 10 and Windows 11 and ARM64 UI tests on the ARM64 test agent.
- Keeps automatic resolver and UI test jobs non-blocking with `continueOnError`. Manual UI Test Automation runs remain blocking.
- Disables automatic triggers on the standalone UI Test Automation pipeline to avoid a duplicate product build and duplicate test run.

## Validation Steps Performed

- Ran `Invoke-Pester .\.pipelines\tests\resolveUiTestModules.Tests.ps1 -PassThru`: 3 passed, 0 failed.
- Verified real repository mappings:
  - File Locksmith selects `FileLocksmith.UITests`.
  - FancyZones selects `FancyZones.UITests.Next` and `FancyZonesEditor.UITests.Next` while excluding legacy siblings.
  - Color Picker selects `ColorPicker.UITests` based on its new-framework reference.
  - Legacy-only Hosts selects no automatic UI tests.
- Checked all modified PowerShell and YAML files with VS Code diagnostics: no errors.
- Ran `git diff --check` and `git diff --cached --check`: no whitespace errors.

