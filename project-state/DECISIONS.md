# Architecture & Product Decisions Log (DECISIONS.md)

This log records major architecture, design, and governance decisions made during the lifecycle of Project ANT.

---

## DEC-0001: Technology Stack Selection (Python 3.14 FastAPI + Modern Web Frontend)
- **Date**: 2026-09-13
- **Context**: Project requires both compute-heavy vision/navigation services and a highly accessible, responsive web interface.
- **Decision**: 
  - Backend: Python 3.14 using FastAPI, Uvicorn, WebSockets, Pydantic, NumPy, OpenCV. Python environment has these packages or wheels verified.
  - Frontend: Semantic HTML5 + Vanilla CSS (Aesthetic glassmorphism, Dark Mode, High Contrast Mode) + Vanilla JavaScript over WebSocket protocol.
  - Test Runner: `pytest` for backend unit/integration tests.
- **Rationale**: 
  - Meets Rule 2 (Web application) without forcing compute-heavy AprilTag/CV detection into unstable browser JS bundles.
  - Zero-latency duplex communication over WebSockets for live video frame transmission, telemetry, and speech events.
  - Avoids excessive framework complexity (Next.js/React hydration overhead) while achieving 60fps rendering and seamless screen reader accessibility.
- **Status**: APPROVED

---

## DEC-0002: Deterministic Simulation & Stage Demo Reliability
- **Date**: 2026-09-13
- **Context**: Rule 12 & Rule 13 require sensor testability and presentation reliability without cloud APIs or physical lighting dependency.
- **Decision**: 
  - Abstract all sensors behind provider interfaces (`CameraProvider`, `SpeechInputProvider`, `TTSProvider`, `ObstacleDetector`).
  - Implement dual modes (`REAL` vs `SIMULATION` / `DEMO`) toggled instantly via config or UI switch.
- **Rationale**: Guarantees testability in automated CI/CD and zero-risk stage demonstrations.
- **Status**: APPROVED

---

## DEC-0003: Concise Audio State Feedback Policy
- **Date**: 2026-09-13
- **Context**: Visually impaired users experience high cognitive load if auditory cues are verbose.
- **Decision**: Restrict spoken feedback to short, directive cues ("Turn right", "Walk straight toward the elevator", "Obstacle ahead. Move slightly left", "You have arrived").
- **Rationale**: Adheres to Rule 7 and Rule 9 (No False Precision, Audio-First Accessibility).
- **Status**: APPROVED

---

## DEC-0004: Impeccable Design System Overhaul & Elimination of "AI" Clichés
- **Date**: 2026-09-13
- **Context**: The initial UI relied on generic AI aesthetic tropes (neon cyan halos with zero offset, unicode emojis for hardware buttons, ungrounded card stacking, generic Inter typography), feeling ungrounded and synthetic.
- **Decision**:
  - Adopt the `impeccable` design system philosophy: replace neon sci-fi glows with directional physics-based elevation shadows (`rgba(0,0,0,0.6)` + `rgba(0,0,0,0.4)`), physical inset bevels, and tactile push button spring mechanics (`:active { transform: translateY(2px) }`).
  - Replace all unicode emojis with authored, accessible geometric inline SVGs.
  - Implement dual conceptual surfaces: Left panel is a Handheld Tactile Mobility Terminal (giant concentric grooved buttons, OLED status scanlines, high-contrast labels); Right panel is a Spatial Telemetry & CAD Radar Cockpit (CAD blueprint grid, directional vector alerts, optical viewfinder with corner reticle brackets).
  - Enhance typography with Google Fonts `Plus Jakarta Sans` for humanist clarity and `JetBrains Mono` for precise hardware telemetry.
  - Add quick landmark preset chips (`Meeting Room B`, `Elevators`, `Restroom`, `Cafeteria`) for one-tap navigation initiation and real-time audio waveform activity animation.
- **Rationale**: Eliminates "AI sludge" aesthetic, elevating the prototype to an authentic, premium assistive device with WCAG AAA compliance.
- **Status**: APPROVED
