# Hackathon Demo Specification — Project ANT

## Demo Duration & Target Audience
- **Target Duration**: 45 to 60 seconds.
- **Audience**: Hackathon Judges, Accessibility Advocates, Tech Leads.
- **Focus**: Highlighting real-world accessibility value, zero false precision, instantaneous tactile/audio feedback, and demo reliability.

---

## Physical / Simulated Environment Layout
Office Floor 1 Topology:
1. **Node 1 (`entrance`)**: Office Entrance (AprilTag ID: 1)
2. **Node 2 (`elevator`)**: Elevator Checkpoint (AprilTag ID: 2)
3. **Node 3 (`corridor_b`)**: Corridor Junction B with printer landmark (AprilTag ID: 5)
4. **Node 4 (`meeting_b`)**: Meeting Room B Destination (AprilTag ID: 12)

---

## The 60-Second Demo Script & Event Timeline

| Time (s) | Actor / Trigger | System Action & Audio Announcement | Visual Cockpit Display |
| :--- | :--- | :--- | :--- |
| **00:00** | User clicks "Start Navigation" or speaks | Activates audio listener. Visual cockpit shows "State: UNKNOWN". | Live camera feed / simulation initialized. |
| **00:05** | User speaks: *"Take me to Meeting Room B"* | Parser extracts destination `meeting_b`. | Destination badge updates to `Meeting Room B`. |
| **00:08** | Camera detects AprilTag ID 1 | Tag maps to `entrance`. System sets current location. | Bounding box on Tag 1. Current Location: `Office Entrance`. |
| **00:10** | Dijkstra route calculated | **TTS**: *"You are at the office entrance. Route found. Walk straight toward the elevator."* | Route highlighted on graph map: Entrance -> Elevator -> Meeting Room B. |
| **00:20** | Obstacle detected in path | Vision detects chair in center field. State: `OBSTACLE_WARNING`.<br>**TTS**: *"Obstacle ahead. Move slightly left."* | Bounding box on Chair (red overlay). Proximity: Near Center. |
| **00:32** | Camera detects AprilTag ID 2 | State: `APPROACHING_CHECKPOINT` -> `AT_CHECKPOINT`.<br>**TTS**: *"Elevator checkpoint reached. Turn right."* | Bounding box on Tag 2. Node updated to Elevator. |
| **00:48** | Camera detects AprilTag ID 12 | State: `DESTINATION_REACHED`.<br>**TTS**: *"You have arrived at Meeting Room B."* | Destination green flash. Navigation complete banner. |

---

## Fallback & Reliability Contingencies
- **No Internet / Wi-Fi Down**: 100% locally served on `localhost:8000`.
- **Bad Lighting / Camera Glare**: One-click toggle switch to "Deterministic Demo Mode" which feeds pre-recorded frames and synthetic sensor events without hesitation.
