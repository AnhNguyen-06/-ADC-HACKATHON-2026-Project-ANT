# Requirements Specification — Project ANT

## 1. Product Vision & Problem Statement
Visually impaired employees in unfamiliar or large office spaces often face friction navigating to conference rooms, restrooms, pantries, or elevators, typically having to ask sighted colleagues. Project ANT provides an assistive web application utilizing camera-based passive visual landmark detection, deterministic indoor routing, qualitative obstacle alerts, and audio-first feedback to enable independent indoor mobility.

---

## 2. Functional Requirements (FR)

### FR-1: Destination Selection
- FR-1.1: The user shall be able to request a destination by voice ("Take me to Meeting Room B").
- FR-1.2: The system shall provide keyboard and touch-accessible destination selection controls for screen-reader users.
- FR-1.3: If a destination is invalid or unknown, the system shall announce: "I could not find that destination."

### FR-2: Localization via Passive AprilTags
- FR-2.1: The camera shall automatically detect passive AprilTag landmarks without requiring the user to aim or trigger a manual scan.
- FR-2.2: Detected tags shall resolve to known office topology nodes with semantic labels (e.g. Tag 1 -> "Entrance", Tag 2 -> "Elevator", Tag 12 -> "Meeting Room B").
- FR-2.3: If an unknown tag is detected or camera tracking is lost, the state shall transition gracefully with auditory feedback ("I cannot determine your location").

### FR-3: Routing Engine
- FR-3.1: The system shall calculate the shortest accessible path between the current node and destination using Dijkstra's algorithm.
- FR-3.2: Paths shall account for edge accessibility (e.g. elevator preferred over stairs for accessible routes).
- FR-3.3: In the event of a blocked corridor or obstacle requiring rerouting, the system shall recalculate an alternative path and announce: "The usual route is blocked. I found an alternative route."

### FR-4: Auditory & Assistive Feedback
- FR-4.1: Every state transition shall provide immediate, concise spoken audio feedback via Text-To-Speech.
- FR-4.2: Instructions shall avoid false precision and wordiness (e.g. "Turn right", "Walk straight toward the elevator", "Elevator checkpoint reached").
- FR-4.3: Distinct audio chimes (earcons) shall announce tag detection, checkpoint arrival, and obstacle alerts.

### FR-5: Obstacle Awareness
- FR-5.1: The system shall detect common indoor obstacles (person, chair, box, table, door).
- FR-5.2: Obstacles detected in the central path shall trigger an auditory caution ("Obstacle ahead. Move slightly left").
- FR-5.3: Proximity shall be qualitative (near, ahead, clear) without fabricating millimeter depth.

### FR-6: Deterministic Demo & Simulation Mode
- FR-6.1: The system shall feature a deterministic offline demo mode that simulates the complete entrance-to-meeting-room-B journey without requiring physical cameras or internet access.
- FR-6.2: A dual-interface layout shall provide an uncluttered screen-reader optimized mode for blind users and a visual debug cockpit for judges/developers.

---

## 3. Non-Functional Requirements (NFR)

- **NFR-1 (Accessibility)**: Full compliance with WCAG 2.1 Level AA (target AAA for contrast and keyboard/screen-reader navigation). ARIA live regions for dynamic speech updates.
- **NFR-2 (Latency)**: Tag recognition to state transition under 250ms. TTS initiation under 300ms.
- **NFR-3 (Privacy & Security)**: Camera video streams and audio inputs processed locally. No raw images or audio saved to persistent storage. No cloud dependencies required.
- **NFR-4 (Explainability)**: Deterministic route generation and discrete state transitions (`UNKNOWN`, `AT_CHECKPOINT`, `ROUTE_READY`, `MOVING`, `APPROACHING_CHECKPOINT`, `OBSTACLE_WARNING`, `REROUTING`, `DESTINATION_REACHED`, `ERROR`).
