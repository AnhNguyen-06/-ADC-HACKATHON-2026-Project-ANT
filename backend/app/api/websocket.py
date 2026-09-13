from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import logging
from pathlib import Path

from backend.app.services.navigation_service import NavigationService

logger = logging.getLogger(__name__)

router = APIRouter()

# Global navigation service instance using standard office map
MAP_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "office_map.json"
nav_service = NavigationService(MAP_PATH)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        payload = json.dumps(message)
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

@router.websocket("/ws/navigation")
async def navigation_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial telemetry snapshot upon connection
        initial_telemetry = nav_service.get_telemetry()
        await websocket.send_text(json.dumps(initial_telemetry))

        while True:
            raw_text = await websocket.receive_text()
            try:
                data = json.loads(raw_text)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON payload"}))
                continue

            msg_type = data.get("type")
            telemetry = None

            if msg_type == "voice_command":
                transcript = data.get("transcript", "")
                telemetry = nav_service.process_voice_command(transcript)

            elif msg_type == "set_destination":
                dest_id = data.get("destination_id", "")
                telemetry = nav_service.process_destination_id(dest_id)

            elif msg_type == "video_frame":
                b64_img = data.get("image", "")
                telemetry = nav_service.process_base64_frame(b64_img)

            elif msg_type == "simulate_tag":
                tag_id = int(data.get("tag_id", 0))
                telemetry = nav_service.simulate_tag_observed(tag_id)

            elif msg_type == "simulate_obstacle":
                cls_name = data.get("class", "chair")
                pos = data.get("position", "center")
                telemetry = nav_service.trigger_obstacle_simulation(cls_name, pos)

            elif msg_type == "clear_obstacle":
                telemetry = nav_service.clear_obstacle_simulation()

            elif msg_type == "reset":
                telemetry = nav_service.reset()

            elif msg_type == "get_telemetry":
                telemetry = nav_service.get_telemetry()

            else:
                telemetry = nav_service.get_telemetry(error=f"Unrecognized message type: {msg_type}")

            if telemetry:
                await manager.broadcast(telemetry)

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
