# Merged PRs: AUTOMATIC1111/stable-diffusion-webui

## PR #16275: fix image upscale on cpu

- URL: https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/16275
- Author: w-e-w
- Merged: 2024-07-27T12:47:49Z (created: 2024-07-27T12:38:10Z)
- Stats: +1 -1, 1 files
- Labels: none
- Reviews: 4 | Comments: 0
- Linked issues: none

### Description

## Description
@AUTOMATIC1111 @akx 

- after https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/16144
for some reason upscale using cpu will fail with
RuntimeError: Inplace update to inference tensor outside InferenceMode
switch from `no_grad` to `inference_mode` seems to have fixed it

I've mentioned this on discord and ask if anyone is able to reproduce this issue but no one give me a proper answer so I assume that it was something wrong with my system 
> when I was testing backthen I think this error only happens when using `torch+cuda` with `--use-cpu all` arg
> and it some how works in torch (cpu only)
> but when I retested just now both CPU and CUDA version of torch failed
> so I'm not entirely sure what's going on

now that someone has also reported on the same issue so I think it's not just me
- https://github.com/AUTOMATIC1111/stable-diffusion-webui/issues/16274

as this issue could have quite a large impact for those people that are mainly using webui with CPU to upsacall image and not SD
I suggest a version 1.10.1 patch

## Checklist:

