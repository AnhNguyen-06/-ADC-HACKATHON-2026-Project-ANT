from typing import List, Tuple, Optional, Dict, Any
import cv2
import numpy as np
from pydantic import BaseModel

class DetectedTag(BaseModel):
    tag_id: int
    corners: List[Tuple[float, float]]
    center: Tuple[float, float]
    size_pixels: float

class AprilTagDetector:
    def __init__(self, family: str = "tag36h11"):
        self.family = family
        self.dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_APRILTAG_36h11)
        self.params = cv2.aruco.DetectorParameters()
        self.params.cornerRefinementMethod = cv2.aruco.CORNER_REFINE_SUBPIX
        self.detector = cv2.aruco.ArucoDetector(self.dictionary, self.params)

    def detect(self, frame: np.ndarray) -> List[DetectedTag]:
        """Detects all AprilTag markers in the given frame."""
        if frame is None or frame.size == 0:
            return []

        # Convert to grayscale if necessary
        if len(frame.shape) == 3 and frame.shape[2] == 3:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        else:
            gray = frame

        corners, ids, rejected = self.detector.detectMarkers(gray)

        detections: List[DetectedTag] = []
        if ids is not None and len(ids) > 0:
            flat_ids = np.ravel(ids)
            for i in range(len(flat_ids)):
                tag_id = int(flat_ids[i])
                c = corners[i].reshape((-1, 2))  # Reshape to (4, 2)
                
                pts = [(float(pt[0]), float(pt[1])) for pt in c]
                cx = float(np.mean(c[:, 0]))
                cy = float(np.mean(c[:, 1]))
                
                width = np.linalg.norm(c[0] - c[1])
                height = np.linalg.norm(c[1] - c[2])
                size_pixels = float((width + height) / 2.0)

                detections.append(
                    DetectedTag(
                        tag_id=tag_id,
                        corners=pts,
                        center=(cx, cy),
                        size_pixels=size_pixels
                    )
                )

        return detections

    def draw_detections(self, frame: np.ndarray, detections: List[DetectedTag]) -> np.ndarray:
        """Annotates frame with bounding boxes and tag IDs for developer/judge visualization."""
        annotated = frame.copy()
        for det in detections:
            pts = np.array(det.corners, dtype=np.int32).reshape((-1, 1, 2))
            cv2.polylines(annotated, [pts], isClosed=True, color=(0, 255, 0), thickness=2)
            
            cx, cy = int(det.center[0]), int(det.center[1])
            cv2.circle(annotated, (cx, cy), radius=4, color=(0, 0, 255), thickness=-1)
            
            label = f"Tag #{det.tag_id}"
            cv2.putText(
                annotated,
                label,
                (int(det.corners[0][0]), int(det.corners[0][1]) - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2,
                cv2.LINE_AA
            )
        return annotated
