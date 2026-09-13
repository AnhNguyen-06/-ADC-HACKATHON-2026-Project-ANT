from typing import Optional, Dict, Any, List
import numpy as np
from pathlib import Path
import base64
import cv2

from backend.app.navigation.models import OfficeMap, Node, Route
from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter
from backend.app.navigation.state_machine import NavigationStateMachine, NavigationState
from backend.app.vision.detector import AprilTagDetector, DetectedTag
from backend.app.vision.mapper import TagMapper
from backend.app.vision.obstacle import ObstacleDetector, MockObstacleDetector, ObstacleWarningEngine, ObstacleItem
from backend.app.audio.service import NaturalLanguageDestinationParser, MockTTSProvider

class NavigationService:
    """Unified coordinator connecting vision, routing, perception, audio, and state machine."""

    def __init__(self, map_path: str | Path):
        self.graph = OfficeGraph.from_json_file(map_path)
        self.router = DijkstraRouter(self.graph)
        self.state_machine = NavigationStateMachine(self.graph, self.router)
        self.tag_detector = AprilTagDetector()
        self.tag_mapper = TagMapper(self.graph)
        self.obstacle_detector: ObstacleDetector = MockObstacleDetector()
        self.warning_engine = ObstacleWarningEngine(confidence_threshold=0.60)
        self.voice_parser = NaturalLanguageDestinationParser()
        self.tts = MockTTSProvider()

    def process_voice_command(self, transcript: str) -> Dict[str, Any]:
        """Processes speech transcript, sets destination, and returns updated telemetry."""
        candidate_nodes = self.graph.get_all_nodes()
        dest_id = self.voice_parser.parse_destination(transcript, candidate_nodes)

        if not dest_id:
            spoken_cue = f"I could not find destination for '{transcript}'."
            self.state_machine.current_state = NavigationState.ERROR
            self.state_machine.error_message = spoken_cue
            self.state_machine.last_instruction = spoken_cue
            self.tts.speak(spoken_cue)
            return self.get_telemetry(spoken_cue=spoken_cue)

        spoken_cue = self.state_machine.request_destination(dest_id)
        self.tts.speak(spoken_cue)
        return self.get_telemetry(spoken_cue=spoken_cue)

    def process_destination_id(self, destination_id: str) -> Dict[str, Any]:
        spoken_cue = self.state_machine.request_destination(destination_id)
        self.tts.speak(spoken_cue)
        return self.get_telemetry(spoken_cue=spoken_cue)

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Processes single camera frame for AprilTags and obstacles."""
        if frame is None or frame.size == 0:
            return self.get_telemetry()

        # 1. AprilTag Landmark Detection
        detected_tags = self.tag_detector.detect(frame)
        tag_node = self.tag_mapper.process_detection(detected_tags)
        
        spoken_cue: Optional[str] = None
        if tag_node:
            spoken_cue = self.state_machine.on_tag_observed(tag_node.tag_id)
            if spoken_cue:
                self.tts.speak(spoken_cue)

        # 2. Obstacle Detection
        obstacle_detections = self.obstacle_detector.detect(frame)
        active_hazard = self.warning_engine.evaluate(obstacle_detections)

        if active_hazard:
            obs_cue = self.state_machine.on_obstacle_detected({
                "class": active_hazard.class_name,
                "position": active_hazard.position,
                "proximity": active_hazard.proximity,
                "confidence": active_hazard.confidence
            })
            if obs_cue != spoken_cue:
                spoken_cue = obs_cue
                self.tts.speak(spoken_cue)
        else:
            if self.state_machine.current_state == NavigationState.OBSTACLE_WARNING:
                clear_cue = self.state_machine.on_obstacle_cleared()
                spoken_cue = clear_cue
                self.tts.speak(spoken_cue)

        return self.get_telemetry(
            spoken_cue=spoken_cue,
            detected_tags=[t.model_dump() for t in detected_tags]
        )

    def process_base64_frame(self, b64_str: str) -> Dict[str, Any]:
        """Decodes JPEG/PNG base64 frame from client canvas/webcam and processes it."""
        try:
            if "," in b64_str:
                b64_str = b64_str.split(",", 1)[1]
            data = base64.b64decode(b64_str)
            np_arr = np.frombuffer(data, dtype=np.uint8)
            frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            return self.process_frame(frame)
        except Exception as e:
            return self.get_telemetry(error=f"Frame decode error: {str(e)}")

    def trigger_obstacle_simulation(self, class_name: str = "chair", position: str = "center") -> Dict[str, Any]:
        """Simulates visual obstacle for deterministic testing/demo."""
        hazard = ObstacleItem(
            **{
                "class": class_name,
                "position": position,
                "confidence": 0.95,
                "proximity": "near"
            }
        )
        if isinstance(self.obstacle_detector, MockObstacleDetector):
            self.obstacle_detector.set_obstacles([hazard])
        
        spoken_cue = self.state_machine.on_obstacle_detected({
            "class": class_name,
            "position": position,
            "proximity": "near",
            "confidence": 0.95
        })
        self.tts.speak(spoken_cue)
        return self.get_telemetry(spoken_cue=spoken_cue)

    def clear_obstacle_simulation(self) -> Dict[str, Any]:
        if isinstance(self.obstacle_detector, MockObstacleDetector):
            self.obstacle_detector.clear()
        spoken_cue = self.state_machine.on_obstacle_cleared()
        self.tts.speak(spoken_cue)
        return self.get_telemetry(spoken_cue=spoken_cue)

    def simulate_tag_observed(self, tag_id: int) -> Dict[str, Any]:
        spoken_cue = self.state_machine.on_tag_observed(tag_id)
        self.tts.speak(spoken_cue)
        return self.get_telemetry(spoken_cue=spoken_cue)

    def get_telemetry(
        self,
        spoken_cue: Optional[str] = None,
        detected_tags: Optional[List[Dict[str, Any]]] = None,
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        snapshot = self.state_machine.get_snapshot()
        route_dump = self.state_machine.active_route.model_dump() if self.state_machine.active_route else None
        
        return {
            "type": "telemetry",
            "state": snapshot["state"],
            "current_location": snapshot["current_location"],
            "destination": snapshot["destination"],
            "current_step_index": snapshot["current_step_index"],
            "total_steps": snapshot["total_steps"],
            "instruction": snapshot["last_instruction"],
            "spoken_cue": spoken_cue,
            "has_active_route": snapshot["has_active_route"],
            "active_obstacle": snapshot["active_obstacle"],
            "detected_tags": detected_tags or [],
            "route": route_dump,
            "error_message": error or snapshot["error_message"]
        }

    def reset(self) -> Dict[str, Any]:
        self.state_machine.reset()
        self.tag_mapper.reset()
        self.warning_engine.evaluate([])
        if isinstance(self.obstacle_detector, MockObstacleDetector):
            self.obstacle_detector.clear()
        self.tts.clear()
        return self.get_telemetry(spoken_cue="Navigation reset.")
