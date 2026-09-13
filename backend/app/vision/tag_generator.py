import cv2
import numpy as np
from pathlib import Path

def generate_apriltag_image(tag_id: int, size: int = 400, border_bits: int = 1) -> np.ndarray:
    """Generates an AprilTag 36h11 marker image using OpenCV aruco."""
    dictionary = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_APRILTAG_36h11)
    marker_img = cv2.aruco.generateImageMarker(dictionary, tag_id, size, borderBits=border_bits)
    # Add a white margin (quiet zone) around the marker
    margin = int(size * 0.2)
    bordered_img = cv2.copyMakeBorder(
        marker_img, margin, margin, margin, margin,
        cv2.BORDER_CONSTANT, value=255
    )
    return bordered_img

def save_tag_image(tag_id: int, output_path: str | Path, size: int = 400) -> Path:
    img = generate_apriltag_image(tag_id, size=size)
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), img)
    return path
