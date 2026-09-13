import pytest
from pathlib import Path

from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState
from backend.app.audio.service import NaturalLanguageDestinationParser, MockTTSProvider

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def graph():
    return OfficeGraph.from_json_file(MAP_PATH)

@pytest.fixture
def parser():
    return NaturalLanguageDestinationParser()

@pytest.fixture
def tts():
    return MockTTSProvider()

def test_parse_destinations_natural_speech(parser, graph):
    nodes = graph.get_all_nodes()

    # Meeting room B variations
    assert parser.parse_destination("Take me to Meeting Room B", nodes) == "meeting_b"
    assert parser.parse_destination("please go to room b", nodes) == "meeting_b"
    assert parser.parse_destination("navigate to conference room b", nodes) == "meeting_b"

    # Elevator variations
    assert parser.parse_destination("Guide me to the elevator", nodes) == "elevator"
    assert parser.parse_destination("take me to the lifts", nodes) == "elevator"

    # Restroom variations
    assert parser.parse_destination("I want to go to the restroom", nodes) == "restroom"
    assert parser.parse_destination("where is the washroom", nodes) == "restroom"

    # Cafeteria & Pantry variations
    assert parser.parse_destination("take me to the pantry", nodes) == "cafeteria"
    assert parser.parse_destination("head to the coffee machine", nodes) == "cafeteria"

    # Entrance
    assert parser.parse_destination("take me to the entrance", nodes) == "entrance"
    assert parser.parse_destination("front door", nodes) == "entrance"

def test_parse_unknown_destination(parser, graph):
    nodes = graph.get_all_nodes()
    # Unreachable or nonsensical destination
    assert parser.parse_destination("take me to the moon", nodes) is None
    assert parser.parse_destination("random gibberish xyz123", nodes) is None

def test_mock_tts_provider(tts):
    res = tts.speak("Walk straight toward the elevator.")
    assert res["status"] == "spoken"
    assert tts.get_last_spoken() == "Walk straight toward the elevator."
    assert len(tts.history) == 1

def test_audio_driven_navigation_lifecycle(graph, parser, tts):
    router = DijkstraRouter(graph)
    sm = NavigationStateMachine(graph, router)
    nodes = graph.get_all_nodes()

    # 1. Localize at entrance
    cue1 = sm.on_tag_observed(1)
    tts.speak(cue1)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert "Office Entrance" in tts.get_last_spoken()

    # 2. Spoken command
    user_speech = "Take me to Meeting Room B"
    dest_id = parser.parse_destination(user_speech, nodes)
    assert dest_id == "meeting_b"

    # 3. Route & Instruction
    cue2 = sm.request_destination(dest_id)
    tts.speak(cue2)
    assert sm.current_state == NavigationState.ROUTE_READY
    assert "Route found." in tts.get_last_spoken()

    # 4. Obstacle alert
    cue_obs = sm.on_obstacle_detected({"class": "chair", "position": "center"})
    tts.speak(cue_obs)
    assert "Caution: chair ahead. Move slightly left." == tts.get_last_spoken()

    # 5. Obstacle cleared
    cue_clear = sm.on_obstacle_cleared()
    tts.speak(cue_clear)
    assert "Path clear." in tts.get_last_spoken()

    # 6. Checkpoint tag reached (Tag 3 - Elevator)
    cue3 = sm.on_tag_observed(3)
    tts.speak(cue3)
    assert "Main Elevators reached." in tts.get_last_spoken()

    # 7. Destination arrival (Tag 12 - Meeting Room B)
    cue4 = sm.on_tag_observed(12)
    tts.speak(cue4)
    assert sm.current_state == NavigationState.DESTINATION_REACHED
    assert "You have arrived at Meeting Room B." == tts.get_last_spoken()
