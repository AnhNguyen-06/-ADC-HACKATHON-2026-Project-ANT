from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from backend.app.api.websocket import nav_service

router = APIRouter(prefix="/api")

class DestinationRequest(BaseModel):
    destination_id: str

class VoiceCommandRequest(BaseModel):
    transcript: str

@router.get("/nodes")
async def get_nodes() -> List[Dict[str, Any]]:
    nodes = nav_service.graph.get_all_nodes()
    return [n.model_dump() for n in nodes]

@router.get("/map")
async def get_map() -> Dict[str, Any]:
    return nav_service.graph.office_map.model_dump()

@router.get("/telemetry")
async def get_telemetry() -> Dict[str, Any]:
    return nav_service.get_telemetry()

@router.post("/navigate")
async def navigate_to_destination(req: DestinationRequest) -> Dict[str, Any]:
    telemetry = nav_service.process_destination_id(req.destination_id)
    return telemetry

@router.post("/voice")
async def process_voice(req: VoiceCommandRequest) -> Dict[str, Any]:
    telemetry = nav_service.process_voice_command(req.transcript)
    return telemetry

@router.post("/reset")
async def reset_navigation() -> Dict[str, Any]:
    return nav_service.reset()
