import pytest
from backend.app.vision.obstacle import (
    ObstacleItem,
    MockObstacleDetector,
    ObstacleWarningEngine,
    LightweightContourObstacleDetector
)
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState
from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter
from pathlib import Path
import numpy as np

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def warning_engine():
    return ObstacleWarningEngine(confidence_threshold=0.60)

def test_mock_obstacle_detector():
    detector = MockObstacleDetector()
    assert len(detector.detect(np.zeros((10, 10)))) == 0

    item = ObstacleItem(**{"class": "chair", "position": "center", "confidence": 0.91, "proximity": "near"})
    detector.set_obstacles([item])
    dets = detector.detect(np.zeros((10, 10)))
    assert len(dets) == 1
    assert dets[0].class_name == "chair"
    assert dets[0].position == "center"

def test_warning_engine_center_priority(warning_engine):
    side_item = ObstacleItem(**{"class": "box", "position": "left", "confidence": 0.85, "proximity": "near"})
    center_item = ObstacleItem(**{"class": "chair", "position": "center", "confidence": 0.88, "proximity": "ahead"})

    # Side obstacle alone
    warn1 = warning_engine.evaluate([side_item])
    assert warn1 is not None
    assert warn1.class_name == "box"

    # When both center and side exist, center is prioritized
    warn2 = warning_engine.evaluate([side_item, center_item])
    assert warn2 is not None
    assert warn2.class_name == "chair"
    assert warn2.position == "center"

def test_warning_engine_filters_low_confidence(warning_engine):
    low_conf = ObstacleItem(**{"class": "person", "position": "center", "confidence": 0.45, "proximity": "near"})
    warn = warning_engine.evaluate([low_conf])
    assert warn is None
    assert not warning_engine.is_warning_active()

def test_warning_engine_cleared_state(warning_engine):
    item = ObstacleItem(**{"class": "chair", "position": "center", "confidence": 0.9, "proximity": "near"})
    warning_engine.evaluate([item])
    assert warning_engine.is_warning_active()

    # Clear
    warning_engine.evaluate([])
    assert not warning_engine.is_warning_active()

def test_obstacle_to_state_machine_integration(warning_engine):
    graph = OfficeGraph.from_json_file(MAP_PATH)
    router = DijkstraRouter(graph)
    sm = NavigationStateMachine(graph, router)

    sm.on_tag_observed(1)
    sm.request_destination("meeting_b")
    assert sm.current_state == NavigationState.ROUTE_READY

    # Obstacle appears
    item = ObstacleItem(**{"class": "chair", "position": "center", "confidence": 0.95, "proximity": "near"})
    active = warning_engine.evaluate([item])
    assert active is not None

    cue = sm.on_obstacle_detected({"class": active.class_name, "position": active.position})
    assert sm.current_state == NavigationState.OBSTACLE_WARNING
    assert "Caution: chair ahead. Move slightly left." == cue

    # Obstacle disappears
    warning_engine.evaluate([])
    clear_cue = sm.on_obstacle_cleared()
    assert sm.current_state == NavigationState.MOVING
    assert "Path clear." in clear_cue
