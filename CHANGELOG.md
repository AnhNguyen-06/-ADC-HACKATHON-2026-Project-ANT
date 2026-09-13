# Changelog — Project ANT

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

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
- Independent review sign-off (`docs/reviews/M1_REVIEW.md`).
- Milestone checkpoint snapshot (`project-state/checkpoints/M1-navigation.md`).

---

## [0.1.0] - 2026-09-13
### Added
- Static project governance: `.agents/rules/00-hard-rules.md` defining Rules 1 through 17.
- State management infrastructure: `project-state/STATE.md`, `FEATURE_REGISTRY.yaml`, `CURRENT_SPRINT.md`, `DECISIONS.md`.
- Architectural decision record ADR-0001.
- Complete documentation suite (`docs/`).
- Task management system (`tasks/`).
- Automated test runner scaffolding with `pytest` and `run_tests.py`.
