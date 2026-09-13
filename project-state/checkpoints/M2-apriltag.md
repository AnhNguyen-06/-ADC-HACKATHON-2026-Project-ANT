# Milestone Checkpoint: M2 — AprilTag Localization

**Milestone**: M2  
**Status**: COMPLETE  
**Date**: 2026-09-13  
**Verified By**: Cross-Role Review Board (CV, Accessibility, QA, Red Team)  

---

## Implemented
- Camera abstraction layer (`CameraProvider`, `LiveCameraProvider`, `SyntheticCameraProvider`): `backend/app/vision/camera.py`.
- AprilTag marker image generator: `backend/app/vision/tag_generator.py`.
- Native AprilTag 36h11 detector with subpixel refinement: `backend/app/vision/detector.py`.
- Debounced Tag-to-Node topological mapper: `backend/app/vision/mapper.py`.
- Vision-to-state automatic transition pipeline: `backend/app/navigation/state_machine.py`.

## Tests
- 30 passed (`tests/test_apriltag.py`, `tests/test_dijkstra.py`, `tests/test_graph.py`, `tests/test_instruction.py`, `tests/test_state_machine.py`, `tests/test_foundation.py`).

## Review
- Independent review: **PASS** (`docs/reviews/M2_REVIEW.md`).
- Bugs logged and verified: BUG-001 (P1), BUG-002 (P2).

## Limitations
- AprilTag detection requires adequate ambient lighting (> 50 lux) and marker visibility within 45 degrees of camera optical axis.

## Next
- **Milestone M3**: Audio & Voice (SpeechInputProvider, natural language destination parser, TextToSpeechProvider, concise audio state announcements).
