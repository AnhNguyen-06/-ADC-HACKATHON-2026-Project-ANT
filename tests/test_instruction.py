from backend.app.navigation.instruction import InstructionGenerator
from backend.app.navigation.models import Node, Edge, RouteStep, LocationType, Direction

def test_announce_location():
    node = Node(id="entrance", name="Office Entrance", type=LocationType.ENTRANCE)
    cue = InstructionGenerator.announce_location(node)
    assert cue == "You are at Office Entrance."

def test_announce_arrival():
    node = Node(id="meeting_b", name="Meeting Room B", type=LocationType.MEETING_ROOM)
    cue = InstructionGenerator.announce_arrival(node)
    assert cue == "You have arrived at Meeting Room B."

def test_obstacle_warning_cues():
    cue_center = InstructionGenerator.format_obstacle_warning("center", "chair")
    assert "Caution: chair ahead. Move slightly left." == cue_center

    cue_left = InstructionGenerator.format_obstacle_warning("left", "person")
    assert "Caution: person on your left. Keep right." == cue_left

    cue_right = InstructionGenerator.format_obstacle_warning("right", "box")
    assert "Caution: box on your right. Keep left." == cue_right

def test_format_step_with_landmark():
    from_node = Node(id="junction", name="Lobby Junction", type=LocationType.JUNCTION)
    to_node = Node(id="elevator", name="Main Elevators", type=LocationType.ELEVATOR)
    edge = Edge(
        from_node="junction",
        to_node="elevator",
        distance=10.0,
        direction=Direction.RIGHT,
        landmark="elevator_call_button",
        instruction="Turn right"
    )
    step = RouteStep(from_node=from_node, to_node=to_node, edge=edge, cumulative_distance=10.0)
    cue = InstructionGenerator.format_step(step)
    assert "Turn right toward the elevator call button." == cue
