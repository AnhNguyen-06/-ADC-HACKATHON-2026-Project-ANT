import re
from abc import ABC, abstractmethod
from typing import Optional, List, Dict, Any
from backend.app.navigation.models import Node

class SpeechInputProvider(ABC):
    @abstractmethod
    def parse_destination(self, transcript: str, candidate_nodes: List[Node]) -> Optional[str]:
        pass

class NaturalLanguageDestinationParser(SpeechInputProvider):
    """Parses natural speech transcripts into office graph node IDs."""

    SYNONYM_MAP: Dict[str, List[str]] = {
        "meeting_b": ["meeting room b", "conference room b", "room b", "meeting room", "room 2"],
        "entrance": ["entrance", "main entrance", "front door", "lobby entrance", "exit"],
        "hallway_junction": ["junction", "central junction", "hallway junction", "central lobby"],
        "elevator": ["elevator", "elevators", "main elevators", "lift", "lifts"],
        "corridor_b": ["corridor", "east wing", "corridor b", "hallway b", "east corridor"],
        "restroom": ["restroom", "accessible restroom", "washroom", "bathroom", "toilet", "restrooms"],
        "cafeteria": ["cafeteria", "pantry", "canteen", "kitchen", "coffee machine", "snack bar", "break room"],
        "stairs_east": ["stairs", "stairwell", "east stairs", "emergency stairs"]
    }

    def parse_destination(self, transcript: str, candidate_nodes: List[Node]) -> Optional[str]:
        if not transcript:
            return None

        clean_text = transcript.lower().strip()
        # Remove common preamble phrases
        clean_text = re.sub(r"^(please\s+)?(take\s+me\s+to|navigate\s+to|go\s+to|head\s+to|i\s+want\s+to\s+go\s+to|guide\s+me\s+to|find\s+me|find)\s+", "", clean_text)
        clean_text = re.sub(r"^(the|a|an)\s+", "", clean_text)

        # 1. Exact node id match
        for node in candidate_nodes:
            if clean_text == node.id.lower():
                return node.id

        # 2. Exact node name match
        for node in candidate_nodes:
            if clean_text == node.name.lower() or clean_text in node.name.lower():
                return node.id

        # 3. Synonym dictionary match
        for node_id, synonyms in self.SYNONYM_MAP.items():
            for syn in synonyms:
                if syn in clean_text or clean_text in syn:
                    # Verify node_id exists in candidates
                    if any(n.id == node_id for n in candidate_nodes):
                        return node_id

        # 4. Landmark association match
        for node in candidate_nodes:
            for landmark in node.landmarks:
                clean_lm = landmark.replace("_", " ")
                if clean_lm in clean_text:
                    return node.id

        return None

class TTSProvider(ABC):
    @abstractmethod
    def speak(self, text: str) -> Dict[str, Any]:
        pass

class MockTTSProvider(TTSProvider):
    """In-memory mock TTS provider recording spoken messages for testing."""
    def __init__(self):
        self.history: List[str] = []

    def speak(self, text: str) -> Dict[str, Any]:
        self.history.append(text)
        return {
            "status": "spoken",
            "text": text,
            "char_count": len(text),
            "approx_duration_s": round(len(text) * 0.06, 2)
        }

    def get_last_spoken(self) -> Optional[str]:
        return self.history[-1] if self.history else None

    def clear(self):
        self.history.clear()
