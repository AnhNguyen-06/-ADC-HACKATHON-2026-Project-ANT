import pytest
from pathlib import Path
from backend.app.navigation.graph import OfficeGraph, GraphValidationError, NodeNotFoundError
from backend.app.navigation.models import OfficeMap, Node, Edge, LocationType, Direction

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

def test_load_default_office_map():
    graph = OfficeGraph.from_json_file(MAP_PATH)
    assert graph.office_map.name == "ANT Corporate Headquarters - Floor 1"
    assert len(graph.get_all_nodes()) >= 6
    
    # Check entrance node
    entrance = graph.get_node("entrance")
    assert entrance.name == "Office Entrance"
    assert entrance.type == LocationType.ENTRANCE
    assert entrance.tag_id == 1

def test_lookup_node_by_tag():
    graph = OfficeGraph.from_json_file(MAP_PATH)
    node = graph.get_node_by_tag(12)
    assert node is not None
    assert node.id == "meeting_b"
    assert node.name == "Meeting Room B"

    # Non-existent tag
    assert graph.get_node_by_tag(9999) is None

def test_unknown_node_lookup():
    graph = OfficeGraph.from_json_file(MAP_PATH)
    with pytest.raises(NodeNotFoundError):
        graph.get_node("non_existent_room")

def test_duplicate_node_validation():
    invalid_map = OfficeMap(
        name="Invalid Map",
        floor=1,
        nodes=[
            Node(id="n1", name="Room 1", type=LocationType.MEETING_ROOM),
            Node(id="n1", name="Room 1 Duplicate", type=LocationType.MEETING_ROOM)
        ],
        edges=[]
    )
    with pytest.raises(GraphValidationError, match="Duplicate node id"):
        OfficeGraph(invalid_map)

def test_duplicate_tag_validation():
    invalid_map = OfficeMap(
        name="Invalid Map",
        floor=1,
        nodes=[
            Node(id="n1", name="Room 1", type=LocationType.MEETING_ROOM, tag_id=42),
            Node(id="n2", name="Room 2", type=LocationType.MEETING_ROOM, tag_id=42)
        ],
        edges=[]
    )
    with pytest.raises(GraphValidationError, match="Duplicate tag_id"):
        OfficeGraph(invalid_map)

def test_dangling_edge_validation():
    invalid_map = OfficeMap(
        name="Invalid Map",
        floor=1,
        nodes=[Node(id="n1", name="Room 1", type=LocationType.MEETING_ROOM)],
        edges=[
            Edge(
                from_node="n1",
                to_node="ghost_node",
                distance=5.0,
                direction=Direction.FORWARD,
                instruction="Walk into void"
            )
        ]
    )
    with pytest.raises(GraphValidationError, match="non-existent to_node"):
        OfficeGraph(invalid_map)

def test_block_and_unblock_edge():
    graph = OfficeGraph.from_json_file(MAP_PATH)
    edge = graph.get_edge("entrance", "hallway_junction")
    assert edge is not None
    assert edge.blocked is False
    
    # Block edge
    assert graph.set_edge_blocked("entrance", "hallway_junction", blocked=True) is True
    assert edge.blocked is True
    
    # Unblock edge
    assert graph.set_edge_blocked("entrance", "hallway_junction", blocked=False) is True
    assert edge.blocked is False
