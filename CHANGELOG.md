# Changelog — Project ANT

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [0.4.0] - 2026-09-13
### Added
- Milestone M3: Audio & Voice Feedback.
- NaturalLanguageDestinationParser supporting flexible conversational phrasing, preamble stripping, and landmark associations (`backend/app/audio/service.py`).
- MockTTSProvider and WebTTS bridge models for in-memory and browser speech output.
- Voice-driven complete navigation simulation lifecycle.
- 34 unit, component, and regression tests passing.
- Milestone checkpoint snapshot (`project-state/checkpoints/M3-audio.md`).

---

## [0.3.0] - 2026-09-13
### Added
- Milestone M2: AprilTag Localization.
- Camera abstraction layer with `CameraProvider`, `LiveCameraProvider`, and `SyntheticCameraProvider` (`backend/app/vision/camera.py`).
- Synthetic AprilTag 36h11 image generation utility (`backend/app/vision/tag_generator.py`).
- Native OpenCV 5.0 AprilTag 36h11 detector with subpixel refinement (`backend/app/vision/detector.py`).
- Debounced `TagMapper` resolving AprilTag IDs to office graph nodes (`backend/app/vision/mapper.py`).
- Automated end-to-end vision-to-state transition pipeline.
- 30 unit, component, and regression tests passing.
- Logged and resolved BUG-001 and BUG-002 in `docs/BUG_LOG.md`.
- Milestone checkpoint snapshot (`project-state/checkpoints/M2-apriltag.md`).

---

## [0.2.0] - 2026-09-13
### Added
- Milestone M1: Navigation Core Engine.
- Data models for Node, Edge, OfficeMap, RouteStep, and Route (`backend/app/navigation/models.py`).
- Office Graph schema, integrity validation, dynamic edge blocking (`backend/app/navigation/graph.py`).
- Office Floor 1 topology dataset with landmarks (`backend/data/office_map.json`).
- Dijkstra shortest path routing with accessibility weighting and rerouting support (`backend/app/navigation/dijkstra.py`).
- Concise verbal instruction generator (`backend/app/navigation/instruction.py`).
- Navigation State Machine with explicit discrete states (`backend/app/navigation/state_machine.py`).
- 24 comprehensive unit and component tests passing.
- Milestone checkpoint snapshot (`project-state/checkpoints/M1-navigation.md`).

---

## [0.1.0] - 2026-09-13
### Added
- Static project governance: `.agents/rules/00-hard-rules.md` defining Rules 1 through 17.
- State management infrastructure: `project-state/STATE.md`, `FEATURE_REGISTRY.yaml`, `CURRENT_SPRINT.md`, `DECISIONS.md`.
- Complete documentation suite (`docs/`).
- Task management system (`tasks/`).
- Automated test runner scaffolding with `pytest` and `run_tests.py`.
