# Merged PRs: godotengine/godot

## PR #121940: Fix crash when setting the root Viewport's World3D to null

- URL: https://github.com/godotengine/godot/pull/121940
- Author: aaronfranke
- Merged: 2026-07-31T17:53:17Z (created: 2026-07-30T15:11:11Z)
- Stats: +18 -3, 1 files
- Labels: bug, topic:core, topic:rendering, crash
- Reviews: 2 | Comments: 8
- Linked issues: none

### Description

## What problem(s) does this PR solve?

Most of the code in `Viewport::set_world_3d` already handles the world being null by explicitly checking `.is_valid()`:

```cpp
if (own_world_3d.is_valid() && world_3d.is_valid()) {
	world_3d->disconnect_changed(callable_mp(this, &Viewport::_own_world_3d_changed));
}

world_3d = p_world_3d;

if (own_world_3d.is_valid()) {
	if (world_3d.is_valid()) {
		own_world_3d = world_3d->duplicate();
		world_3d->connect_changed(callable_mp(this, &Viewport::_own_world_3d_changed));
	} else {
		own_world_3d.instantiate();
	}
}
```

However, this code did not:

```cpp
if (is_inside_tree()) {
	RenderingServer::get_singleton()->viewport_set_scenario(viewport, find_world_3d()->get_scenario());
}
```

This uses `find_world_3d()`, which would work if itself or an ancestor viewport had a World3D, but will return null if none exists, such as when setting a null World3D on the root viewport. This PR fixes the crash by checking if the found world exists, and setting a null RID for the scenario if it does not exist.

```cpp
if (is_inside_tree()) {
	const Ref<World3D> found_world = find_world_3d();
	if (found_world.is_valid()) {
		RenderingServer::get_singleton()->viewport_set_scenario(viewport, found_world->get_scenario());
	} else {
		RenderingServer::get_singleton()->viewport_set_scenario(viewport, RID());
	}
}
```

## Additional information

I did not use AI to make this pull request.

This is probably another good one to cherry-pick to supported branches.

## PR #122931: Add shader uniform hints `no_storage` and `no_editor`

- URL: https://github.com/godotengine/godot/pull/122931
- Author: ttencate
- Merged: 2026-08-28T22:21:08Z (created: 2026-08-28T11:47:40Z)
- Stats: +54 -0, 2 files
- Labels: enhancement, topic:rendering, topic:shaders
- Reviews: 1 | Comments: 2
- Linked issues: none

### Description

## What problem(s) does this PR solve?

- Closes https://github.com/godotengine/godot-proposals/issues/15338. That proposal explains the rationale for this PR.

## Additional information

Demo project: [shader_usage_flags_demo.zip](https://github.com/user-attachments/files/31552787/shader_usage_flags_demo.zip)

Given these uniforms:

```
uniform float time_default;
uniform float time_no_editor: no_editor;
uniform float time_no_storage: no_storage;
uniform float time_no_storage_no_editor: no_storage, no_editor;
```

The ones with `no_storage` are omitted from the .tres file:

```
$ cat BlinkMaterial.tres 
[gd_resource type="ShaderMaterial" format=3 uid="uid://ck2ph3hs1ssks"]

[ext_resource type="Shader" uid="uid://clwvqil7dntbw" path="res://BlinkMaterial.gdshader" id="1_c8a3m"]

[resource]
shader = ExtResource("1_c8a3m")
shader_parameter/time_default = 60.05209100000178
shader_parameter/time_no_editor = 60.05209100000178
```

The ones with `no_editor` are not visible in the inspector:

<img width="439" height="372" alt="2026-08-28T13:40:09_439x372" src="https://github.com/user-attachments/assets/b5692c36-f792-4a37-b8d3-14fa7ede27ac" />

Completion:

<img width="466" height="133" alt="2026-08-28T13:41:14_466x133" src="https://github.com/user-attachments/assets/deb3f936-b780-4cc3-a66e-571763483562" />

Error reporting:

<img width="516" height="83" alt="2026-08-28T13:41:36_516x83" src="https://github.com/user-attachments/assets/cc8099e9-f59d-41cd-ba1f-ca5b0c2d9134" />

## PR #122945: Fix duplicate Toggle Comment context option

- URL: https://github.com/godotengine/godot/pull/122945
- Author: kitbdev
- Merged: 2026-08-28T22:21:08Z (created: 2026-08-28T18:36:01Z)
- Stats: +0 -2, 1 files
- Labels: bug, topic:editor, regression
- Reviews: 1 | Comments: 1
- Linked issues: none

### Description


## What problem(s) does this PR solve?

- Closes https://github.com/godotengine/godot/issues/122941

## Additional information

- It was moved to `CodeEditorBase::_make_context_menu` in https://github.com/godotengine/godot/pull/115998
but I accidentally added it back here when rebasing https://github.com/godotengine/godot/pull/109104


## PR #122963: [3.x] Fix some UB / uninitialized vars

- URL: https://github.com/godotengine/godot/pull/122963
- Author: lawnjelly
- Merged: 2026-08-29T12:28:44Z (created: 2026-08-29T11:29:37Z)
- Stats: +7 -6, 6 files
- Labels: bug, topic:core
- Reviews: 1 | Comments: 1
- Linked issues: #122431

### Description

Fixes an uninitialized read in the batching, and some false positive UB reports for ubsan.

Fixes #122431.

## Notes
* Using -1 is fairly common for unused, but you can't e.g. use `UINT32_MAX` in a template where U can be custom, so casting to (U) is likely the best fix
* The fix to the hash func will produce the same binary behaviour
* I did initially start going through the batching to ensure all values were zeroed, but it should really be a separate PR, as batching is very performance sensitive, and many vars aren't zeroed _on purpose_, so this needs profile guiding.



## PR #117999: DDS: Fix loading 3D textures with mipmaps

- URL: https://github.com/godotengine/godot/pull/117999
- Author: BlueCube3310
- Merged: 2026-08-26T19:39:27Z (created: 2026-03-30T12:00:58Z)
- Stats: +39 -17, 1 files
- Labels: bug, topic:import
- Reviews: 2 | Comments: 2
- Linked issues: none

### Description

3D textures with mipmaps used to be read in the same way as array textures, which caused them to be loaded incorrectly.

Sample textures for testing:
[3dtexture_test.zip](https://github.com/user-attachments/files/26349271/3dtexture_test.zip)

