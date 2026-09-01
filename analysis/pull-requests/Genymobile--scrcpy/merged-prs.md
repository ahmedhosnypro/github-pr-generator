# Merged PRs: Genymobile/scrcpy

## PR #6772: Add flex display support (resizable virtual display)

- URL: https://github.com/Genymobile/scrcpy/pull/6772
- Author: rom1v
- Merged: 2026-05-09T15:30:39Z (created: 2026-04-16T20:04:02Z)
- Stats: +1131 -352, 47 files
- Labels: none
- Reviews: 92 | Comments: 128
- Linked issues: Fixes #6632

### Description

```bash
# Start Android Settings in a window
scrcpy --new-display=1024x768 --start-app=com.android.settings --flex-display

# -x is equivalent to --flex-display
scrcpy --new-display=1024x768 --start-app=com.android.settings -x

# By default, the display size/dpi is 1280x960/160
scrcpy --new-display --start-app=com.android.settings --flex-display
```

Use `--keep-active` to prevent the screen from turning off:

```bash
scrcpy --new-display --flex-display --keep-active
```

Increase the bit rate (and/or change the codec) to maintain good quality even with large windows:

```bash
scrcpy --new-display -x --video-codec=h265 -b16M
```


## Demo

Here is Firefox for Android running in a "flex" virtual display, ran as follow:

```bash
scrcpy --new=/192 -x --start-app=org.mozilla.firefox --keep-active --no-vd-system-decorations
```

https://github.com/user-attachments/assets/0822bcf7-58c1-4106-87f6-c8089c08a777

<details><summary>previous video</summary>

```bash
scrcpy --new-display=800x600 -x --start-app=org.mozilla.firefox
```

https://github.com/user-attachments/assets/0a86f0e1-9911-45b5-9a25-70d14355ab82

</details>


## Download binaries

Here are binaries built by Github Actions (for `flex-display.16`): https://github.com/rom1v/scrcpy/actions/runs/25569279750

_(download the artifact `release-XXX` where `XXX` is your target platform)_

<details><summary>old versions</summary>

 - `flex-display.1`: https://github.com/rom1v/scrcpy/actions/runs/24530523954
 - `flex-display.4`: https://github.com/rom1v/scrcpy/actions/runs/24731426812
 - `flex-display.5`: https://github.com/rom1v/scrcpy/actions/runs/24899984361
 - `flex-display.6`: https://github.com/rom1v/scrcpy/actions/runs/25006302461
 - `flex-display.7`: https://github.com/rom1v/scrcpy/actions/runs/25009172508
 - `flex-display.10`: https://github.com/rom1v/scrcpy/actions/runs/25065382694
 - `flex-display.13`: https://github.com/rom1v/scrcpy/actions/runs/25282088772
 - `flex-display.15`: https://github.com/rom1v/scrcpy/actions/runs/25405231193
 - `flex-display.16`: https://github.com/rom1v/scrcpy/actions/runs/25508659976
</details>

## Preparation

To prepare compatibility between dynamic resizing and encoders constraints (minimum size, maximum size and alignment), several changes were merged:
 - #6746
 - #6758
 - #6766
 - #6770
 - #6771

## Principles

