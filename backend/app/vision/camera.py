from abc import ABC, abstractmethod
from typing import Optional, List
import cv2
import numpy as np

class CameraProvider(ABC):
    @abstractmethod
    def get_frame(self) -> Optional[np.ndarray]:
        """Returns BGR image frame or None if unavailable."""
        pass

    @abstractmethod
    def is_opened(self) -> bool:
        pass

    @abstractmethod
    def release(self):
        pass

class LiveCameraProvider(CameraProvider):
    def __init__(self, device_index: int = 0):
        self.device_index = device_index
        self.cap: Optional[cv2.VideoCapture] = None
        self._init_camera()

    def _init_camera(self):
        try:
            self.cap = cv2.VideoCapture(self.device_index)
            if self.cap.isOpened():
                self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        except Exception:
            self.cap = None

    def get_frame(self) -> Optional[np.ndarray]:
        if not self.is_opened():
            return None
        ret, frame = self.cap.read()
        return frame if ret else None

    def is_opened(self) -> bool:
        return self.cap is not None and self.cap.isOpened()

    def release(self):
        if self.cap:
            self.cap.release()
            self.cap = None

class SyntheticCameraProvider(CameraProvider):
    """Feeds pre-configured synthetic frames or a looped frame sequence."""
    def __init__(self, frames: Optional[List[np.ndarray]] = None):
        self.frames = frames or []
        self.index = 0
        self.opened = True

    def set_frames(self, frames: List[np.ndarray]):
        self.frames = frames
        self.index = 0

    def add_frame(self, frame: np.ndarray):
        self.frames.append(frame)

    def get_frame(self) -> Optional[np.ndarray]:
        if not self.opened or not self.frames:
            # Generate blank 640x480 gray frame if no frames provided
            return np.ones((480, 640, 3), dtype=np.uint8) * 128
        frame = self.frames[self.index % len(self.frames)]
        self.index += 1
        return frame

    def is_opened(self) -> bool:
        return self.opened

    def release(self):
        self.opened = False
