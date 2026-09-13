# Project Constitution: Non-Negotiable Hard Rules

Project Codename: ANT
Full Name: Adaptive Navigation Technology
Status: STATIC GOVERNANCE

This file contains the foundational rules for Project ANT. It must be treated as STATIC GOVERNANCE and must not be casually rewritten.

---

## RULE 1 — MVP FIRST
Build the smallest stable end-to-end system first.
Never build advanced features before the core navigation loop works.
Core loop:
VOICE DESTINATION -> CURRENT LOCATION -> ROUTE -> INSTRUCTION -> CHECKPOINT -> OBSTACLE AWARENESS -> DESTINATION

---

## RULE 2 — WEB APPLICATION
The primary product must be implemented as a web application.
The web application should provide:
- user-facing navigation interaction
- audio-first interaction
- camera access where technically appropriate
- developer/debug visualization
- current location
- destination
- route
- detected checkpoints
- obstacle state
- current instruction
- system state
- demo mode
Computer vision and other compute-heavy logic may run server-side/local-side.
Do NOT force all CV processing into browser JavaScript if that harms reliability.

---

## RULE 3 — CAMERA-FIRST
The user must NOT manually scan QR codes or AprilTags.
AprilTags are passive environmental landmarks.
The camera should automatically observe and detect them.
Never design: "Open scanner -> point at QR -> press scan."
Instead: "Camera observes environment -> detector automatically identifies known landmark."

---

## RULE 4 — APRILTAG RESPONSIBILITY
AprilTags are used for:
- localization
- checkpoint recognition
- route progress confirmation
- destination confirmation
AprilTags are NOT responsible for:
- obstacle detection
- route planning
- safety guarantees

---

## RULE 5 — COMPUTER VISION RESPONSIBILITY
Computer vision is responsible for supported visual perception such as:
- person
- chair
- box
- door
- other selected obstacles
- selected semantic landmarks where feasible
Object detection must be treated separately from localization.

---

## RULE 6 — ROUTING RESPONSIBILITY
The navigation engine is responsible for:
- path finding
- route state
- next checkpoint
- route completion
- route recalculation
Prefer simple deterministic algorithms such as Dijkstra or A*.
For the hackathon, Dijkstra is acceptable and often preferred because explainability and reliability matter more than theoretical scale.

---

## RULE 7 — AUDIO-FIRST ACCESSIBILITY
The core task must be usable without depending on visual UI.
Every important state transition must have an audio representation.
Examples:
- "You are at the entrance."
- "Route found."
- "Walk straight toward the elevator."
- "Obstacle ahead."
- "Turn right."
- "You have arrived."

---

## RULE 8 — HAPTIC FEEDBACK
Haptics may supplement audio.
Never require haptics for the core demo if browser/device compatibility is uncertain.

---

## RULE 9 — NO FALSE PRECISION
Never claim precise obstacle distance unless validated.
Do not say: "Obstacle exactly 1.24 meters away" unless actual depth estimation has been implemented and validated.
Prefer: "Obstacle ahead.", "Obstacle nearby.", "Move slightly left."

---

## RULE 10 — SAFETY
The system is experimental assistive technology.
Never claim:
- collision avoidance guarantee
- guaranteed safety
- medical certification
- clinical validation
- autonomous mobility certification
Include visible/documented limitations.

---

## RULE 11 — PRIVACY
Camera and microphone data should be processed as locally as practical.
Do not retain raw camera/audio data unless required.
Do not log personal data unnecessarily.
Never hardcode API keys.

---

## RULE 12 — TESTABILITY
Every sensor must have a testable abstraction.
Real hardware must never be the only way to execute the system.
Required: REAL MODE + SIMULATION MODE.

---

## RULE 13 — DEMO RELIABILITY
The final demo must not depend entirely on:
- external internet
- live cloud APIs
- perfect lighting
- perfect speech recognition
- hardware availability
A deterministic fallback mode is mandatory.

---

## RULE 14 — NO SILENT FAILURE
If localization fails: "I cannot determine your location."
If destination is unknown: "I could not find that destination."
If the camera is unavailable: "Camera unavailable."
Never silently continue using stale state.

---

## RULE 15 — NO DESTRUCTIVE OPERATIONS
Never delete or overwrite unrelated user work.
Before major modifications:
- inspect Git status
- inspect repository structure
- preserve user changes

---

## RULE 16 — DOCUMENTATION
Every meaningful feature must update project state and relevant documentation.

---

## RULE 17 — STATE
A task is NOT complete until project state has been updated.
Mandatory state files:
- project-state/STATE.md
- project-state/FEATURE_REGISTRY.yaml
- project-state/CURRENT_SPRINT.md
- project-state/DECISIONS.md
- project-state/checkpoints/
- CHANGELOG.md
