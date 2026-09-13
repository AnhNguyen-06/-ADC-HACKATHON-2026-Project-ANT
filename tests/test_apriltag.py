import pytest
import numpy as np
from pathlib import Path
import cv2

from backend.app.vision.tag_generator import generate_apriltag_image
from backend.app.vision.detector import AprilTagDetector
from backend.app.vision.camera import SyntheticCameraProvider
from backend.app.vision.mapper import TagMapper
from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
MAP_PATH = WORKSPACE_ROOT / "backend" / "data" / "office_map.json"

@pytest.fixture
def detector():
    return AprilTagDetector()

@pytest.fixture
def graph():
    return OfficeGraph.from_json_file(MAP_PATH)

def test_detect_generated_apriltag(detector):
    # Generate tag 1 (Entrance)
    tag1_img = generate_apriltag_image(tag_id=1, size=300)
    detections = detector.detect(tag1_img)
    
    assert len(detections) == 1
    assert detections[0].tag_id == 1
    assert len(detections[0].corners) == 4
    assert detections[0].center[0] > 0
    assert detections[0].center[1] > 0

def test_detect_multiple_tags(detector):
    tag1 = generate_apriltag_image(tag_id=2, size=150)
    tag2 = generate_apriltag_image(tag_id=12, size=150)
    
    # Create composite frame with both tags side by side
    composite = np.ones((300, 600, 3), dtype=np.uint8) * 255
    h1, w1 = tag1.shape[:2]
    h2, w2 = tag2.shape[:2]
    
    # Ensure 3 channels
    if len(tag1.shape) == 2:
        tag1 = cv2.cvtColor(tag1, cv2.COLOR_GRAY2BGR)
    if len(tag2.shape) == 2:
        tag2 = cv2.cvtColor(tag2, cv2.COLOR_GRAY2BGR)

    composite[50:50+h1, 50:50+w1] = tag1
    composite[50:50+h2, 350:350+w2] = tag2

    detections = detector.detect(composite)
    tag_ids = {d.tag_id for d in detections}
    assert 2 in tag_ids
    assert 12 in tag_ids

def test_blank_frame_produces_zero_detections(detector):
    blank = np.ones((480, 640, 3), dtype=np.uint8) * 255
    detections = detector.detect(blank)
    assert len(detections) == 0

def test_tag_mapper_resolution(graph, detector):
    mapper = TagMapper(graph, debounce_frames=1)
    tag1_img = generate_apriltag_image(tag_id=1, size=300)
    detections = detector.detect(tag1_img)
    
    node = mapper.process_detection(detections)
    assert node is not None
    assert node.id == "entrance"
    assert node.name == "Office Entrance"

def test_end_to_end_vision_to_state_transition(graph, detector):
    router = DijkstraRouter(graph)
    sm = NavigationStateMachine(graph, router)
    mapper = TagMapper(graph)

    # Frame 1: Camera sees Entrance Tag 1
    tag1_img = generate_apriltag_image(tag_id=1, size=300)
    dets1 = detector.detect(tag1_img)
    node1 = mapper.process_detection(dets1)
    assert node1 is not None

    cue1 = sm.on_tag_observed(node1.tag_id)
    assert sm.current_state == NavigationState.AT_CHECKPOINT
    assert sm.current_node.id == "entrance"
    assert "Office Entrance" in cue1

    # User requests Meeting Room B
    sm.request_destination("meeting_b")
    assert sm.current_state == NavigationState.ROUTE_READY

    # Frame 2: Camera sees Elevator Tag 3
    tag3_img = generate_apriltag_image(tag_id=3, size=300)
    dets3 = detector.detect(tag3_img)
    node3 = mapper.process_detection(dets3)
    cue2 = sm.on_tag_observed(node3.tag_id)
    assert "Main Elevators reached." in cue2

    # Frame 3: Camera sees Meeting Room B Tag 12
    tag12_img = generate_apriltag_image(tag_id=12, size=300)
    dets12 = detector.detect(tag12_img)
    node12 = mapper.process_detection(dets12)
    cue3 = sm.on_tag_observed(node12.tag_id)
    assert sm.current_state == NavigationState.DESTINATION_REACHED
    assert "You have arrived at Meeting Room B." == cue3

def test_draw_detections_annotation(detector):
    tag_img = generate_apriltag_image(tag_id=1, size=200)
    if len(tag_img.shape) == 2:
        tag_img = cv2.cvtColor(tag_img, cv2.COLOR_GRAY2BGR)
    detections = detector.detect(tag_img)
    annotated = detector.draw_detections(tag_img, detections)
    assert annotated.shape == tag_img.shape
