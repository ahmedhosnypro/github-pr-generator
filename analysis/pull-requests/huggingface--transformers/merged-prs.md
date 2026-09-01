# Merged PRs: huggingface/transformers

## PR #48391: Avoid print to stdout that fails the job `check_failed_tests` job

- URL: https://github.com/huggingface/transformers/pull/48391
- Author: ydshieh
- Merged: 2026-08-28T15:52:52Z (created: 2026-08-28T10:13:10Z)
- Stats: +61 -24, 1 files
- Labels: none
- Reviews: 0 | Comments: 3
- Linked issues: none

### Description

My bad : introduced the bugs in #48338 and #48374.

Fix similar to #47635

## PR #48401: [Docs]: Update GLM 5.3

- URL: https://github.com/huggingface/transformers/pull/48401
- Author: Dovis01
- Merged: 2026-08-29T06:00:53Z (created: 2026-08-28T15:50:40Z)
- Stats: +14 -4, 2 files
- Labels: none
- Reviews: 2 | Comments: 3
- Linked issues: none

### Description

<!-- ci-dashboard-badge:start -->
[![CPU CI](https://transformers-ci.lor-e.huggingface.cool/badge/pr?pr=48401&event=pr-ci)](https://transformers-ci.lor-e.huggingface.cool/d/pytest-observability-by-pr/pytest-observability-branch?var-pr=48401) [![GPU run-slow](https://transformers-ci.lor-e.huggingface.cool/badge/pr?pr=48401&event=run-slow)](https://transformers-ci.lor-e.huggingface.cool/d/pytest-observability-by-pr/pytest-observability-branch?var-pr=48401)
<!-- ci-dashboard-badge:end -->

Update GLM 5.3 Model Docs

## PR #14348: enhance rewrite state_dict missing _metadata

- URL: https://github.com/huggingface/transformers/pull/14348
- Author: changwangss
- Merged: 2021-11-10T12:25:42Z (created: 2021-11-10T07:08:38Z)
- Stats: +2 -1, 1 files
- Labels: none
- Reviews: 1 | Comments: 0
- Linked issues: none

### Description

# What does this PR do?
enhance PR https://github.com/huggingface/transformers/pull/14276 which fix issue #14268

in order to avoid the ignore_key does not exist in the state_dict and cause failed.
<!--
Congratulations! You've made it this far! You're not quite done yet though.

Once merged, your PR is going to appear in the release notes with the title you set, so make sure it's a great title that fully reflects the extent of your awesome contribution.

Then, please replace this with a description of the change and which issue is fixed (if applicable). Please also include relevant motivation and context. List any dependencies (if any) that are required for this change.

Once you're done, someone will review your PR shortly (see the section "Who can review?" below to tag some potential reviewers). They may suggest changes to make the code even better. If no one reviewed your PR after a week has passed, don't hesitate to post a new comment @-mentioning the same persons---sometimes notifications get lost.
-->

<!-- Remove if not applicable -->




## Before submitting
- [ ] This PR fixes a typo or improves the docs (you can dismiss the other checks if that's the case).
- [x] Did you read the [contributor guideline](https://github.com/huggingface/transformers/blob/master/CONTRIBUTING.md#start-contributing-pull-requests),
      Pull Request section?
- [x] Was this discussed/approved via a Github issue or the [forum](https://discuss.huggingface.co/)? Please add a link
      to it if that's the case.
- [ ] Did you make sure to update the documentation with your changes? Here are the
      [documentation guidelines](https://github.com/huggingface/transformers/tree/master/docs), and
      [here are tips on formatting docstrings](https://github.com/huggingface/transformers/tree/master/docs#writing-source-documentation).
- [ ] Did you write any new necessary tests?


## Who can review?

Anyone in the community is free to review the PR once the tests have passed. Feel free to tag
members/contributors who may be interested in your PR.

<!-- Your PR will be replied to more quickly if you can figure out the right person to tag with @

 If you know how to use git blame, that is the easiest way, otherwise, here is a rough guide of **who to tag**.
 Please tag fewer than 3 people.

Models:

- albert, bert, xlm: @LysandreJik
- blenderbot, bart, marian, pegasus, encoderdecoder,  t5: @patrickvonplaten, @patil-suraj
- longformer, reformer, transfoxl, xlnet: @patrickvonplaten
- fsmt: @stas00
- funnel: @sgugger
- gpt2: @patrickvonplaten, @LysandreJik
- rag: @patrickvonplaten, @lhoestq
- tensorflow: @LysandreJik

Library:

- benchmarks: @patrickvonplaten
- deepspeed: @stas00
- ray/raytune: @richardliaw, @amogkam
- text generation: @patrickvonplaten
- tokenizers: @n1t0, @LysandreJik
- trainer: @sgugger
- pipelines: @LysandreJik

Documentation: @sgugger

HF projects:

- datasets: [different repo](https://github.com/huggingface/datasets)
- rust tokenizers: [different repo](https://github.com/huggingface/tokenizers)

Examples:

- maintained examples (not research project or legacy): @sgugger, @patil-suraj
- research_projects/bert-loses-patience: @JetRunner
- research_projects/distillation: @VictorSanh

 -->
@sgugger

## PR #14276: improve rewrite state_dict missing _metadata

- URL: https://github.com/huggingface/transformers/pull/14276
- Author: changwangss
- Merged: 2021-11-04T14:13:23Z (created: 2021-11-04T13:48:51Z)
- Stats: +2 -1, 1 files
- Labels: none
- Reviews: 2 | Comments: 0
- Linked issues: #14268

### Description

# What does this PR do?

<!--
Congratulations! You've made it this far! You're not quite done yet though.

Once merged, your PR is going to appear in the release notes with the title you set, so make sure it's a great title that fully reflects the extent of your awesome contribution.

Then, please replace this with a description of the change and which issue is fixed (if applicable). Please also include relevant motivation and context. List any dependencies (if any) that are required for this change.

Once you're done, someone will review your PR shortly (see the section "Who can review?" below to tag some potential reviewers). They may suggest changes to make the code even better. If no one reviewed your PR after a week has passed, don't hesitate to post a new comment @-mentioning the same persons---sometimes notifications get lost.
-->

<!-- Remove if not applicable -->

Fixes #14268


## Before submitting
- [ ] This PR fixes a typo or improves the docs (you can dismiss the other checks if that's the case).
- [x] Did you read the [contributor guideline](https://github.com/huggingface/transformers/blob/master/CONTRIBUTING.md#start-contributing-pull-requests),
      Pull Request section?
- [x] Was this discussed/approved via a Github issue or the [forum](https://discuss.huggingface.co/)? Please add a link
      to it if that's the case.
- [ ] Did you make sure to update the documentation with your changes? Here are the
      [documentation guidelines](https://github.com/huggingface/transformers/tree/master/docs), and
      [here are tips on formatting docstrings](https://github.com/huggingface/transformers/tree/master/docs#writing-source-documentation).
- [ ] Did you write any new necessary tests?


## Who can review?

Anyone in the community is free to review the PR once the tests have passed. Feel free to tag
members/contributors who may be interested in your PR.

<!-- Your PR will be replied to more quickly if you can figure out the right person to tag with @

 If you know how to use git blame, that is the easiest way, otherwise, here is a rough guide of **who to tag**.
 Please tag fewer than 3 people.

Models:

- albert, bert, xlm: @LysandreJik
- blenderbot, bart, marian, pegasus, encoderdecoder,  t5: @patrickvonplaten, @patil-suraj
- longformer, reformer, transfoxl, xlnet: @patrickvonplaten
- fsmt: @stas00
- funnel: @sgugger
- gpt2: @patrickvonplaten, @LysandreJik
- rag: @patrickvonplaten, @lhoestq
- tensorflow: @LysandreJik

Library:

- benchmarks: @patrickvonplaten
- deepspeed: @stas00
- ray/raytune: @richardliaw, @amogkam
- text generation: @patrickvonplaten
- tokenizers: @n1t0, @LysandreJik
- trainer: @sgugger
- pipelines: @LysandreJik

Documentation: @sgugger

HF projects:

- datasets: [different repo](https://github.com/huggingface/datasets)
- rust tokenizers: [different repo](https://github.com/huggingface/tokenizers)

Examples:

- maintained examples (not research project or legacy): @sgugger, @patil-suraj
- research_projects/bert-loses-patience: @JetRunner
- research_projects/distillation: @VictorSanh

 -->
@sgugger

## PR #48388: fix: flash-attn fallback failing on torch2.13

- URL: https://github.com/huggingface/transformers/pull/48388
- Author: NanoCode012
- Merged: 2026-08-28T05:29:19Z (created: 2026-08-28T05:02:55Z)
- Stats: +9 -4, 2 files
- Labels: for patch
- Reviews: 1 | Comments: 2
- Linked issues: none

### Description

<!-- ci-dashboard-badge:start -->
[![CPU CI](https://transformers-ci.lor-e.huggingface.cool/badge/pr?pr=48388&event=pr-ci)](https://transformers-ci.lor-e.huggingface.cool/d/pytest-observability-by-pr/pytest-observability-branch?var-pr=48388) [![GPU run-slow](https://transformers-ci.lor-e.huggingface.cool/badge/pr?pr=48388&event=run-slow)](https://transformers-ci.lor-e.huggingface.cool/d/pytest-observability-by-pr/pytest-observability-branch?var-pr=48388)
<!-- ci-dashboard-badge:end -->

# What does this PR do?

<!--
Congratulations! You've made it this far! You're not quite done yet though.

Once merged, your PR is going to appear in the release notes with the title you set, so make sure it's a great title that fully reflects the extent of your awesome contribution.

Then, please replace this with a description of the change and which issue is fixed (if applicable). Please also include relevant motivation and context. List any dependencies (if any) that are required for this change.

Once you're done, someone will review your PR shortly (see the section "Who can review?" below to tag some potential reviewers). They may suggest changes to make the code even better. If no one reviewed your PR after a week has passed, don't hesitate to post a new comment @-mentioning the same persons---sometimes notifications get lost.
-->

<!-- Remove if not applicable -->

Discussed on internal Slack with Axolotl-HF. 

**Credit:** A similar fix also exists in but this PR keeps it single focused (credit `sywangyi`): https://github.com/huggingface/transformers/pull/48252

---

When FA2 isn't available in the environment, the kernel fallback would run and pull from hub. However, our CI found this failing on torch2.13. This is due to the check using revision `v1` which does not include build for this torch (only `v2+`).

https://github.com/huggingface/transformers/blob/83d024e1bfed0d425d20bcde2b46a56b2333906e/src/transformers/utils/import_utils.py#L1192-L1199

Other areas had the proper fix to call `get_attn_kernel_version` but `import_utils` missed it. This PR re-uses that same utility.




## Before submitting
- [ ] This PR fixes a typo or improves the docs (you can dismiss the other checks if that's the case).
- [x] Did you read the [contributor guideline](https://huggingface.co/docs/transformers/contributing) and the
      [Pull Request](https://huggingface.co/docs/transformers/pr_checks) checks?
- [x] Was this discussed/approved via a Github issue or the [forum](https://discuss.huggingface.co/)? Please add a link
      to it if that's the case.
- [ ] Did you make sure to update the documentation with your changes according to the [guidelines](https://github.com/huggingface/transformers/tree/main/docs)?
- [ ] Did you write any new necessary [tests](https://huggingface.co/docs/transformers/testing)?


## Who can review?

Anyone in the community is free to review the PR once the tests have passed. Feel free to tag
members/contributors who may be interested in your PR.

@IlyasMoutawwakil 

<!-- Your PR will be replied to more quickly if you can figure out the right person to tag with @

 If you know how to use git blame, that is the easiest way, otherwise, here is a rough guide of **who to tag**.
 Please tag fewer than 3 people.

Models:

- text models: @ArthurZucker @Cyrilvallez @vasqu
- vision models: @molbap @guarin
- audio models: @eustlb @ebezzam @vasqu
- multimodal models: @zucchini-nlp
- graph models: @clefourrier

Library:

- generate: @zucchini-nlp (visual-language models) or @Cyrilvallez (all others)
- continuous batching: @remi-or @ArthurZucker @McPatate
- pipelines: @Rocketknight1
- tokenizers: @ArthurZucker and @itazap
- trainer: @SunMarc
- attention: @vasqu @ArthurZucker @CyrilVallez
- model loading (from pretrained, etc): @CyrilVallez
- distributed: @3outeille @ArthurZucker
- CIs: @ydshieh

Integrations:

- ray/raytune: @richardliaw, @amogkam
- Big Model Inference: @SunMarc
- quantization: @SunMarc
- kernels: @vasqu @drbh
- peft: @BenjaminBossan @githubnemo

Devices/Backends:

- AMD ROCm: @Abdennacer-Badaoui
- Intel XPU: @IlyasMoutawwakil
- Ascend NPU: @IlyasMoutawwakil 

Documentation: @stevhliu

Research projects are not maintained and should be taken as is.

 -->
