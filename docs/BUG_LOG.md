# Bug Log — Project ANT

All defects discovered during implementation, component testing, integration, and red-team testing are recorded here.

Format:
- **ID**: `BUG-XXX`
- **Date**: YYYY-MM-DD
- **Severity**: P0 (Critical) / P1 (Major) / P2 (Moderate) / P3 (Minor)
- **Subsystem**: [Vision / Routing / Audio / Frontend / State]
- **Symptom**: Description of failure
- **Root Cause**: Analysis of why the bug occurred
- **Fix**: Code changes implemented
- **Regression Test**: Test verifying the fix
- **Status**: OPEN / RESOLVED / VERIFIED

---

## BUG-001: OpenCV 5.0.0 Aruco Marker IDs Array Dimension Mismatch
- **Date**: 2026-09-13
- **Severity**: P1 (Major)
- **Subsystem**: Vision (`backend/app/vision/detector.py`)
- **Symptom**: `IndexError: invalid index to scalar variable` when parsing `ids[i][0]` from `ArucoDetector.detectMarkers`.
- **Root Cause**: In OpenCV 5.0.0, `ids` is returned as a 1D NumPy ndarray of shape `(N,)` rather than the OpenCV 4 legacy 2D shape `(N, 1)`. Accessing `ids[i][0]` failed because `ids[i]` is a scalar integer.
- **Fix**: Flattened `ids` using `np.ravel(ids)` and accessed `int(flat_ids[i])`. Also ensured `corners[i]` is reshaped to `(-1, 2)`.
- **Regression Test**: `tests/test_apriltag.py::test_detect_generated_apriltag`, `tests/test_apriltag.py::test_detect_multiple_tags`.
- **Status**: VERIFIED

---

## BUG-002: Navigation State Machine Checkpoint Stalling on Skipped Intermediary Tag
- **Date**: 2026-09-13
- **Severity**: P2 (Moderate)
- **Subsystem**: State Machine (`backend/app/navigation/state_machine.py`)
- **Symptom**: When a user physically moved between checkpoints and the camera sighted a forward checkpoint without catching an intermediate node, the state machine did not advance the route step.
- **Root Cause**: `on_tag_observed` checked strictly whether `node.id == self.active_route.steps[self.current_step_index].to_node.id`.
- **Fix**: Upgraded route step matcher to search ahead in the active route for any forward step matching `node.id`, properly advancing `current_step_index` and announcing the checkpoint.
- **Regression Test**: `tests/test_apriltag.py::test_end_to_end_vision_to_state_transition`.
- **Status**: VERIFIED
