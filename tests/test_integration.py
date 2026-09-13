import pytest
from fastapi.testclient import TestClient
import json

from backend.app.main import app

client = TestClient(app)

def test_rest_endpoints():
    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    # 2. Nodes
    res_nodes = client.get("/api/nodes")
    assert res_nodes.status_code == 200
    nodes = res_nodes.json()
    assert len(nodes) >= 6
    node_ids = [n["id"] for n in nodes]
    assert "entrance" in node_ids
    assert "meeting_b" in node_ids

    # 3. Map
    res_map = client.get("/api/map")
    assert res_map.status_code == 200
    map_data = res_map.json()
    assert map_data["floor"] == 1
    assert len(map_data["edges"]) >= 10

def test_websocket_full_navigation_journey():
    with client.websocket_connect("/ws/navigation") as ws:
        # Initial snapshot
        initial_msg = json.loads(ws.receive_text())
        assert initial_msg["type"] == "telemetry"

        # 1. Sighting Entrance Tag 1 first
        ws.send_text(json.dumps({"type": "simulate_tag", "tag_id": 1}))
        tag1_res = json.loads(ws.receive_text())
        assert tag1_res["state"] == "AT_CHECKPOINT"
        assert tag1_res["current_location"]["id"] == "entrance"

        # 2. Natural speech: "Take me to Meeting Room B"
        ws.send_text(json.dumps({
            "type": "voice_command",
            "transcript": "Take me to Meeting Room B"
        }))
        voice_res = json.loads(ws.receive_text())
        assert voice_res["state"] == "ROUTE_READY"
        assert voice_res["destination"]["id"] == "meeting_b"
        assert voice_res["has_active_route"] is True
        assert "Route found." in voice_res["instruction"]

        # 3. Obstacle detected in path (chair, center)
        ws.send_text(json.dumps({
            "type": "simulate_obstacle",
            "class": "chair",
            "position": "center"
        }))
        obs_res = json.loads(ws.receive_text())
        assert obs_res["state"] == "OBSTACLE_WARNING"
        assert obs_res["active_obstacle"]["class"] == "chair"
        assert "Caution: chair ahead. Move slightly left." in obs_res["instruction"]

        # 4. Obstacle cleared
        ws.send_text(json.dumps({"type": "clear_obstacle"}))
        clear_res = json.loads(ws.receive_text())
        assert clear_res["state"] == "MOVING"
        assert clear_res["active_obstacle"] is None
        assert "Path clear." in clear_res["instruction"]

        # 5. Approaching and reaching Checkpoint: Elevator (Tag 3)
        ws.send_text(json.dumps({"type": "simulate_tag", "tag_id": 3}))
        chk_res = json.loads(ws.receive_text())
        assert chk_res["state"] == "AT_CHECKPOINT"
        assert chk_res["current_location"]["id"] == "elevator"
        assert "Main Elevators reached." in chk_res["instruction"]

        # 6. Destination Reached: Meeting Room B (Tag 12)
        ws.send_text(json.dumps({"type": "simulate_tag", "tag_id": 12}))
        arr_res = json.loads(ws.receive_text())
        assert arr_res["state"] == "DESTINATION_REACHED"
        assert arr_res["current_location"]["id"] == "meeting_b"
        assert "You have arrived at Meeting Room B." in arr_res["instruction"]

        # 7. Reset session
        ws.send_text(json.dumps({"type": "reset"}))
        reset_res = json.loads(ws.receive_text())
        assert reset_res["state"] == "UNKNOWN"
        assert reset_res["current_location"] is None
        assert reset_res["destination"] is None
