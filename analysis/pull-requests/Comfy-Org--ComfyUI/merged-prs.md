# Merged PRs: Comfy-Org/ComfyUI

## PR #15908: MiniMax-H3: Support PDD LoRA

- URL: https://github.com/Comfy-Org/ComfyUI/pull/15908
- Author: kijai
- Merged: 2026-08-28T22:12:37Z (created: 2026-08-26T22:20:44Z)
- Stats: +33 -7, 2 files
- Labels: none
- Reviews: 12 | Comments: 5
- Linked issues: none

### Description

## Support MiniMax H3 PDD acceleration LoRAs

alibaba-pai's [MiniMax-H3-Acc LoRAs](https://huggingface.co/alibaba-pai/MiniMax-H3-Acc-LoRAs) (Parallel Decoding Distillation, 8 NFE) pair a backbone LoRA with a 32-interval bank of output heads; each sampler step uses the Δt-weighted mean of the heads it spans. Comfy had no way to load the bank, and the LoRA half is in diffusers layout.

Converted LoRAs here temporarily for testing:

https://huggingface.co/Kijai/MiniMax-H3-experimental/upload/main/loras

### Changes
- **`comfy/lora.py`**: `set_weight` patches may change a weight's shape; add a matching `set_bias`. Same-shape `set` is unchanged. The patcher already handles resized weights.
- **`comfy/ldm/minimax/model.py`**: `FinalLayer` reads an `[N*out, in]` head as a PDD bank and blends the interval heads from the sampler's next sigma (`sample_sigmas`, as `hunyuan_video` does). Plain heads take the original path.

The bank is stored as `set_weight` / `set_bias` in a normal LoRA file, so the stock LoRA loader works — no new node. `simple` at 8 steps with shifts 12/3 lands exactly on the 32-grid boundaries, so no custom schedule either.



## PR #15955: Add section about user input tolerance to AGENTS.md

- URL: https://github.com/Comfy-Org/ComfyUI/pull/15955
- Author: comfyanonymous
- Merged: 2026-08-29T00:00:30Z (created: 2026-08-28T23:59:25Z)
- Stats: +19 -0, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

(empty)

## PR #15945: [Partner Nodes] fix(HeyGen): update Avatar Video price badge

- URL: https://github.com/Comfy-Org/ComfyUI/pull/15945
- Author: bigcat88
- Merged: 2026-08-29T17:53:59Z (created: 2026-08-28T11:37:58Z)
- Stats: +10 -8, 1 files
- Labels: none
- Reviews: 4 | Comments: 1
- Linked issues: none

### Description

<!-- API_NODE_PR_CHECKLIST: do not remove -->

## API Node PR Checklist

### Scope
- [x] **Is API Node Change**

### Pricing & Billing
- [x] **Need pricing update**
- [ ] **No pricing update**

If **Need pricing update**:
- [x] Metronome rate cards updated
- [x] Auto‑billing tests updated and passing

### QA
- [ ] **QA done**
- [x] **QA not required**

### Comms
- [ ] Informed **Kosinkadink**



## PR #15977: Improve some warning messages.

- URL: https://github.com/Comfy-Org/ComfyUI/pull/15977
- Author: comfyanonymous
- Merged: 2026-08-30T00:10:21Z (created: 2026-08-30T00:09:14Z)
- Stats: +2 -2, 1 files
- Labels: none
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description

(empty)

## PR #9926: Enable fp8 ops by default on gfx1200

- URL: https://github.com/Comfy-Org/ComfyUI/pull/9926
- Author: 0xDELUXA
- Merged: 2025-09-18T23:50:38Z (created: 2025-09-18T15:47:31Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

A PR like https://github.com/comfyanonymous/ComfyUI/pull/8464, enables fp8 ops by default on gfx1200 too.
