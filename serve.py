import sys
import os
from pathlib import Path
import uvicorn

# Lock workspace root and sys.path
WORKSPACE_ROOT = str(Path(__file__).resolve().parent)
os.chdir(WORKSPACE_ROOT)
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

if __name__ == "__main__":
    uvicorn.run(
        "backend.app.main:app",
        host="127.0.0.1",
        port=8000,
        log_level="info",
        reload=False
    )
