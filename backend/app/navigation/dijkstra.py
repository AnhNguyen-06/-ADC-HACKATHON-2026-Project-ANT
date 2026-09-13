import heapq
from typing import Dict, List, Optional, Tuple
from backend.app.navigation.models import Route, RouteStep, Node, Edge
from backend.app.navigation.graph import OfficeGraph, NodeNotFoundError

class NoPathFoundError(Exception):
    pass

class DijkstraRouter:
    def __init__(self, graph: OfficeGraph):
        self.graph = graph

    def find_route(
        self,
        start_id: str,
        destination_id: str,
        accessible_only: bool = True
    ) -> Route:
        start_node = self.graph.get_node(start_id)
        dest_node = self.graph.get_node(destination_id)

        # Trivial case: already at destination
        if start_id == destination_id:
            return Route(
                origin=start_node,
                destination=dest_node,
                steps=[],
                total_distance=0.0,
                nodes=[start_node]
            )

        # Priority queue stores tuples: (cumulative_distance, current_node_id, path_edges)
        pq: List[Tuple[float, str, List[Edge]]] = [(0.0, start_id, [])]
        min_distances: Dict[str, float] = {start_id: 0.0}

        best_path: Optional[List[Edge]] = None
        best_distance: float = float("inf")

        while pq:
            current_dist, current_id, path = heapq.heappop(pq)

            if current_dist > min_distances.get(current_id, float("inf")):
                continue

            if current_id == destination_id:
                best_path = path
                best_distance = current_dist
                break

            for edge in self.graph.get_edges_from(current_id):
                # Filter blocked edges
                if edge.blocked:
                    continue

                # Filter inaccessible edges if required
                if accessible_only and not edge.accessible:
                    continue

                neighbor_id = edge.to_node
                new_dist = current_dist + edge.distance

                if new_dist < min_distances.get(neighbor_id, float("inf")):
                    min_distances[neighbor_id] = new_dist
                    heapq.heappush(pq, (new_dist, neighbor_id, path + [edge]))

        if best_path is None:
            raise NoPathFoundError(
                f"No accessible route found between '{start_node.name}' ({start_id}) and '{dest_node.name}' ({destination_id})."
            )

        # Build Route object
        steps: List[RouteStep] = []
        nodes: List[Node] = [start_node]
        cum_dist = 0.0

        for edge in best_path:
            cum_dist += edge.distance
            u_node = self.graph.get_node(edge.from_node)
            v_node = self.graph.get_node(edge.to_node)
            steps.append(
                RouteStep(
                    from_node=u_node,
                    to_node=v_node,
                    edge=edge,
                    cumulative_distance=cum_dist
                )
            )
            nodes.append(v_node)

        return Route(
            origin=start_node,
            destination=dest_node,
            steps=steps,
            total_distance=best_distance,
            nodes=nodes
        )
