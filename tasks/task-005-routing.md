# Task ID: task-005-routing

# Objective
Implement Dijkstra shortest-path route calculation, edge accessibility filtering, dynamic obstacle route-blocking, concise turn-by-turn instruction generator, and navigation state machine.

# Context
The core navigation engine must compute deterministic routes, provide concise auditory cues, and handle dynamic edge blockages without silent failure.

# Scope
- Implement `DijkstraRouter` class.
- Implement edge cost evaluation (distance + accessibility penalties).
- Implement blocked-edge avoidance (rerouting support).
- Implement `InstructionGenerator` producing concise, directive cues.
- Implement `NavigationStateMachine` with valid transitions.

# Non-scope
- Live camera AprilTag feed or live microphone capture.

# Inputs
- Office graph instance from `task-004`.

# Outputs
- `backend/app/navigation/dijkstra.py`
- `backend/app/navigation/instruction.py`
- `backend/app/navigation/state_machine.py`
- `tests/test_dijkstra.py`
- `tests/test_instruction.py`
- `tests/test_state_machine.py`

# Files expected to change
- `backend/app/navigation/dijkstra.py`
- `backend/app/navigation/instruction.py`
- `backend/app/navigation/state_machine.py`
- `tests/test_dijkstra.py`
- `tests/test_instruction.py`
- `tests/test_state_machine.py`

# Dependencies
- `task-004-office-graph` completed.

# Acceptance criteria
- Returns shortest path for valid start and destination.
- Handles same start and destination gracefully.
- Raises/returns clean error when destination is unreachable or unknown.
- Supports marking an edge blocked and recalculating route.
- Generates concise audio instructions matching Rule 7 and Rule 9.

# Tests required
- Valid route test (Entrance -> Meeting Room B).
- Unknown destination test.
- Disconnected node / unreachable destination test.
- Same start/destination test.
- Blocked edge rerouting test.
- State machine transition tests.

# Review agents
- Navigation Engineer
- Accessibility Reviewer
- Red-Team Engineer

# Risks
- Overly verbose instructions (mitigated by strict length thresholds in instruction generator).

# Definition of Done
- Dijkstra algorithm, instruction generator, and state machine fully tested with 100% test pass rate.

# State update requirements
- Update `FEATURE_REGISTRY.yaml` (route_engine: COMPLETE).
- Update `STATE.md`, `CHANGELOG.md`.
