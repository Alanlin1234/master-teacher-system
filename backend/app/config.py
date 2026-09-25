import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
UPLOAD_DIR = BASE_DIR / "uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DATA_DIR / 'teachers.db'}")
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
DUIX_BASE_URL = os.getenv("DUIX_BASE_URL", "http://127.0.0.1:8010")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
