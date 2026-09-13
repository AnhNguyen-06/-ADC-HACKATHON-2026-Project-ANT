from typing import Optional, Dict, Any
from backend.app.navigation.models import Node
from backend.app.navigation.graph import OfficeGraph
from backend.app.vision.detector import DetectedTag

class TagMapper:
    """Maps visual AprilTag detections to topological OfficeGraph nodes with debouncing."""

    def __init__(self, graph: OfficeGraph, debounce_frames: int = 1):
        self.graph = graph
        self.debounce_frames = debounce_frames
        self._last_detected_tag_id: Optional[int] = None
        self._consecutive_count: int = 0
        self._last_confirmed_node: Optional[Node] = None

    def process_detection(self, detected_tags: list[DetectedTag]) -> Optional[Node]:
        """Processes detections from current frame and returns confirmed Node or None."""
        if not detected_tags:
            self._consecutive_count = 0
            return None

        # Sort by tag size (largest marker is closest / highest signal)
        sorted_tags = sorted(detected_tags, key=lambda t: t.size_pixels, reverse=True)
        primary_tag = sorted_tags[0]

        if primary_tag.tag_id == self._last_detected_tag_id:
            self._consecutive_count += 1
        else:
            self._last_detected_tag_id = primary_tag.tag_id
            self._consecutive_count = 1

        if self._consecutive_count >= self.debounce_frames:
            node = self.graph.get_node_by_tag(primary_tag.tag_id)
            if node:
                self._last_confirmed_node = node
                return node
        
        return None

    def get_last_confirmed_node(self) -> Optional[Node]:
        return self._last_confirmed_node

    def reset(self):
        self._last_detected_tag_id = None
        self._consecutive_count = 0
        self._last_confirmed_node = None
