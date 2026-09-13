# System Architecture — Project ANT

```
+-----------------------------------------------------------------------------------------+
|                                     BROWSER CLIENT                                      |
|                                                                                         |
|   +---------------------------------------+   +-------------------------------------+   |
|   |         Accessible User Area          |   |        Developer / Judge Cockpit    |   |
|   | - High Contrast UI (WCAG AAA)         |   | - Live Camera & Bounding Box HUD    |   |
|   | - Large Voice / Push-to-Talk Buttons  |   | - Real-time Topological Graph Map   |   |
|   | - ARIA Live Announcement Feed         |   | - Obstacle Radar / Proximity Badge  |   |
|   | - Audio Earcon & TTS Player           |   | - Navigation State Telemetry        |   |
|   +---------------------------------------+   +-------------------------------------+   |
|                                       ^           ^                                     |
|                                       |           |                                     |
|                     WebSocket (Duplex) / REST HTTP API                                  |
+---------------------------------------v-----------v-------------------------------------+
                                        |
+-----------------------------------------------------------------------------------------+
|                                  LOCAL BACKEND SERVER                                   |
|                                (Python 3.14 / FastAPI)                                  |
|                                                                                         |
|   +-------------------+  +--------------------+  +------------------+  +------------+   |
|   |  Vision Service   |  | Navigation Service |  | Perception Svc   |  | Audio Svc  |   |
|   | - AprilTag Det.   |  | - Office Graph     |  | - Obstacle Det.  |  | - Parser   |   |
|   | - Tag Mapper      |  | - Dijkstra Solver  |  | - Spatial Filter |  | - Feedback |   |
|   | - Camera Stream   |  | - Instruction Gen  |  | - Proximity Map  |  | - TTS Mgr  |   |
|   +-------------------+  +--------------------+  +------------------+  +------------+   |
|             \                      |                      /                  /          |
|              \                     v                     /                  /           |
|               +---------> [ Navigation State Machine ] <-------------------+            |
|                           - UNKNOWN                                                     |
|                           - AT_CHECKPOINT                                               |
|                           - ROUTE_READY                                                 |
|                           - MOVING                                                      |
|                           - APPROACHING_CHECKPOINT                                      |
|                           - OBSTACLE_WARNING                                            |
|                           - REROUTING                                                   |
|                           - DESTINATION_REACHED                                         |
|                           - ERROR                                                       |
+-----------------------------------------------------------------------------------------+
```

## Architectural Principles
1. **Separation of Concerns**: Navigation (Dijkstra graph search) is completely decoupled from visual landmark detection (AprilTags) and obstacle classification.
2. **Deterministic State Machine**: State transitions occur strictly through validated events. No scattered boolean flags.
3. **Sensor Abstraction & Dependency Injection**: Every physical sensor (Camera, Microphone, TTS, Object Detector) implements an abstract interface with dual implementations:
   - `LiveProvider` (uses real OpenCV, WebRTC/Canvas video capture, Web Speech API)
   - `SimulatedProvider` (uses deterministic synthetic fixtures and event timelines)
4. **Resilient Local Processing**: No remote cloud latency or network dependencies during navigation.
