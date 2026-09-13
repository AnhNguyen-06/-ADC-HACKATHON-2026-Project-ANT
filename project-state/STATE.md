# Project ANT — Current Project State

**Project**: ANT (Adaptive Navigation Technology)  
**Current Milestone**: M2 (AprilTag Localization)  
**Overall Completion**: 35%  
**Active Sprint**: Sprint 2 — Computer Vision Landmark Localization  
**Status**: IN_PROGRESS  

---

## Subsystem Health & Readiness

| Subsystem | Status | Tests | Review | Blockers |
| :--- | :--- | :--- | :--- | :--- |
| **Governance & Rules** | COMPLETE | 4 Passed | PASS | None |
| **State System & Registry** | COMPLETE | Verified | PASS | None |
| **Office Graph & Models** | COMPLETE | 7 Passed | PASS | None |
| **Routing Engine (Dijkstra)**| COMPLETE | 13 Passed | PASS | None |
| **AprilTag Localization** | IN_PROGRESS | Developing | Pending M2 | None |
| **Audio & Speech (TTS/STT)** | NOT_STARTED | N/A | Pending M3 | Waiting on M2 completion |
| **Obstacle Perception** | NOT_STARTED | N/A | Pending M4 | Waiting on M3 completion |
| **Integration & Web App** | NOT_STARTED | N/A | Pending M5 | Waiting on M4 completion |
| **Deterministic Demo Mode** | NOT_STARTED | N/A | Pending M6 | Waiting on M5 completion |

---

## Active Blockers
- None.

## Last Verified Checkpoint
- `project-state/checkpoints/M1-navigation.md` (COMPLETE).

## Recent Commits / Actions
- Milestone M1 completed: Office graph schema, JSON topology, Dijkstra router, instruction generator, and state machine fully tested (24/24 passing).
- Initialized Milestone M2: Developing CameraProvider abstraction, AprilTag detector, and simulation fixtures.
