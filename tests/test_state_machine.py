import pytest
from pathlib import Path
from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def sm():
    graph = OfficeGraph.from_json_file(MAP_PATH)
    router = DijkstraRouter(graph)
    return NavigationStateMachine(graph, router)

def test_initial_state_unknown(sm):
    assert sm.current_state == NavigationState.UNKNOWN
    snapshot = sm.get_snapshot()
    assert snapshot["state"] == "UNKNOWN"
    assert snapshot["has_active_route"] is False

def test_full_navigation_lifecycle(sm):
    # 1. Detect Tag 1 (Entrance)
    msg1 = sm.on_tag_observed(1)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert sm.current_node.id == "entrance"
    assert "Office Entrance" in msg1

    # 2. Request Destination "meeting_b"
    msg2 = sm.request_destination("meeting_b")
    assert sm.current_state == NavigationState.ROUTE_READY
    assert sm.active_route is not None
    assert "Route found." in msg2

    # 3. Obstacle detected ahead
    msg3 = sm.on_obstacle_detected({"class": "chair", "position": "center"})
    assert sm.current_state == NavigationState.OBSTACLE_WARNING
    assert "Caution: chair ahead. Move slightly left." == msg3

    # 4. Obstacle cleared
    msg4 = sm.on_obstacle_cleared()
    assert sm.current_state == NavigationState.MOVING
    assert "Path clear." in msg4

    # 5. Checkpoint 1: Tag 2 (hallway_junction)
    msg5 = sm.on_tag_observed(2)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert sm.current_node.id == "hallway_junction"
    assert "Central Lobby Junction reached." in msg5

    # 6. Checkpoint 2: Tag 3 (elevator)
    msg6 = sm.on_tag_observed(3)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert sm.current_node.id == "elevator"
    assert "Main Elevators reached." in msg6

    # 7. Checkpoint 3: Tag 4 (corridor_b)
    msg7 = sm.on_tag_observed(4)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert sm.current_node.id == "corridor_b"

    # 8. Destination reached: Tag 12 (meeting_b)
    msg8 = sm.on_tag_observed(12)
    assert sm.current_state == NavigationState.DESTINATION_REACHED
    assert sm.current_node.id == "meeting_b"
    assert "You have arrived at Meeting Room B." == msg8

def test_unknown_destination_error_handling(sm):
    # Must not fail silently (Rule 14)
    msg = sm.request_destination("invalid_destination_xyz")
    assert sm.current_state == NavigationState.ERROR
    assert "could not find destination" in msg

def test_reroute_when_path_blocked(sm):
    sm.on_tag_observed(1)
    sm.request_destination("meeting_b")
    assert sm.current_state == NavigationState.ROUTE_READY
    
    # Reroute due to blockage
    reroute_msg = sm.trigger_reroute("corridor_b", "meeting_b")
    # In our graph, corridor_b -> meeting_b is the single access edge, so reroute should indicate blockage
    assert sm.current_state == NavigationState.ERROR
    assert "blocked" in reroute_msg.lower()
