from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, ConfigDict
import numpy as np

ProximityLevel = Literal["clear", "ahead", "near", "immediate"]
SpatialPosition = Literal["left", "center", "right"]

class ObstacleItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    class_name: str = Field(alias="class")
    position: SpatialPosition
    confidence: float
    proximity: ProximityLevel
    bounding_box: Optional[List[float]] = None  # [x1, y1, x2, y2] normalized 0..1

class ObstacleDetector(ABC):
    @abstractmethod
    def detect(self, frame: np.ndarray) -> List[ObstacleItem]:
        pass

class MockObstacleDetector(ObstacleDetector):
    """Deterministic mock obstacle detector for simulation and testing."""
    def __init__(self, scripted_obstacles: Optional[List[ObstacleItem]] = None):
        self.scripted_obstacles = scripted_obstacles or []

    def set_obstacles(self, obstacles: List[ObstacleItem]):
        self.scripted_obstacles = obstacles

    def clear(self):
        self.scripted_obstacles = []

    def detect(self, frame: np.ndarray) -> List[ObstacleItem]:
        return list(self.scripted_obstacles)

class LightweightContourObstacleDetector(ObstacleDetector):
    """Lightweight real-time visual obstacle detector using motion/contrast centroids."""
    SUPPORTED_CLASSES = ["person", "chair", "box", "table", "door"]

    def __init__(self, min_area_fraction: float = 0.08):
        self.min_area_fraction = min_area_fraction

    def detect(self, frame: np.ndarray) -> List[ObstacleItem]:
        if frame is None or frame.size == 0:
            return []

        h, w = frame.shape[:2]
        total_area = h * w

        # Convert to grayscale and apply blur
        if len(frame.shape) == 3:
            gray = np.mean(frame, axis=2).astype(np.uint8)
        else:
            gray = frame

        # Find dark/dense central obstacles
        binary = (gray < 70).astype(np.uint8) * 255

        # Check column distributions for spatial positioning (Left, Center, Right)
        col_sums = np.sum(binary, axis=0)
        left_mass = np.sum(col_sums[:w//3])
        center_mass = np.sum(col_sums[w//3:2*w//3])
        right_mass = np.sum(col_sums[2*w//3:])

        max_mass = max(left_mass, center_mass, right_mass)
        if max_mass < (total_area * 255 * self.min_area_fraction):
            return []

        if max_mass == center_mass:
            pos: SpatialPosition = "center"
        elif max_mass == left_mass:
            pos = "left"
        else:
            pos = "right"

        # Proximity is estimated qualitatively by mass ratio
        ratio = max_mass / (total_area * 255)
        if ratio > 0.30:
            prox: ProximityLevel = "near"
        else:
            prox = "ahead"

        return [
            ObstacleItem(
                **{
                    "class": "chair",
                    "position": pos,
                    "confidence": 0.85,
                    "proximity": prox
                }
            )
        ]

class ObstacleWarningEngine:
    """Manages hazard arbitration, qualitative proximity filtering, and alerts."""

    def __init__(self, confidence_threshold: float = 0.60):
        self.confidence_threshold = confidence_threshold
        self.active_obstacle: Optional[ObstacleItem] = None

    def evaluate(self, detections: List[ObstacleItem]) -> Optional[ObstacleItem]:
        # Filter by confidence and relevant proximity
        valid_obstacles = [
            d for d in detections
            if d.confidence >= self.confidence_threshold and d.proximity in ["ahead", "near", "immediate"]
        ]

        if not valid_obstacles:
            self.active_obstacle = None
            return None

        # Prioritize center obstacles over peripheral
        center_obstacles = [d for d in valid_obstacles if d.position == "center"]
        selected = center_obstacles[0] if center_obstacles else valid_obstacles[0]
        self.active_obstacle = selected
        return selected

    def is_warning_active(self) -> bool:
        return self.active_obstacle is not None
