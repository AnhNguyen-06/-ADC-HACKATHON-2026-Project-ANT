# Task ID: task-004-office-graph

# Objective
Design and implement the Office Graph data model, JSON schema, graph loader, and topological integrity validator for Milestone M1.

# Context
Indoor navigation requires an explicit, structured representation of navigable office space (nodes, checkpoints, edges, distances, directions, accessibility flags, and semantic landmarks).

# Scope
- Define Pydantic models: `Node`, `Edge`, `OfficeMap`.
- Implement `GraphLoader` with validation (no dangling edges, valid coordinate pairs, unique tag IDs).
- Create synthetic office test map `backend/data/office_map.json` representing Entrance, Elevator, Corridor Junction, and Meeting Room B.

# Non-scope
- Pathfinding algorithms (covered in task-005).
- AprilTag vision detection (covered in M2).

# Inputs
- Map specifications in Part 11.

# Outputs
- `backend/app/navigation/models.py`
- `backend/app/navigation/graph.py`
- `backend/data/office_map.json`
- `tests/test_graph.py`

# Files expected to change
- `backend/app/navigation/models.py`
- `backend/app/navigation/graph.py`
- `backend/data/office_map.json`
- `tests/test_graph.py`

# Dependencies
- M0 governance completion.

# Acceptance criteria
- Graph loader parses JSON map with 100% schema validation.
- Rejects maps with undefined node references or duplicate tag IDs.
- Provides lookup functions: `get_node_by_id`, `get_node_by_tag`, `get_neighbors`.

# Tests required
- Unit test for valid office map loading.
- Unit test for malformed map (dangling edge, duplicate tag).
- Unit test for tag lookup.

# Review agents
- Navigation Engineer
- QA Engineer

# Risks
- Incomplete landmark representation (mitigated by extensible Pydantic schema).

# Definition of Done
- Models and loader implemented, 100% unit tests passing, reviewed by Navigation Engineer.

# State update requirements
- Update `FEATURE_REGISTRY.yaml` (office_graph: IMPLEMENTED/TESTED).
- Update `STATE.md`.
