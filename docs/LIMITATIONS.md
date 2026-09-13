# Technical Limitations & Boundaries — Project ANT

This document transparently specifies the known physical, computational, and environmental limitations of the ANT hackathon prototype.

---

## 1. Computer Vision & AprilTag Detection
- **Lighting Sensitivity**: AprilTag detection degrades under extreme glare, deep shadows, or low-light conditions (< 50 lux).
- **Viewing Angle & Range**: AprilTags must be within approximately 0.5m to 4.5m of the camera lens and within 45 degrees of the optical axis.
- **Occlusion**: Fully covered or occluded tags cannot be resolved; system falls back to STALE/UNKNOWN state.

---

## 2. Obstacle Detection & Proximity
- **Qualitative Proximity**: Without dedicated stereo or LiDAR hardware, monocular bounding box estimation provides qualitative proximity ("near", "ahead"), not millimeter-grade depth.
- **Class Coverage**: The prototype object detector is trained/configured for typical indoor objects (chairs, people, boxes, tables, doors); novel obstacles (e.g. low-hanging cords or floor puddles) are not detected.

---

## 3. Floorplan & Topology
- **Single-Floor Topology (MVP)**: The MVP supports single-floor planar navigation. Multi-floor elevator floor tracking and staircase navigation are future roadmap extensions.
