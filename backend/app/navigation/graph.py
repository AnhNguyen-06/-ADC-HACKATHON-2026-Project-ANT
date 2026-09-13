import json
from pathlib import Path
from typing import Dict, List, Optional
from backend.app.navigation.models import OfficeMap, Node, Edge

class GraphValidationError(Exception):
    pass

class NodeNotFoundError(Exception):
    pass

class OfficeGraph:
    def __init__(self, office_map: OfficeMap):
        self.office_map = office_map
        self._nodes_by_id: Dict[str, Node] = {}
        self._nodes_by_tag: Dict[int, Node] = {}
        self._adjacency: Dict[str, List[Edge]] = {}
        self._validate_and_index()

    def _validate_and_index(self):
        # Index nodes
        for node in self.office_map.nodes:
            if node.id in self._nodes_by_id:
                raise GraphValidationError(f"Duplicate node id detected: {node.id}")
            self._nodes_by_id[node.id] = node
            
            if node.tag_id is not None:
                if node.tag_id in self._nodes_by_tag:
                    raise GraphValidationError(f"Duplicate tag_id {node.tag_id} detected on node {node.id}")
                self._nodes_by_tag[node.tag_id] = node
                
            self._adjacency[node.id] = []

        # Validate and index edges
        for edge in self.office_map.edges:
            if edge.from_node not in self._nodes_by_id:
                raise GraphValidationError(f"Edge references non-existent from_node: {edge.from_node}")
            if edge.to_node not in self._nodes_by_id:
                raise GraphValidationError(f"Edge references non-existent to_node: {edge.to_node}")
            if edge.distance <= 0:
                raise GraphValidationError(f"Edge distance must be positive: {edge.distance}")
            self._adjacency[edge.from_node].append(edge)

    def get_node(self, node_id: str) -> Node:
        if node_id not in self._nodes_by_id:
            raise NodeNotFoundError(f"Node id '{node_id}' not found in office graph.")
        return self._nodes_by_id[node_id]

    def get_node_by_tag(self, tag_id: int) -> Optional[Node]:
        return self._nodes_by_tag.get(tag_id)

    def get_all_nodes(self) -> List[Node]:
        return list(self.office_map.nodes)

    def get_edges_from(self, node_id: str) -> List[Edge]:
        if node_id not in self._adjacency:
            raise NodeNotFoundError(f"Node id '{node_id}' not found in office graph.")
        return self._adjacency[node_id]

    def get_edge(self, from_id: str, to_id: str) -> Optional[Edge]:
        for edge in self.get_edges_from(from_id):
            if edge.to_node == to_id:
                return edge
        return None

    def set_edge_blocked(self, from_id: str, to_id: str, blocked: bool = True) -> bool:
        """Dynamically block/unblock an edge to support rerouting."""
        updated = False
        for edge in self.get_edges_from(from_id):
            if edge.to_node == to_id:
                edge.blocked = blocked
                updated = True
        return updated

    @classmethod
    def from_json_file(cls, filepath: str | Path) -> "OfficeGraph":
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Graph file not found: {path}")
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        office_map = OfficeMap(**data)
        return cls(office_map)