The core of this feature (and the easy part) consists in a call to [`VirtualDisplay.resize()`](https://developer.android.com/reference/android/hardware/display/VirtualDisplay#resize(int,%20int,%20int)).

"Resize display" requests between the client and the server must never accumulate. To achieve this:
 - requests are squashed on the client side, keeping only the latest value to send
 - requests are squashed on the server side, and the capture/encoding is reset only if the resulting size or rotation differs from the latest state
 - ~`virtualDisplay.resize()` is called from the same thread as the encoding process (otherwise Android would internally accumulate resize calls)~

The difficult part is correctly handling resize events both on the client side and server sides.

In particular, a virtual display can be resized "on its own" (e.g., on app rotation, such as with <kbd>Alt</kbd>+<kbd>r</kbd>) or as the result of an asynchronous client resize request. Both cases trigger the same resize event (detected by `DeviceMonitor`) on the server side, but only independent resizes must reset the capture/encoding session.

On the client side, a window resize event triggers a resize request to the device, which (asynchronously) causes the frame size to change later, which in turn may trigger another client window resize…

To handle this properly, the cause of a capture reset is tracked (in particular "client resize" vs "independent resize", see `DisplayPropertiesTracker`) and transmitted over the wire as an additional flag in the session metadata introduced in #6159. When a new frame with a new size is received, the client can determine whether it must adapt the window size to match the frame. To avoid stuttering, the window must not be resized if the frame size change resulted from its own resize request, since it's asynchronous and additional resize requests may already be in flight.

On the client side, when `--flex-display` is enabled, the rendered frame is not scaled/centered in the window (see `--render-fit`). It is rendered 1:1 in the top-left corner (which may show black bars or cropping between the resize request and the actual resize, due to unavoidable asynchrony).

## Glitches

During a display resize, the captured video stream may contain glitches. The issue arises because everything is asynchronous, involves multiple Android processes, and cannot be synchronized/atomic:
 - the call to `virtualDisplay.resize()`
 - the exact moment when the virtual display is actually resized
 - the display event notifying a display change
 - the call to `virtualDisplay.setSurface()`

In other words, resizing the display and assigning the `MediaCodec` `Surface` to the virtual display cannot be made atomic. As a result, the system may briefly render at the old size on the new surface, or at the new size on the old surface.

EDIT: also see comments below (https://github.com/Genymobile/scrcpy/pull/6772#issuecomment-4263559955).


## Size and DPI

During a resize, the DPI is preserved. I think it's the correct thing to do.

It is possible to specify the initial size and DPI (e.g., `--new-display=1920x1080/240`). When not specified, the default size is 1280x960 and the default dpi is 160 (arbitrarily). Unlike "normal" mirroring mode, these values are not derived from the device display, as they are tied to the client machine.

In theory, they could be computed from the computer's display size and DPI, but this would add complexity and require initializing the SDL video module before starting the server (at least if we want to pass these data as parameter), which would slightly time-to-firstframe. I think a default size and DPI are good enough, as they can still be explicitly configured.

Unlike other PRs, there is no "render factor". The virtual display is rendered 1:1 without scaling, for better quality and simplicity.


## PR History

 - `flex-display.1`: initial version
 - `flex-display.2`: rename `--render-fit=natural` to `--render-fit=letterbox`
 - `flex-display.3`: fixes after reviews
 - `flex-display.4`: change approach (see https://github.com/Genymobile/scrcpy/pull/6772#issuecomment-4289810640)
 - `flex-display.5`: minor refactors and rebase onto the latest `dev`
 - `flex-display.6`: fixes after review + rebase onto `dev` with `--keep-active`
 - `flex-display.7`: fix resize-to-fit and wrong timing logic
 - `flex-display.8`: fix rotation of non-flex displays
 - `flex-display.9`: fix resize behavior above maximum codec size
 - `flex-display.10`: rebase on #6794 to fix OpenGL graceful shutdown
 - `flex-display.11`: rebase and minor fixes
 - `flex-display.12`: allow `--max-size` with flex displays
 - `flex-display.13`: fix behavior for scale factor != 100%
 - `flex-display.14`: fix video constraints synchronization
 - `flex-display.15`: rebase on #6807 (dark background) + center unscaled display
 - `flex-display.16`: fix rotated virtual display size detection
 - `flex-display.17`: center for resize_to_fit
 - `flex-display.18`: minor technical changes after reviews
---

Supersedes #6350, #6351 and #6705.

Fixes #6632

## PR #6922: Fix size constraints for camera capture

- URL: https://github.com/Genymobile/scrcpy/pull/6922
- Author: rom1v
- Merged: 2026-06-28T10:25:34Z (created: 2026-06-27T18:10:55Z)
- Stats: +7 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: Fixes #6919

### Description

**Only apply alignment constraint for camera**
    
Once the camera size has been selected, do not apply any encoder maximum size constraints. Only adjust the size for alignment.

---

**Use OpenGL for camera to adapt to the target size**

The camera stream can only be rendered on a surface matching the input size. If the video constraints change the size, an intermediate OpenGL filter is required.
    
For example, since 1080 is not a multiple of 16, running scrcpy as follows:

```
scrcpy --video-source=camera --camera-size=1920x1080 --min-size-alignment=16
```
    
resulted in:
    
    ERROR: Camera configuration error
    
An intermediate OpenGL filter allows adapting the size without error.

---

Binaries: https://github.com/rom1v/scrcpy/actions/runs/28297540213

Fixes #6919

## PR #6918: Rename sc_delay_buffer to sc_video_regulator

- URL: https://github.com/Genymobile/scrcpy/pull/6918
- Author: rom1v
- Merged: 2026-07-08T10:09:16Z (created: 2026-06-26T17:08:25Z)
- Stats: +319 -318, 6 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

This component serves the same purpose for video as the audio regulator does for audio: maintaining a fixed target latency.

Rename it to "video regulator" for consistency.

## PR #6911: Fix data race

- URL: https://github.com/Genymobile/scrcpy/pull/6911
- Author: rom1v
- Merged: 2026-07-08T15:54:08Z (created: 2026-06-22T22:02:44Z)
- Stats: +56 -14, 4 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

Fields in `struct sc_screen` were written from the decoder thread and read from the main thread without proper synchronization.
    
Contrary to what the comment stated, pushing an SDL event does not provide the synchronization required to make these writes visible to the main thread.
    
Pass the session size as data attached to the SDL event to fix the issue.

CI: https://github.com/rom1v/scrcpy/actions/runs/27986960479

## PR #6770: Reset capture on rotation (fix square displays)

- URL: https://github.com/Genymobile/scrcpy/pull/6770
- Author: rom1v
- Merged: 2026-04-16T17:08:33Z (created: 2026-04-14T21:50:32Z)
- Stats: +94 -40, 4 files
- Labels: none
- Reviews: 7 | Comments: 1
- Linked issues: none

### Description

`DisplayMonitor` previously only triggered a capture reset when the display size changed. In most cases, rotation also changes dimensions, so the behavior was correct… except for square displays where width and height remain unchanged.
    
However, rotation still requires a capture reset even when dimensions do not change, to ensure the orientation filter is applied so virtual displays are rendered correctly.
    
To reproduce the issue:
    
    scrcpy --new-display=600x600 --start-app=com.android.settings
    
Then press <kbd>Alt</kbd>+<kbd>r</kbd> to rotate the Settings app.

(Note: the shortcut was broken on scrcpy 3.3.4, it was fixed on `dev` by 5fedc79530672ae2b0df6ac7654d75a6f2e18ce3)
