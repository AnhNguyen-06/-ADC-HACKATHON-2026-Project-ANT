# Changelog — Project ANT

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [0.8.0] - 2026-09-13
### Added
- Milestone M7: Red-Team Hardening & Fault Injection.
- Comprehensive red-team failure test suite (`tests/test_red_team.py`).
- Resilience guards for complete sensor blackout, extreme glare, and static sensor noise.
- Mid-journey severed path handling and automatic rerouting fallback.
- Malicious payload, buffer overflow, and fuzz query protections.
- Repository-wide credential leak and secret scanning test.
- Discovered, logged, and verified BUG-003 (destination parser empty string guard).
- 52 automated tests passing with zero failures.
- Milestone checkpoint snapshot (`project-state/checkpoints/M7-redteam.md`).

---

## [0.7.0] - 2026-09-13
### Added
- Milestone M6: Web Application & Deterministic Demo Mode.
- Accessible HTML5 web application: `frontend/index.html`.
- Custom CSS design system with Dark Theme and High Contrast WCAG AAA mode: `frontend/css/style.css`.
- Client application controller with WebSocket streaming and Web Audio earcon synthesis: `frontend/js/app.js`.
- Deterministic 60-second hackathon stage demo runner: `frontend/js/demo_runner.js`.
- Static asset serving and DOM integrity test suite: `tests/test_demo.py`.
- 44 unit, component, integration, and demo tests passing.
- Milestone checkpoint snapshot (`project-state/checkpoints/M6-demo.md`).

---

## [0.6.0] - 2026-09-13
### Added
- Milestone M5: Full Integration & Telemetry Bus.
- `NavigationService` unified coordinator (`backend/app/services/navigation_service.py`).
- WebSocket streaming endpoint `/ws/navigation` (`backend/app/api/websocket.py`).
- REST endpoints for nodes, map topology, and voice navigation (`backend/app/api/routes.py`).
- Full navigation lifecycle integration test via WebSocket client (`tests/test_integration.py`).
- 41 unit, component, and integration tests passing.
- Milestone checkpoint snapshot (`project-state/checkpoints/M5-integration.md`).

---

## [0.5.0] - 2026-09-13
### Added
- Milestone M4: Obstacle Perception & Hazard Arbitration.
- `ObstacleItem` qualitative proximity schema (`clear`, `ahead`, `near`, `immediate`) and spatial column classification (`left`, `center`, `right`) (`backend/app/vision/obstacle.py`).
- `MockObstacleDetector` for deterministic offline testing and scenario injection.
- `LightweightContourObstacleDetector` for edge-device visual centroid hazard evaluation.
- `ObstacleWarningEngine` prioritizing center-corridor hazards with confidence gating ($\ge 0.60$).
- State machine integration with directional spoken recovery cues ("Caution: chair ahead. Move slightly left.").
- 39 unit, component, and regression tests passing with zero warnings.
- Milestone checkpoint snapshot (`project-state/checkpoints/M4-obstacle.md`).

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
