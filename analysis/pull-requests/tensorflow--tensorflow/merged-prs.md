# Merged PRs: tensorflow/tensorflow

## PR #126370: [XLA:CPU] Tighten the bounds for the offsets when checking if the mask is needed.

- URL: https://github.com/tensorflow/tensorflow/pull/126370
- Author: copybara-service
- Merged: 2026-08-29T09:30:56Z (created: 2026-08-28T19:05:24Z)
- Stats: +43 -32, 6 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

[XLA:CPU] Tighten the bounds for the offsets when checking if the mask is needed.

Before we had [min(), max()] as the limit, but we can be more precise and that leads to more folding/simplification.


## PR #109227: [AutoGraph] Add warning when Python random module is used inside tf.function

- URL: https://github.com/tensorflow/tensorflow/pull/109227
- Author: saksham-1304
- Merged: 2026-08-29T21:46:50Z (created: 2026-01-30T15:28:07Z)
- Stats: +110 -0, 2 files
- Labels: ready to pull, size:M, prtype:bugfix, python
- Reviews: 3 | Comments: 7
- Linked issues: none

### Description

Fix #109111  
# Fix: Warn When Python `random` Module Is Used Inside `tf.function`

## Problem
Using Python’s `random` module (e.g., `random.randint()`) inside a `@tf.function` causes inconsistent behavior between eager execution and XLA compilation:

* In eager mode the random value is generated on each call.
* In a `tf.function` the value is computed only once during tracing and becomes a constant in the graph.
* When the function later runs with different input shapes, the constant shape may no longer match, leading to dimension‑mismatch errors—especially under XLA compilation.

## Solution
Added detection and a helpful warning in AutoGraph’s `call_trees.py` converter:

1. **Detection** – A frozenset `_PYTHON_RANDOM_FUNCTIONS` contains all Python `random` functions that can produce traced constants (`random.randint`, `random.randrange`, `random.random`, …).
2. **Warning** – The first time any of these functions is encountered inside a `tf.function`, a warning is emitted that:
   * Explains why the pattern is problematic.
   * Recommends using TensorFlow’s `tf.random` equivalents.
   * Provides an example conversion (e.g., `random.randint(a, b)` → `tf.random.uniform([], a, b, dtype=tf.int32)`).
   * Links to the TensorFlow function guide for more details.

3. **Test Coverage** – Added unit tests for `random.randint`, `random.randrange`, and `random.choice` to verify that the warning is triggered while the transformation still works correctly.

## Files Changed
- `tensorflow/python/autograph/converters/call_trees.py` – Added detection logic and warning.
- `tensorflow/python/autograph/converters/call_trees_test.py` – Added test cases.

## Example Warning Message
```
WARNING: Detected use of Python's `random.randint()` inside a tf.function. 
The random value is computed during tracing and becomes a constant in the graph, 
which may cause shape mismatches or unexpected behavior, especially with XLA compilation. 
Use `tf.random` functions instead for dynamic random values. 
For example, replace `random.randint(a, b)` with `tf.random.uniform([], a, b, dtype=tf.int32)`. 
See https://www.tensorflow.org/guide/function#executing_python_side_effects
```

## How to Test
Run the existing test suite for `call_trees_test.py`; the new tests should pass, confirming that the warning is correctly emitted without breaking existing functionality.

---

*This PR fixes issue #109111 and helps users avoid shape‑mismatch bugs when mixing Python random calls with TensorFlow graph execution.*

## PR #126144: Automated Code Change

- URL: https://github.com/tensorflow/tensorflow/pull/126144
- Author: copybara-service
- Merged: 2026-08-30T00:38:18Z (created: 2026-08-26T03:38:23Z)
- Stats: +2 -0, 2 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Automated Code Change


## PR #126302: Propagate input constraints across nested fusion instruction boundaries.

- URL: https://github.com/tensorflow/tensorflow/pull/126302
- Author: copybara-service
- Merged: 2026-08-30T04:34:38Z (created: 2026-08-28T02:44:40Z)
- Stats: +121 -1, 3 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Propagate input constraints across nested fusion instruction boundaries.

Previously, ConstraintPropagator only analyzed computations in isolation and
stopped at kFusion instructions. In multi-level fusions (such as kOutput fusions
containing inner kLoop fusions), constraints from internal operations failed
to propagate backward to the module's entry parameters. Consequently, parameters
remained at their default unconstrained ranges causing floating-point overflow
to +inf and downstream NaN generation.

This change:
- Implements PropagateFusionBoundary in PropagateConstraintsExact to
  bidirectionally synchronize caller operands with callee fused parameters, and
  caller results with the fused expression root.
- Updates ConstraintPropagator::Run to perform an inter-procedural fixed-point
  iteration across all computations in topological post-order until global
  convergence.
- Adds unit tests verifying constraint propagation across both single-level and
  multi-level nested fusions.


## PR #126431: Automated Code Change

- URL: https://github.com/tensorflow/tensorflow/pull/126431
- Author: copybara-service
- Merged: 2026-08-30T04:45:31Z (created: 2026-08-30T03:09:28Z)
- Stats: +0 -1, 1 files
- Labels: none
- Reviews: 0 | Comments: 0
- Linked issues: none

### Description

Automated Code Change


