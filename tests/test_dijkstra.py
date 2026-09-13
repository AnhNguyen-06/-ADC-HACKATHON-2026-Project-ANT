import pytest
from pathlib import Path
from backend.app.navigation.graph import OfficeGraph, NodeNotFoundError
from backend.app.navigation.dijkstra import DijkstraRouter, NoPathFoundError

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def graph():
    return OfficeGraph.from_json_file(MAP_PATH)

@pytest.fixture
def router(graph):
    return DijkstraRouter(graph)

def test_dijkstra_valid_route_entrance_to_meeting_b(router):
    route = router.find_route(start_id="entrance", destination_id="meeting_b", accessible_only=True)
    assert route.origin.id == "entrance"
    assert route.destination.id == "meeting_b"
    assert route.total_distance == 40.0  # 10 + 10 + 15 + 5
    
    # Path: entrance -> hallway_junction -> elevator -> corridor_b -> meeting_b
    node_ids = [n.id for n in route.nodes]
    assert node_ids == ["entrance", "hallway_junction", "elevator", "corridor_b", "meeting_b"]
    assert len(route.steps) == 4

def test_dijkstra_same_start_and_destination(router):
    route = router.find_route(start_id="entrance", destination_id="entrance")
    assert route.origin.id == "entrance"
    assert route.destination.id == "entrance"
    assert route.total_distance == 0.0
    assert len(route.steps) == 0
    assert len(route.nodes) == 1

def test_dijkstra_unknown_node(router):
    with pytest.raises(NodeNotFoundError):
        router.find_route(start_id="non_existent", destination_id="entrance")

def test_dijkstra_stairs_inaccessible_path(router, graph):
    # stairs_east has accessible=False
    # When accessible_only=True, path through stairs should fail or find alternative
    with pytest.raises(NoPathFoundError):
        # stairs_east only connects to elevator, but edge from elevator to stairs is accessible=False
        router.find_route(start_id="elevator", destination_id="stairs_east", accessible_only=True)

    # But when accessible_only=False, it should succeed
    route = router.find_route(start_id="elevator", destination_id="stairs_east", accessible_only=False)
    assert route.total_distance == 5.0

def test_dijkstra_blocked_edge_avoidance(router, graph):
    # Block corridor_b -> meeting_b edge
    graph.set_edge_blocked("corridor_b", "meeting_b", blocked=True)
    
    # Now meeting_b is unreachable because corridor_b is the only incoming edge
    with pytest.raises(NoPathFoundError):
        router.find_route(start_id="entrance", destination_id="meeting_b")

    # Restore edge
    graph.set_edge_blocked("corridor_b", "meeting_b", blocked=False)
    route = router.find_route(start_id="entrance", destination_id="meeting_b")
    assert route.destination.id == "meeting_b"
