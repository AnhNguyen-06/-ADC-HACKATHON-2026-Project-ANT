from enum import Enum
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field

class LocationType(str, Enum):
    ENTRANCE = "entrance"
    CHECKPOINT = "checkpoint"
    CORRIDOR = "corridor"
    JUNCTION = "junction"
    ELEVATOR = "elevator"
    MEETING_ROOM = "meeting_room"
    RESTROOM = "restroom"
    PANTRY = "pantry"

class Direction(str, Enum):
    FORWARD = "forward"
    SLIGHT_LEFT = "slight_left"
    SLIGHT_RIGHT = "slight_right"
    LEFT = "left"
    RIGHT = "right"
    U_TURN = "u_turn"
    ARRIVE = "arrive"

class Node(BaseModel):
    id: str
    name: str
    type: LocationType
    floor: int = 1
    coordinates: Tuple[float, float] = (0.0, 0.0)
    tag_id: Optional[int] = None
    landmarks: List[str] = Field(default_factory=list)

class Edge(BaseModel):
    from_node: str
    to_node: str
    distance: float  # In meters
    direction: Direction = Direction.FORWARD
    landmark: Optional[str] = None
    accessible: bool = True
    instruction: str
    blocked: bool = False

class OfficeMap(BaseModel):
    name: str
    floor: int = 1
    nodes: List[Node]
    edges: List[Edge]

class RouteStep(BaseModel):
    from_node: Node
    to_node: Node
    edge: Edge
    cumulative_distance: float

class Route(BaseModel):
    origin: Node
    destination: Node
    steps: List[RouteStep]
    total_distance: float
    nodes: List[Node]
