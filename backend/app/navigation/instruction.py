from typing import Optional
from backend.app.navigation.models import RouteStep, Node, Direction

class InstructionGenerator:
    """Generates short, directive, highly accessible verbal cues without false precision."""

    @staticmethod
    def announce_location(node: Node) -> str:
        return f"You are at {node.name}."

    @staticmethod
    def announce_route_found(destination: Node) -> str:
        return f"Route found to {destination.name}."

    @staticmethod
    def announce_arrival(destination: Node) -> str:
        return f"You have arrived at {destination.name}."

    @staticmethod
    def announce_checkpoint(node: Node, next_step: Optional[RouteStep] = None) -> str:
        base = f"{node.name} reached."
        if next_step:
            cue = InstructionGenerator.format_step(next_step)
            return f"{base} {cue}"
        return base

    @staticmethod
    def format_step(step: RouteStep) -> str:
        edge = step.edge
        direction_phrase = {
            Direction.FORWARD: "Walk straight",
            Direction.SLIGHT_LEFT: "Bear slightly left",
            Direction.SLIGHT_RIGHT: "Bear slightly right",
            Direction.LEFT: "Turn left",
            Direction.RIGHT: "Turn right",
            Direction.U_TURN: "Turn around",
            Direction.ARRIVE: "Step forward"
        }.get(edge.direction, "Proceed")

        target_name = step.to_node.name
        if edge.landmark:
            clean_landmark = edge.landmark.replace("_", " ")
            return f"{direction_phrase} toward the {clean_landmark}."
        return f"{direction_phrase} toward {target_name}."

    @staticmethod
    def format_obstacle_warning(position: str = "center", object_class: str = "obstacle") -> str:
        clean_obj = object_class.replace("_", " ")
        if position == "center":
            return f"Caution: {clean_obj} ahead. Move slightly left."
        elif position == "left":
            return f"Caution: {clean_obj} on your left. Keep right."
        elif position == "right":
            return f"Caution: {clean_obj} on your right. Keep left."
        return f"Caution: {clean_obj} nearby."

    @staticmethod
    def announce_rerouting() -> str:
        return "The usual route is blocked. Recalculating alternative route."

    @staticmethod
    def announce_destination_unknown(raw_text: str) -> str:
        return f"I could not find destination '{raw_text}'."

    @staticmethod
    def announce_location_unknown() -> str:
        return "I cannot determine your location. Please point your camera ahead."
