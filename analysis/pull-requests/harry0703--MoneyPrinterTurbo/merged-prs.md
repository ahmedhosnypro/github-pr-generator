# Merged PRs: harry0703/MoneyPrinterTurbo

## PR #1263: fix(audio): measure audio_duration from the real file, not SubMaker cues

- URL: https://github.com/harry0703/MoneyPrinterTurbo/pull/1263
- Author: YUSAKRU
- Merged: 2026-08-26T09:27:41Z (created: 2026-08-25T17:23:45Z)
- Stats: +149 -1, 2 files
- Labels: none
- Reviews: 1 | Comments: 4
- Linked issues: none

### Description

## Summary

`generate_audio()` computed `audio_duration` from `voice.get_audio_duration(sub_maker)`, which reads `SubMaker.cues[-1].end` — the last **word boundary** reported by the TTS engine's streaming metadata. TTS engines leave a short tail of silence beyond that boundary, so this systematically under-counts the real audio length.

**This is not a new opinion about which number is correct — it is an internal inconsistency the codebase already resolves the other way.** The WebUI voice-preview path measures the real file (`webui/Main.py:4205` → `voice.get_audio_duration(audio_file)`), and `generate_audio()` returns `math.ceil()` of that value when the preview cache is reused (`app/services/task.py:474`). So before this change, the *same script with the same voice* produced a different `audio_duration` depending on whether the preview cache happened to hit (file-measured, correct) or miss (word-boundary, short). This PR makes the TTS path agree with the path right above it.

## Measured

Live Edge TTS, `en-US-AriaNeural`, measured with the project's own `voice.get_audio_duration()` on both targets and cross-checked with `ffprobe`:

| Script | SubMaker | Real file | Gap | Error |
|---|---|---|---|---|
| 7 words | 3.750s | 4.630s | 0.880s | **19.0%** |
| 39 words | 16.450s | 17.330s | 0.880s | 5.1% |
| 153 words | 60.575s | 61.460s | 0.885s | 1.4% |

The gap is a **constant ~0.88s tail, not a proportional error** — identical across a 13× range of audio length, and byte-deterministic across repeated synthesis of the same text. The tail size varies by voice (@harry0703 measured 0.5625s on his reproduction: 7.8375s vs 8.4s), but it is constant within a voice.

Because the tail is fixed, **the relative error is worst on short clips** — 19% on a 7-word script — which is this project's primary use case.

## What the under-count actually affects

Ranked by impact:

1. **`generate_bgm(video_duration=audio_duration)`** (`app/services/task.py:838`) — a paid third-party call (Sonilo/ElevenLabs) sized off the under-count, producing music shorter than the video you were billed for.
2. **Reported duration** (`app/services/task.py:1350`, `:1444`) — the API response and WebUI show a duration that is short by the tail.
3. **`download_videos(audio_duration=audio_duration * params.video_count)`** (`app/services/task.py:721`) — under-sourced footage, with the error multiplied by `video_count`. `combine_videos()` compensates by looping clips (`app/services/video.py:724-737`), so the visible result is more repetition rather than a short video.

**Correction to the original description of this PR:** I initially wrote that the final mux truncates the narration via `-shortest`. That is wrong for this pipeline and I want to withdraw it rather than have it merged into the history. `combine_videos()` never receives `audio_duration`; it re-measures the audio from the real file (`app/services/video.py:549-553`) and adds a 0.1s safety margin (`app/services/video.py:94-102`), and there is no `-shortest` anywhere in `app/` (zero grep hits). The final render is correct today — which is exactly why @harry0703's end-to-end check matched the 8.4s audio. The defect is the wrong *value*, not a truncated *render*.

## Fix

Measure `audio_file` first; fall back to the SubMaker figure only when file measurement returns `0` — which `voice.get_audio_duration()` returns for a missing file (`app/services/voice.py:2204`) or a decode failure (`:2211`). `voice.get_audio_duration()` already accepted a file path (`_get_audio_duration_from_file`); the call site simply wasn't using it even though `audio_file` was in scope.

## Test plan

Regression coverage as requested, in `test/services/test_task.py`:

- [x] **Priority** — a valid file duration wins over the shorter SubMaker duration, asserted with your own reproduction numbers (8.4 vs 7.8375 → 9). Two further cases: an exact-integer file duration (8.0 → 8, ruling out an off-by-one in the `ceil`), and a file duration *shorter* than the SubMaker value (5.0 vs 7.8375 → 5), which pins the contract as "the file wins" rather than "the larger value wins".
- [x] **Fallback** — when file measurement returns 0, the SubMaker duration is used.
- [x] **Zero guard** — when both measurements are 0, the existing `"generated audio duration is zero"` failure still fires. This branch had no coverage anywhere in `test/`; since this PR changes how `audio_duration` is computed, it is a regression test for this change.
- [x] Tests verified to be load-bearing: reverting the fix turns the priority cases red.
- [x] `ruff check` and the full `pytest -q test` suite pass locally on Python 3.11.

Mocked at the `voice.tts` / `voice.get_audio_duration` boundary, following the existing convention in this file — no real ffmpeg, since `test_task.py` also runs in the Windows smoke job.

## Follow-ups (deliberately not in this PR)

Two adjacent issues I found while writing these tests, left out to keep this change reviewable:

1. `generate_audio()` returns an `int` from the TTS branch (`math.ceil`) but a raw `float` from the custom-audio branch (`app/services/task.py:557`), and both land in the same `audio_duration` key and the same `video_duration=` argument.
2. The `"custom audio duration is zero"` branch (`app/services/task.py:558`) is also untested.