- [x] I have read [contributing wiki page](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Contributing)
- [x] I have performed a self-review of my own code
- [x] My code follows the [style guidelines](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Contributing#code-style)
- [x] My code passes [tests](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Tests)


## PR #8425: feat: auto update all extensions using flag

- URL: https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/8425
- Author: vladlearns
- Merged: 2023-03-11T09:20:31Z (created: 2023-03-08T21:05:32Z)
- Stats: +13 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 5
- Linked issues: none

### Description

**Describe what this pull request is trying to achieve.**

This pull request includes a new flag `--update-all-extensions` that can be used as a command-line argument to update all extensions in the extensions folder.

**Additional notes and description of your changes**

Nope.

**Environment this was tested in**

List the environment you have developed / tested this on. As per the contributing page, changes should be able to work on Windows out of the box.
 - OS: [Windows, Mac, Linux]
 - Browser: not applicable
 - Graphics card: not applicable


## PR #13535: fix: checkpoints_loaded:{checkpoint:state_dict}, model.load_state_dict issue in dict value empty

- URL: https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/13535
- Author: chu8129
- Merged: 2023-10-14T05:00:05Z (created: 2023-10-07T07:58:42Z)
- Stats: +5 -4, 1 files
- Labels: none
- Reviews: 1 | Comments: 5
- Linked issues: none

### Description

## Description

* in my mind: checkpoints_loaded: use to cache state_dict
* bug: model.load_state_dict(state_dict, strict=False) change state_dict to {}
* reason: use with sd_disable_initialization.LoadStateDictOnMeta, will clean state_dict
* fix: took the easier way, move cache code in front of model.load_state_dict(state_dict, strict=False),by the way, use deepcopy

---
---
---

## Screenshots/videos:


### the original error
```
autodl-fs/sd-data/extensions/sd-webui-controlnet/scripts/hook.py", line 850, in forward_webui
        return forward(*args, **kwargs)
      File "/root/autodl-fs/sd-data/extensions/sd-webui-controlnet/scripts/hook.py", line 591, in forward
        control = param.control_model(x=x_in, hint=hint, timesteps=timesteps, context=context, y=y)
      File "/root/miniconda3/lib/python3.10/site-packages/torch/nn/modules/module.py", line 1501, in _call_impl
        return forward_call(*args, **kwargs)
      File "/root/autodl-fs/sd-data/extensions/sd-webui-controlnet/scripts/cldm.py", line 31, in forward
        return self.control_model(*args, **kwargs)
      File "/root/miniconda3/lib/python3.10/site-packages/torch/nn/modules/module.py", line 1501, in _call_impl
        return forward_call(*args, **kwargs)
      File "/root/autodl-fs/sd-data/extensions/sd-webui-controlnet/scripts/cldm.py", line 304, in forward
        assert y.shape[0] == x.shape[0]
    AttributeError: 'NoneType' object has no attribute 'shape'
```
**Explain**
```
 set checkpoint cache size:6
 use sdxl and sdxl controlnet, normal
 change, use sd1.5 normal
 change, use sdxl and sdxl controlnet, checkpoints cache in ram, raise error
   -  code:load from cache, get state_dict is {}
   -  code:adjust model type, sdxl key not in state_dict, set model.is_sdxl = False, real model is previous model sd1.5
   -  code:but, controlnet use sdxl canny, y value must be not none, then, raise error
```
---
---
---

**print str(state_dict)[:100] for monitor**

### use master branch code:ERROR
```

    with sd_disable_initialization.LoadStateDictOnMeta(state_dict, device=model_target_device(sd_model), weight_dtype_conversion=weight_dtype_conversion):
        load_model_weights(sd_model, checkpoint_info, state_dict, timer)
```
**pay attention to:after map(in sd_disable_initialization.py), the state_dict has been change**
```
clip_is_included_into_sd:True, shared.cmd_opts.do_not_download_clip:False
self.filename:/root/autodl-fs/sd-data/models/Stable-diffusion/7EhrMEzi5YX.safetensors, checkpoint/7EhrMEzi5YX.safetensors
load_model_weights <modules.sd_models.CheckpointInfo object at 0x7f5e086257e0> model.is_sdxl False
before load model load_state_dict {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor([[ 0.0016,
model.load_state_dict /root/autodl-fs/qwcache/stable-diffusion-webui/modules/sd_disable_initialization.py
before map {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor(..., device=
load_state_dict torch before load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch after load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch del load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch after strict OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch _IncompatibleKeys OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
after map {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor(..., device=
after load model load_state_dict state_dict {}
after load model load_state_dict state_dict {}
```

### without  sd_disable_initialization.LoadStateDictOnMeta:NORMAL

```
    load_model_weights(sd_model, checkpoint_info, state_dict, timer)
```
```
clip_is_included_into_sd:True, shared.cmd_opts.do_not_download_clip:False
self.filename:/root/autodl-fs/sd-data/models/Stable-diffusion/epicrealism_pureEvolutionV5.safetensors, checkpoint/epicrealism_pureEvolutionV5.safetensors
load_model_weights <modules.sd_models.CheckpointInfo object at 0x7f9f34629ae0> model.is_sdxl False
before load model load_state_dict {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor([[ 0.0016,
model.load_state_dict /root/miniconda3/lib/python3.10/site-packages/torch/nn/modules/module.py
load_state_dict torch before load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch after load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch del load OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch after strict OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
load_state_dict torch _IncompatibleKeys OrderedDict([('cond_stage_model.transformer.text_model.embeddings.position_embedding.weight', tensor
after load model load_state_dict state_dict {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor([[ 0.0016,
after load model load_state_dict state_dict {'cond_stage_model.transformer.text_model.embeddings.position_embedding.weight': tensor([[ 0.0016,
shared.opts.sd_checkpoint_cache 6
```

### MR && with sd_disable_initialization.LoadStateDictOnMeta:NORMAL
**(load_state_dict still change state_dict to {}, but did not effect the follow code)**
**load from cache correctly**
```
Applying attention optimization: xformers... done.
Model loaded in 14.0s (create model: 0.5s, apply weights to model: 13.2s).
Reusing loaded model 7EhrMEzi5YX.safetensors [732d0dd2cf] to load sd_xl_base_1.0.safetensors [31e35c80fc]
Loading weights [31e35c80fc] from cache
Creating model from config: /root/autodl-fs/sd-data/models/Stable-diffusion/sd_xl_base_1.0.yaml
...
instantiate_from_config done
load_state_dict torch before load OrderedDict([('conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
load_state_dict torch after load OrderedDict([('conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
load_state_dict torch del load OrderedDict([('conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
load_state_dict torch after strict OrderedDict([('conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
load_state_dict torch _IncompatibleKeys OrderedDict([('conditioner.embedders.0.transformer.text_model.embeddings.position_embedding.weight',
after load model load_state_dict state_dict  {}
Loading VAE weights found near the checkpoint: cached sd_xl_base_1.0.vae.safetensors
```

## Checklist:

- [x] I have read [contributing wiki page](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Contributing)
- [x] I have performed a self-review of my own code
- [x] My code follows the [style guidelines](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Contributing#code-style)
- [x] My code passes [tests](https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Tests)



## anyone can explain this? module_load_state_dict did not declare, how did it run?
```
in modules/sd_disable_initialization.py
        module_load_state_dict = self.replace(torch.nn.Module, 'load_state_dict', lambda *args, **kwargs: load_state_dict(module_load_state_dict, *args, **kwargs))
```


## PR #2092: Implement SwinIR v2

- URL: https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/2092
- Author: C43H66N12O12S2
- Merged: 2022-10-10T16:54:57Z (created: 2022-10-09T16:01:54Z)
- Stats: +1045 -7, 2 files
- Labels: none
- Reviews: 1 | Comments: 5
- Linked issues: none

### Description

This PR implements SwinIR v2 from https://github.com/mv-lab/swin2sr. SwinIR v2 is SwinIR but with Swin Transformer V2 from Microsoft.

To use this, download `Swin2SR_RealworldSR_X4_64_BSRGAN_PSNR.pth` from the aforementioned repo, and rename it to have the `.v2.pth` extension.

The actual line addition of this PR is 28 lines, the rest is the model architecture.

Examples:
Original Image
![00026-941083205](https://user-images.githubusercontent.com/36072735/194767002-bbafeb5b-d66d-4d18-b0c8-6a94a8137f6a.png)

SwinIR
![00001](https://user-images.githubusercontent.com/36072735/194767012-cfd24754-59b6-4a56-a439-55add7f94c4a.png)

SwinIR v2
![00002](https://user-images.githubusercontent.com/36072735/194767016-a0f31af1-5f28-4ce6-8524-e18ff4cfaf37.png)

In this example, SwinIR v2 avoids the blocking artifacts of v1, and also respects the (artistic?) blur/bokeh of the original image.

## PR #7925: Revert "Aspect ratio sliders"

- URL: https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/7925
- Author: AUTOMATIC1111
- Merged: 2023-02-19T07:57:34Z (created: 2023-02-19T07:57:26Z)
- Stats: +2 -517, 5 files
- Labels: none
- Reviews: 0 | Comments: 2
- Linked issues: none

### Description

Reverts AUTOMATIC1111/stable-diffusion-webui#7601
