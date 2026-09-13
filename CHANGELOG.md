# Changelog — Project ANT

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

---

## [1.2.0] - 2026-09-13
### Changed
- **Modern White & Blue Theme (Default)**: Transitioned default palette from dark blue/black to a crisp, clinical-modern White & Electric Blue theme (`#f8fafc` canvas, `#ffffff` elevated panels, `#2563eb` royal blue accents).
- **Light / Dark Mode Theme Switcher**: Replaced the Contrast button with an accessible, animated Theme Toggle (`#btn-theme-toggle`) with Moon/Sun SVGs and `localStorage` persistence (shortcut key `T` or `H`).
- **Balanced Cockpit Split-Grid Layout**: Overhauled right-panel layout to place the Optical Sensor Viewport and Architectural CAD Floorplan side-by-side (`.cockpit-split-grid`), fitting the entire interface inside 1080p displays with zero vertical scrolling.
- **Harmonious Mixed Typography**: Integrated Google Fonts pairing `Outfit` (display headings & titles), `Plus Jakarta Sans` (speech guidance & body), `Space Grotesk` (tactile action headlines), and `JetBrains Mono` (telemetry, coordinates, timers).
- **Collision-Free CAD Map Offsets**: Refined topological node label anchors to eliminate text overlapping across adjacent corridors.

---

## [1.1.0] - 2026-09-13
### Changed
- **Impeccable UI/UX Overhaul**: Eliminated generic "AI" tropes (zero-offset neon glows, unicode emojis, ungrounded card stacking).
- **Physical Assistive Terminal Design**: Restructured interface into a dual-concept surface featuring a handheld tactile terminal (giant concentric grooved buttons, OLED status scanlines, high-contrast typography) and a spatial CAD radar telemetry cockpit.
- **Craft Upgrades**:
  - Replaced all unicode emojis with authored, accessible geometric inline SVGs.
  - Added physical elevation directional shadows, inset bevels, and tactile spring click physics (`:active { transform: translateY(2px) }`).
  - Integrated Google Fonts `Plus Jakarta Sans` and `JetBrains Mono` for maximum humanist readability and technical precision.
  - Added quick landmark preset chips (`Meeting Room B`, `Elevators`, `Restroom`, `Cafeteria`) for one-tap navigation initiation.
  - Implemented dynamic real-time audio waveform activity visualizer on canvas.
  - Added precision optical viewfinder reticle with corner brackets and tactical obstacle warning banners.
  - Optimized CAD SVG floorplan with collision-free, offset node labels.
- **Audit & Evaluation**: Conducted comprehensive Impeccable review (`docs/reviews/IMPECCABLE_CRITIQUE.md`) scoring each feature from 0–10.

---

## [1.0.0] - 2026-09-13
### Added
- Milestone M8: Final Hackathon Prototype Completion & Quality Gate.
- 100% automated test suite passing (52/52 tests across 8 test modules in 2.12s).
- Live browser subagent verification of the complete 60-second stage presentation scenario.
- UI screenshot gallery and recorded demo video artifact (`ant_navigation_demo_1789283392623.webp`).
- Final Quality Gate Review passed unanimously (`docs/reviews/M8_REVIEW.md`).
- Milestone checkpoint snapshot (`project-state/checkpoints/M8-final.md`).
- Complete system walkthrough report (`walkthrough.md`).

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
