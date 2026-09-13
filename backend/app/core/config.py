from pydantic import BaseModel
from typing import Literal

class Settings(BaseModel):
    PROJECT_NAME: str = "ANT - Adaptive Navigation Technology"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    
    # Operation Mode: REAL or SIMULATION
    MODE: Literal["REAL", "SIMULATION"] = "SIMULATION"
    
    # AprilTag Family
    APRILTAG_FAMILY: str = "tag36h11"
    
    # Audio Settings
    TTS_ENABLED: bool = True
    SPEECH_CONFIDENCE_THRESHOLD: float = 0.65

settings = Settings()
