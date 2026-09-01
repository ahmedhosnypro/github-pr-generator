# Merged PRs: flutter/flutter

## PR #69846: Remove add-to-app Xcode build phase input files

- URL: https://github.com/flutter/flutter/pull/69846
- Author: jmagman
- Merged: 2020-11-05T07:27:00Z (created: 2020-11-05T02:21:47Z)
- Stats: +0 -6, 1 files
- Labels: tool, a: existing-apps, t: xcode
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

## Description

Remove the input files in the add-to-app CocoaPods build script to always run the Flutter script.
![Screen Shot 2020-11-04 at 5 53 32 PM](https://user-images.githubusercontent.com/682784/98187829-a9705000-1ec6-11eb-9dc6-09b90ea0ca82.png)

1. As of https://github.com/flutter/flutter/pull/69699 App.framework isn't written to `.ios/Flutter`
2. App.framework should have been listed as an output, not an input.
3. This probably doesn't run the script when it should, like when you switch from a real device to a simulator.
4. There's already logic in the flutter tool to not recompile the dart app when nothing changes.

## Related Issues

Follow up to https://github.com/flutter/flutter/pull/69699

## PR #191547: Roll Fuchsia Linux SDK from ic6GjOSn-KN508XyK... to Cqs-NyeELd60hqv1e...

- URL: https://github.com/flutter/flutter/pull/191547
- Author: engine-flutter-autoroll
- Merged: 2026-08-22T21:30:09Z (created: 2026-08-22T19:53:43Z)
- Stats: +1 -1, 1 files
- Labels: engine, CICD
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


If this roll has caused a breakage, revert this CL and stop the roller
using the controls here:
https://autoroll.skia.org/r/fuchsia-linux-sdk-flutter
Please CC awolff@google.com,zra@google.com on the revert to ensure that a human
is aware of the problem.

To file a bug in Flutter: https://github.com/flutter/flutter/issues/new/choose

To report a problem with the AutoRoller itself, please file a bug:
https://issues.skia.org/issues/new?component=1389291&template=1850622

Documentation for the AutoRoller is here:
https://skia.googlesource.com/buildbot/+doc/main/autoroll/README.md


## PR #192031: Roll Fuchsia Linux SDK from J123CwfDPYyVDpkMl... to o9DikEfRoFyVK3LKD...

- URL: https://github.com/flutter/flutter/pull/192031
- Author: engine-flutter-autoroll
- Merged: 2026-08-30T02:53:36Z (created: 2026-08-30T00:48:39Z)
- Stats: +1 -1, 1 files
- Labels: engine, CICD
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


If this roll has caused a breakage, revert this CL and stop the roller
using the controls here:
https://autoroll.skia.org/r/fuchsia-linux-sdk-flutter
Please CC jsimmons@google.com,zra@google.com on the revert to ensure that a human
is aware of the problem.

To file a bug in Flutter: https://github.com/flutter/flutter/issues/new/choose

To report a problem with the AutoRoller itself, please file a bug:
https://issues.skia.org/issues/new?component=1389291&template=1850622

Documentation for the AutoRoller is here:
https://skia.googlesource.com/buildbot/+doc/main/autoroll/README.md


## PR #192037: Roll Skia from 3ae8e3d1e335 to ce359c7fbfe6 (1 revision)

- URL: https://github.com/flutter/flutter/pull/192037
- Author: engine-flutter-autoroll
- Merged: 2026-08-30T15:55:37Z (created: 2026-08-30T14:19:44Z)
- Stats: +1 -1, 1 files
- Labels: engine, CICD
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


https://skia.googlesource.com/skia.git/+log/3ae8e3d1e335..ce359c7fbfe6

2026-08-30 skia-autoroll@skia-public.iam.gserviceaccount.com Roll SKP CIPD package from 574 to 575

If this roll has caused a breakage, revert this CL and stop the roller
using the controls here:
https://autoroll.skia.org/r/skia-flutter-autoroll
Please CC jsimmons@google.com,kjlubick@google.com,nathanasanchez@google.com on the revert to ensure that a human
is aware of the problem.

To file a bug in Skia: https://bugs.chromium.org/p/skia/issues/entry
To file a bug in Flutter: https://github.com/flutter/flutter/issues/new/choose

To report a problem with the AutoRoller itself, please file a bug:
https://issues.skia.org/issues/new?component=1389291&template=1850622

Documentation for the AutoRoller is here:
https://skia.googlesource.com/buildbot/+doc/main/autoroll/README.md


## PR #192040: Roll Skia from ce359c7fbfe6 to 588b550a4dd8 (1 revision)

- URL: https://github.com/flutter/flutter/pull/192040
- Author: engine-flutter-autoroll
- Merged: 2026-08-30T17:44:57Z (created: 2026-08-30T16:07:46Z)
- Stats: +1 -1, 1 files
- Labels: engine, CICD
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


https://skia.googlesource.com/skia.git/+log/ce359c7fbfe6..588b550a4dd8

2026-08-30 skia-autoroll@skia-public.iam.gserviceaccount.com Roll vulkan-deps from bae94fa5093d to 87c22542b6b7 (1 revision)

If this roll has caused a breakage, revert this CL and stop the roller
using the controls here:
https://autoroll.skia.org/r/skia-flutter-autoroll
Please CC jsimmons@google.com,kjlubick@google.com,nathanasanchez@google.com on the revert to ensure that a human
is aware of the problem.

To file a bug in Skia: https://bugs.chromium.org/p/skia/issues/entry
To file a bug in Flutter: https://github.com/flutter/flutter/issues/new/choose

To report a problem with the AutoRoller itself, please file a bug:
https://issues.skia.org/issues/new?component=1389291&template=1850622

Documentation for the AutoRoller is here:
https://skia.googlesource.com/buildbot/+doc/main/autoroll/README.md

