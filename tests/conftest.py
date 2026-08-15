import os
import sys
from pathlib import Path

# Ensure the repository root is importable so `ai` and `backend` modules resolve
ROOT = Path(__file__).resolve().parents[1]
root_str = str(ROOT)
if root_str not in sys.path:
    sys.path.insert(0, root_str)

# Pytest imports the FastAPI app at collection time. Missing APP_ENV now fails
# closed, so tests must choose a recognized environment unless they override it.
os.environ.setdefault("APP_ENV", "test")
