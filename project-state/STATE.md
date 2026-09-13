# Project ANT — Current Project State

**Project**: ANT (Adaptive Navigation Technology)  
**Current Milestone**: M1 (Navigation Core Engine)  
**Overall Completion**: 18%  
**Active Sprint**: Sprint 1 — Navigation Core & Route State Machine  
**Status**: IN_PROGRESS  

---

## Subsystem Health & Readiness

| Subsystem | Status | Tests | Review | Blockers |
| :--- | :--- | :--- | :--- | :--- |
| **Governance & Rules** | COMPLETE | 4 Passed | PASS | None |
| **State System & Registry** | COMPLETE | Verified | PASS | None |
| **Office Graph & Models** | IN_PROGRESS | Writing tests | Pending M1 | None |
| **Routing Engine (Dijkstra)**| IN_PROGRESS | Writing tests | Pending M1 | None |
| **AprilTag Localization** | NOT_STARTED | N/A | Pending M2 | Waiting on M1 completion |
| **Audio & Speech (TTS/STT)** | NOT_STARTED | N/A | Pending M3 | Waiting on M2 completion |
| **Obstacle Perception** | NOT_STARTED | N/A | Pending M4 | Waiting on M3 completion |
| **Integration & Web App** | NOT_STARTED | N/A | Pending M5 | Waiting on M4 completion |
| **Deterministic Demo Mode** | NOT_STARTED | N/A | Pending M6 | Waiting on M5 completion |

---

## Active Blockers
- None.

## Last Verified Checkpoint
- `project-state/checkpoints/M0-foundation.md` (COMPLETE).

## Recent Commits / Actions
- Milestone M0 completed: Governance, static rules, documentation suite, test runner verified.
- Initialized Milestone M1: Office graph schema and Dijkstra router implementation underway.
