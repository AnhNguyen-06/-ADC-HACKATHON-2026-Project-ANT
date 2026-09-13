# ADR 0001: Core Architecture and Technology Stack Selection

## Status
ACCEPTED

## Context
Project ANT requires an assistive technology application serving blind and visually impaired users. The system requires real-time computer vision (AprilTag landmark decoding, obstacle recognition), deterministic graph pathfinding (Dijkstra algorithm), low-latency audio/speech integration, and an accessible interface with developer cockpit capabilities.

Key constraints:
- Must run reliably on standard hardware without mandatory GPU or cloud internet dependencies.
- Must provide audio-first screen reader accessibility.
- Must execute on Windows in Python 3.14 / Node 24 runtime environment.

## Decision
1. **Backend**: Python 3.14 using `FastAPI` + `Uvicorn` + `WebSockets` + `NumPy` + `OpenCV`.
   - Chosen for rapid sensor processing, native image array manipulations, simple threading, and robust JSON schema validation via `Pydantic`.
2. **Frontend**: Standards-compliant Web Application built with Semantic HTML5, Vanilla CSS (curated high-contrast & glassmorphism theme tokens), and Vanilla JavaScript over WebSocket.
   - Avoids framework churn and heavy client-side hydration.
   - Direct integration with native browser Web Speech API (`speechSynthesis` & `webkitSpeechRecognition`) with graceful fallback.
3. **Sensor Abstraction**: Interface-driven providers (`Real` vs `Simulation`) for camera, speech, TTS, and obstacle detection.
4. **Test Runner**: `pytest` for backend unit, component, integration, and simulation testing.

## Consequences
- **Positive**: High reliability, sub-50ms latency between sensor update and UI broadcast, zero external cloud costs or API key failures during live judging.
- **Negative / Trade-offs**: Client-side camera video frames sent over WebSocket require binary / base64 transport, which requires careful packet throttling (5–10 fps is sufficient for indoor walking speeds).
