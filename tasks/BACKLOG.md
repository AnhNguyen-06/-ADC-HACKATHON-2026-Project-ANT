# Task Backlog — Project ANT

This backlog maintains all pending, active, and deferred work items scored against MVP criteria (Rule 1 & Part 51).

## Milestone 0: Foundation & Governance (Active)
- [x] `task-001`: Repository audit, environment discovery & Git init
- [x] `task-002`: Project governance, rules definition & state system
- [x] `task-003`: System architecture, contracts & ADR-0001
- [x] `task-000-skeleton`: Backend skeleton, pytest setup & sanity verification

## Milestone 1: Navigation Core Engine (Next)
- [ ] `task-004`: Office graph schema, loader & validation
- [ ] `task-005`: Dijkstra shortest path route calculation & instruction generator
- [ ] `task-006`: Navigation state machine implementation & test suite

## Milestone 2: AprilTag Localization
- [ ] `task-007`: Camera provider abstraction (Real & Simulated)
- [ ] `task-008`: AprilTag landmark detector & tag-to-location mapper
- [ ] `task-009`: Checkpoint tracking & transition tests

## Milestone 3: Audio & Voice Feedback
- [ ] `task-010`: SpeechInputProvider & destination natural language parser
- [ ] `task-011`: TextToSpeechProvider & concise announcement coordinator

## Milestone 4: Obstacle Perception
- [ ] `task-012`: Qualitative obstacle detector (person, chair, box, door) & spatial classifier
- [ ] `task-013`: Obstacle warning arbitration engine

## Milestone 5: Full Integration
- [ ] `task-014`: WebSocket telemetry bus & full loop orchestration
- [ ] `task-015`: End-to-end integration test suite

## Milestone 6: Web Application & Deterministic Demo
- [ ] `task-016`: Accessible web frontend (Audio-first user mode + judge debug cockpit)
- [ ] `task-017`: Deterministic 60-second stage demo scenario runner

## Milestone 7: Red-Team & Hardening
- [ ] `task-018`: Red-team fault injection (sensor drop, invalid tag, severed graph, rapid speech)
- [ ] `task-019`: Bug triage & P0/P1 fixes

## Milestone 8: Final Quality Gate & Packaging
- [ ] `task-020`: Final regression audit, documentation freeze, stage rehearsal
