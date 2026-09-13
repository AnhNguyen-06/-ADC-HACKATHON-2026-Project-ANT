import sys
import os
from pathlib import Path
import pytest

# Ensure workspace root is working dir and in sys.path
WORKSPACE_ROOT = str(Path(__file__).resolve().parent)
os.chdir(WORKSPACE_ROOT)
if WORKSPACE_ROOT not in sys.path:
    sys.path.insert(0, WORKSPACE_ROOT)

if __name__ == "__main__":
    args = sys.argv[1:] if len(sys.argv) > 1 else ["tests", "-v"]
    sys.exit(pytest.main(args))
