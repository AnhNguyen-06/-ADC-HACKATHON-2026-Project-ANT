# Testing Strategy — Project ANT

## 1. Test Levels

```
               [ Level 5: Red Team & Stress Testing ]
               [ Level 4: End-to-End Simulation     ]
               [ Level 3: Service Integration Tests ]
               [ Level 2: Component Tests           ]
               [ Level 1: Deterministic Unit Tests  ]
```

### Level 1: Unit Tests
- Fast, isolated, zero external dependencies.
- **Office Graph**: JSON loading, node retrieval, neighbor lookups, edge accessibility checks.
- **Dijkstra Engine**: Valid path computation, unreachable node detection, cycle avoidance, equal start/end points.
- **State Machine**: Valid state transitions, illegal state transition rejection.
- **Speech Parser**: Regex/intent token extraction ("take me to X", "go to room B", "navigate to entrance").

### Level 2: Component Tests
- **AprilTag Detector**: Synthetic tag bitmap feed -> correct ID decode.
- **Obstacle Classifier**: Synthetic bounding box extraction -> spatial quadrant assignment (left, center, right).
- **Instruction Formatter**: Edge + landmark -> concise spoken sentence.

### Level 3: Service Integration Tests
- WebSocket client connects to `/ws/navigation`.
- Sends tag event -> verifies state update message received.
- Sends speech intent -> verifies route computed and broadcast to client.

### Level 4: End-to-End Simulation Tests
- Programmatic replay of the complete demo scenario from Start to Arrival.
- Asserts that all state transitions (`UNKNOWN` -> `ROUTE_READY` -> `OBSTACLE_WARNING` -> `AT_CHECKPOINT` -> `DESTINATION_REACHED`) occur in correct sequence.

### Level 5: Red-Team & Fault Injection
- Disconnected graph nodes (unreachable destination).
- Completely invalid / corrupted tag IDs.
- Stale tag timeouts (loss of tracking).
- Multiple simultaneous conflicting speech inputs.
- Obstacle persistent blockage triggering rerouting.

---

## 2. Acceptance Criteria & Quality Gates
- 100% pass rate across Level 1-4 tests before any milestone checkpoint is approved.
- Any regression causes immediate trigger of the Automatic Bug Repair Loop (Part 25).
