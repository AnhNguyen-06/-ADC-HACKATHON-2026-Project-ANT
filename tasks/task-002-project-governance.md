# Task ID: task-002-project-governance

# Objective
Establish static project governance rules 1-17 (`00-hard-rules.md`), project state tracker (`STATE.md`), machine-readable feature registry (`FEATURE_REGISTRY.yaml`), decision logs (`DECISIONS.md`), current sprint tracker (`CURRENT_SPRINT.md`), and `CHANGELOG.md`.

# Context
To prevent architectural drift, maintain accessibility discipline, and ensure stage demo reliability, the team operates under strict governance rules that cannot be casually altered.

# Scope
- Implement `.agents/rules/00-hard-rules.md`.
- Implement `project-state/STATE.md`.
- Implement `project-state/FEATURE_REGISTRY.yaml`.
- Implement `project-state/CURRENT_SPRINT.md`.
- Implement `project-state/DECISIONS.md`.
- Implement `CHANGELOG.md`.

# Non-scope
- Implementation of navigation, vision, or audio algorithms.

# Inputs
- Project specification parts 0 through 54.

# Outputs
- Standardized governance and state tracking files.

# Files expected to change
- `.agents/rules/00-hard-rules.md`
- `project-state/STATE.md`
- `project-state/FEATURE_REGISTRY.yaml`
- `project-state/CURRENT_SPRINT.md`
- `project-state/DECISIONS.md`
- `CHANGELOG.md`

# Dependencies
- `task-001-repository-audit` completed.

# Acceptance criteria
- All 17 hard rules present with exact specifications.
- `FEATURE_REGISTRY.yaml` conforms to standardized status enum.
- Decisions logged for stack and simulation architecture.

# Tests required
- Schema validation of `FEATURE_REGISTRY.yaml` (valid YAML).
- Integrity check of rules document.

# Review agents
- Principal Architect
- Accessibility Reviewer

# Risks
- Misalignment with hackathon rules (mitigated by strict adherence to specifications).

# Definition of Done
- All governance files exist, are properly formatted, and tracked by Git.

# State update requirements
- Update `STATE.md` and mark `task-002` completed in `CURRENT_SPRINT.md`.