Happy to open a separate PR for either if you want them.


## PR #1269: fix(tts): ensure AudioFileClip is always closed in ElevenLabs, Chatterbox, and Fish Audio

- URL: https://github.com/harry0703/MoneyPrinterTurbo/pull/1269
- Author: Mihir7027
- Merged: 2026-08-26T09:34:17Z (created: 2026-08-26T06:04:26Z)
- Stats: +115 -6, 2 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

## Summary
- `elevenlabs_tts`, `chatterbox_tts`, and `fish_audio_tts` each open an
  `AudioFileClip` (spawning an FFmpeg subprocess) and call `.close()` in
  plain sequential code, with no `try/finally`.  If anything raises between
  construction and close the subprocess leaks.
- The pre-existing `_write_validated_minimax_audio` already wraps
  `.duration` in `try/finally`; this PR extends that pattern to the three
  remaining providers.

## Changes
- Wrapped `audio_clip.duration` in `try/finally: audio_clip.close()` in
  `elevenlabs_tts`, `chatterbox_tts`, and `fish_audio_tts`
  (`app/services/voice.py`)
- Added three unit tests that mock `.duration` to raise a `RuntimeError`
  and assert `.close()` is still called

## Test plan
- [ ] `test_elevenlabs_tts_audio_clip_closed_on_duration_error` passes
- [ ] `test_chatterbox_tts_audio_clip_closed_on_duration_error` passes
- [ ] `test_fish_audio_tts_audio_clip_closed_on_duration_error` passes
- [ ] Existing ElevenLabs/Chatterbox TTS success tests still pass

## PR #1270: fix(llm): use non-greedy quantifier when stripping bracket and paren groups from script

- URL: https://github.com/harry0703/MoneyPrinterTurbo/pull/1270
- Author: Mihir7027
- Merged: 2026-08-26T09:37:30Z (created: 2026-08-26T08:30:43Z)
- Stats: +40 -3, 2 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

## Summary
- `format_response` in `generate_script` used `re.sub(r"\[.*\]", ...)` and
  `re.sub(r"\(.*\)", ...)`. The greedy `.*` matches from the first opener
  to the **last** closer on the same line, deleting all text in between.
- Examples of silent data loss:
  - `"[Intro] Great content [end]"` → `"."`
  - `"Save (at least) 10% of income (monthly)."` → `"Save ."`
- Replaced `.*` with `.*?` so each bracket/paren group is removed
  independently, leaving surrounding words intact.

## Test plan
- [ ] `test_generate_script_strips_each_bracket_group_independently` passes
- [ ] Existing `test_generate_script_sends_custom_prompt_to_llm` passes

## PR #1277: Add OpenRouter LLM provider

- URL: https://github.com/harry0703/MoneyPrinterTurbo/pull/1277
- Author: brizzio
- Merged: 2026-08-28T01:59:17Z (created: 2026-08-27T20:34:25Z)
- Stats: +75 -1, 7 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

## Summary
- Add OpenRouter as an OpenAI-compatible LLM provider
- Use `minimax/minimax-m3:free` as the default free model
- Document OpenRouter settings in config example and Colab notebook
- Add i18n labels/tips and provider tests

## Tests
- `uv run pytest test/services/test_llm.py test/services/test_webui_llm_settings.py test/services/test_webui_i18n.py`

## PR #1282: Fix UnicodeEncodeError that kills the CLI after a successful run

- URL: https://github.com/harry0703/MoneyPrinterTurbo/pull/1282
- Author: housine35
- Merged: 2026-08-30T00:12:42Z (created: 2026-08-29T15:20:30Z)
- Stats: +22 -0, 1 files
- Labels: none
- Reviews: 0 | Comments: 1
- Linked issues: none

### Description

### What happens

On a Windows console the default code page is a legacy one (cp1252 in Western Europe). Generating a video in French produces `U+202F`, the narrow no-break space French typography places before `:` and `!`, and Loguru's own progress lines carry circled digits such as `U+2464`.

Either character raises `UnicodeEncodeError` when the CLI prints its result — which happens **after** the pipeline has finished writing the video:

```
SUCCESS | "./app/services/task.py:1446": _run_pipeline - task 62f8f42a-... finished, generated 1 videos.
Traceback (most recent call last):
  File "cli.py", line 1495, in run_cli
    print(json.dumps({"task_id": task_id, "result": result}, ensure_ascii=False))
UnicodeEncodeError: 'charmap' codec can't encode character ' ' in position 1116
```

The video is intact on disk. But the process exits non-zero and never prints where the file is, so the run reads as a failure and the path has to be hunted for under `storage/tasks/`.

The same thing happens inside Loguru's handler during the run:

```
--- Logging error in Loguru Handler #1 ---
UnicodeEncodeError: 'charmap' codec can't encode character '⑤'
```

### Reproducing

```bash
python cli.py --video-subject "Les 18 heures de Pompéi" --video-language fr-FR --stop-at script
```

Windows 11, Python 3.13, `chcp` 1252. Any non-ASCII target language reaches it; French does so reliably because of the narrow no-break space.

### The change

Reconfigure `stdout` and `stderr` to UTF-8 at the entry point, before anything is written. Streams that do not support `reconfigure()` — a wrapper, a pipe under some runners — are skipped rather than made to crash on the fix itself.

22 lines, `cli.py` only. No behaviour change on platforms that already default to UTF-8.

### Verified

Same command after the patch prints the JSON result intact, with `’`, `°C` and the narrow no-break space preserved, and exits 0.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

