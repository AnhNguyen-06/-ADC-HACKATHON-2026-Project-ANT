import pytest
import numpy as np
from pathlib import Path
import json

from backend.app.vision.detector import AprilTagDetector
from backend.app.vision.mapper import TagMapper
from backend.app.vision.camera import SyntheticCameraProvider
from backend.app.navigation.graph import OfficeGraph, NodeNotFoundError
from backend.app.navigation.dijkstra import DijkstraRouter, NoPathFoundError
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState
from backend.app.audio.service import NaturalLanguageDestinationParser
from backend.app.services.navigation_service import NavigationService

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def nav_service():
    return NavigationService(MAP_PATH)

# ==============================================================================
# RED TEAM 1: Vision & Camera Failure Injection
# ==============================================================================

def test_red_team_extreme_lighting_glare_and_blackout():
    detector = AprilTagDetector()

    # Total blackout (0 lux)
    blackout = np.zeros((480, 640, 3), dtype=np.uint8)
    assert len(detector.detect(blackout)) == 0

    # Total glare (pure white saturation)
    glare = np.ones((480, 640, 3), dtype=np.uint8) * 255
    assert len(detector.detect(glare)) == 0

    # Sensor static noise
    noise = np.random.randint(0, 256, (480, 640, 3), dtype=np.uint8)
    assert len(detector.detect(noise)) == 0

    # Empty array / zero dimensions
    assert len(detector.detect(np.array([]))) == 0
    assert len(detector.detect(None)) == 0

def test_red_team_corrupt_base64_frame_injection(nav_service):
    # Corrupt base64 string
    res1 = nav_service.process_base64_frame("NOT_A_VALID_BASE_64_STRING!@#$%^&*()")
    assert "error" in res1["type"] or res1["state"] != "CRASHED"

    # Truncated base64
    res2 = nav_service.process_base64_frame("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/")
    assert res2 is not None

def test_red_team_unregistered_tag_injection(nav_service):
    # Tag 9999 does not exist in office map
    res = nav_service.simulate_tag_observed(9999)
    assert res["state"] != "ERROR"  # Should ignore or report unknown landmark, never crash
    assert "Unrecognized" in res["spoken_cue"] or "unrecognized" in res["spoken_cue"].lower()

# ==============================================================================
# RED TEAM 2: Routing & Path Severing
# ==============================================================================

def test_red_team_severed_path_during_journey(nav_service):
    # Start at entrance -> destination meeting_b
    nav_service.simulate_tag_observed(1)
    nav_service.process_destination_id("meeting_b")
    assert nav_service.state_machine.current_state == NavigationState.ROUTE_READY

    # Sever all forward paths to destination
    nav_service.graph.set_edge_blocked("corridor_b", "meeting_b", blocked=True)

    # Trigger reroute
    res = nav_service.state_machine.trigger_reroute("corridor_b", "meeting_b")
    assert nav_service.state_machine.current_state == NavigationState.ERROR
    assert "blocked" in res.lower()

    # Restore edge and recover
    nav_service.graph.set_edge_blocked("corridor_b", "meeting_b", blocked=False)
    nav_service.process_destination_id("meeting_b")
    assert nav_service.state_machine.current_state == NavigationState.ROUTE_READY

def test_red_team_non_existent_and_malicious_destination_queries(nav_service):
    malicious_inputs = [
        "",
        "   ",
        "../../etc/passwd",
        "DROP TABLE nodes;--",
        "<script>alert('xss')</script>",
        "A" * 1000,  # Fuzz length test
        "take me to the mars rover landing site"
    ]
    for bad_input in malicious_inputs:
        res = nav_service.process_voice_command(bad_input)
        assert res["state"] == NavigationState.ERROR
        assert "could not find destination" in res["spoken_cue"].lower()

# ==============================================================================
# RED TEAM 3: State Machine Illegal Transitions & Recovery
# ==============================================================================

def test_red_team_state_recovery_after_multiple_errors(nav_service):
    # Cause error 1
    nav_service.process_destination_id("invalid_1")
    assert nav_service.state_machine.current_state == NavigationState.ERROR

    # Cause error 2
    nav_service.process_destination_id("invalid_2")
    assert nav_service.state_machine.current_state == NavigationState.ERROR

    # Recover gracefully with valid tag and destination
    nav_service.simulate_tag_observed(1)
    res = nav_service.process_destination_id("elevator")
    assert nav_service.state_machine.current_state == NavigationState.ROUTE_READY
    assert res["destination"]["id"] == "elevator"

def test_red_team_rapid_obstacle_cycling(nav_service):
    # Rapid toggle 50 times
    for _ in range(50):
        nav_service.trigger_obstacle_simulation("chair", "center")
        assert nav_service.state_machine.current_state == NavigationState.OBSTACLE_WARNING
        nav_service.clear_obstacle_simulation()

# ==============================================================================
# RED TEAM 4: Privacy & Secrets Audit (Rule 11 & Rule 30)
# ==============================================================================

def test_red_team_secrets_and_privacy_audit():
    # Scan source files excluding the test file itself
    repo_files = list(WORKSPACE_ROOT.rglob("*"))
    secret_patterns = ["AIzaSy", "sk-proj-", "BEGIN PRIVATE KEY"]
    
    for file_path in repo_files:
        if file_path.is_file() and file_path.suffix in [".py", ".json", ".html", ".js"] and file_path.name != "test_red_team.py":
            try:
                content = file_path.read_text(encoding="utf-8")
                for pattern in secret_patterns:
                    assert pattern not in content, f"Possible secret ({pattern}) detected in {file_path}"
            except UnicodeDecodeError:
                pass
