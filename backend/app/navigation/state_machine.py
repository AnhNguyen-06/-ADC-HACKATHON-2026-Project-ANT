from enum import Enum
from typing import Optional, List, Dict, Any
from backend.app.navigation.models import Node, Route, RouteStep
from backend.app.navigation.graph import OfficeGraph
from backend.app.navigation.dijkstra import DijkstraRouter, NoPathFoundError
from backend.app.navigation.instruction import InstructionGenerator

class NavigationState(str, Enum):
    UNKNOWN = "UNKNOWN"
    AT_CHECKPOINT = "AT_CHECKPOINT"
    ROUTE_READY = "ROUTE_READY"
    MOVING = "MOVING"
    APPROACHING_CHECKPOINT = "APPROACHING_CHECKPOINT"
    OBSTACLE_WARNING = "OBSTACLE_WARNING"
    REROUTING = "REROUTING"
    DESTINATION_REACHED = "DESTINATION_REACHED"
    ERROR = "ERROR"

class NavigationStateMachine:
    def __init__(self, graph: OfficeGraph, router: DijkstraRouter):
        self.graph = graph
        self.router = router
        self.current_state: NavigationState = NavigationState.UNKNOWN
        self.current_node: Optional[Node] = None
        self.destination_node: Optional[Node] = None
        self.active_route: Optional[Route] = None
        self.current_step_index: int = 0
        self.last_instruction: str = "Navigation initialized. Awaiting destination."
        self.active_obstacle: Optional[Dict[str, Any]] = None
        self.error_message: Optional[str] = None

    def get_snapshot(self) -> Dict[str, Any]:
        return {
            "state": self.current_state.value,
            "current_location": self.current_node.model_dump() if self.current_node else None,
            "destination": self.destination_node.model_dump() if self.destination_node else None,
            "current_step_index": self.current_step_index,
            "total_steps": len(self.active_route.steps) if self.active_route else 0,
            "last_instruction": self.last_instruction,
            "has_active_route": self.active_route is not None,
            "active_obstacle": self.active_obstacle,
            "error_message": self.error_message
        }

    def set_current_location(self, node: Node) -> str:
        self.current_node = node
        if self.destination_node and self.destination_node.id == node.id:
            self.current_state = NavigationState.DESTINATION_REACHED
            self.last_instruction = InstructionGenerator.announce_arrival(node)
            return self.last_instruction

        if self.current_state == NavigationState.UNKNOWN:
            self.current_state = NavigationState.AT_CHECKPOINT

        self.last_instruction = InstructionGenerator.announce_location(node)
        return self.last_instruction

    def request_destination(self, destination_id: str) -> str:
        try:
            dest_node = self.graph.get_node(destination_id)
        except Exception:
            self.current_state = NavigationState.ERROR
            self.error_message = f"Unknown destination: {destination_id}"
            self.last_instruction = InstructionGenerator.announce_destination_unknown(destination_id)
            return self.last_instruction

        self.destination_node = dest_node

        if self.current_node is None:
            # Need localization first
            self.last_instruction = f"Destination set to {dest_node.name}. Please show your surroundings to identify current location."
            return self.last_instruction

        # If already at destination
        if self.current_node.id == dest_node.id:
            self.current_state = NavigationState.DESTINATION_REACHED
            self.last_instruction = InstructionGenerator.announce_arrival(dest_node)
            return self.last_instruction

        # Calculate route
        return self._calculate_and_start_route()

    def _calculate_and_start_route(self) -> str:
        if not self.current_node or not self.destination_node:
            self.current_state = NavigationState.ERROR
            self.error_message = "Cannot route: current node or destination missing."
            return self.error_message

        try:
            route = self.router.find_route(
                start_id=self.current_node.id,
                destination_id=self.destination_node.id,
                accessible_only=True
            )
            self.active_route = route
            self.current_step_index = 0
            self.current_state = NavigationState.ROUTE_READY
            
            first_step = route.steps[0]
            step_instruction = InstructionGenerator.format_step(first_step)
            self.last_instruction = f"Route found. {step_instruction}"
            return self.last_instruction

        except NoPathFoundError:
            self.current_state = NavigationState.ERROR
            self.error_message = f"No path found to {self.destination_node.name}."
            self.last_instruction = self.error_message
            return self.last_instruction

    def on_tag_observed(self, tag_id: int) -> str:
        node = self.graph.get_node_by_tag(tag_id)
        if not node:
            # Unknown tag - do not crash, announce or ignore
            return "Unrecognized landmark tag observed."

        # If we didn't know where we were
        if not self.current_node:
            self.current_node = node
            if self.destination_node:
                return self._calculate_and_start_route()
            else:
                self.current_state = NavigationState.AT_CHECKPOINT
                self.last_instruction = InstructionGenerator.announce_location(node)
                return self.last_instruction

        # If arrived at destination tag
        if self.destination_node and node.id == self.destination_node.id:
            self.current_node = node
            self.current_state = NavigationState.DESTINATION_REACHED
            self.last_instruction = InstructionGenerator.announce_arrival(node)
            return self.last_instruction

        # Check if this matches upcoming step in active route
        if self.active_route and self.current_step_index < len(self.active_route.steps):
            expected_step = self.active_route.steps[self.current_step_index]
            if node.id == expected_step.to_node.id:
                # Checkpoint reached!
                self.current_node = node
                self.current_step_index += 1
                self.current_state = NavigationState.AT_CHECKPOINT

                if self.current_step_index < len(self.active_route.steps):
                    next_step = self.active_route.steps[self.current_step_index]
                    self.last_instruction = InstructionGenerator.announce_checkpoint(node, next_step)
                else:
                    self.current_state = NavigationState.DESTINATION_REACHED
                    self.last_instruction = InstructionGenerator.announce_arrival(node)

                return self.last_instruction

        # Observed a different valid node along the path or nearby
        self.current_node = node
        self.last_instruction = InstructionGenerator.announce_location(node)
        return self.last_instruction

    def on_obstacle_detected(self, obstacle_info: Dict[str, Any]) -> str:
        self.active_obstacle = obstacle_info
        self.current_state = NavigationState.OBSTACLE_WARNING
        obj_class = obstacle_info.get("class", "obstacle")
        position = obstacle_info.get("position", "center")
        self.last_instruction = InstructionGenerator.format_obstacle_warning(position, obj_class)
        return self.last_instruction

    def on_obstacle_cleared(self) -> str:
        self.active_obstacle = None
        if self.active_route:
            if self.current_step_index < len(self.active_route.steps):
                self.current_state = NavigationState.MOVING
                next_step = self.active_route.steps[self.current_step_index]
                self.last_instruction = f"Path clear. {InstructionGenerator.format_step(next_step)}"
            else:
                self.current_state = NavigationState.DESTINATION_REACHED
                self.last_instruction = "Path clear. You have reached your destination."
        else:
            self.current_state = NavigationState.AT_CHECKPOINT if self.current_node else NavigationState.UNKNOWN
            self.last_instruction = "Path clear."
        return self.last_instruction

    def trigger_reroute(self, blocked_from_id: str, blocked_to_id: str) -> str:
        self.graph.set_edge_blocked(blocked_from_id, blocked_to_id, blocked=True)
        self.current_state = NavigationState.REROUTING
        
        if not self.current_node or not self.destination_node:
            self.current_state = NavigationState.ERROR
            self.error_message = "Cannot reroute: missing current or destination location."
            return self.error_message

        try:
            new_route = self.router.find_route(
                start_id=self.current_node.id,
                destination_id=self.destination_node.id,
                accessible_only=True
            )
            self.active_route = new_route
            self.current_step_index = 0
            self.current_state = NavigationState.ROUTE_READY
            
            first_step = new_route.steps[0]
            step_cue = InstructionGenerator.format_step(first_step)
            self.last_instruction = f"Route blocked. Alternative route found. {step_cue}"
            return self.last_instruction
        except NoPathFoundError:
            self.current_state = NavigationState.ERROR
            self.error_message = "All alternative routes are currently blocked."
            self.last_instruction = self.error_message
            return self.last_instruction

    def reset(self):
        self.current_state = NavigationState.UNKNOWN
        self.current_node = None
        self.destination_node = None
        self.active_route = None
        self.current_step_index = 0
        self.active_obstacle = None
        self.error_message = None
        self.last_instruction = "Navigation reset."
