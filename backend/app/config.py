import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[1]


def _split_origins(raw: str) -> list[str]:
    values = [item.strip() for item in raw.split(",") if item.strip()]
    return values or ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings:
    APP_HOST: str = os.getenv("APP_HOST", "127.0.0.1")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))
    ENV: str = os.getenv("ENV", "development")
    CORS_ORIGINS: list[str] = _split_origins(
        os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8000,http://127.0.0.1:8000",
        )
    )
    FRONTEND_DIST: Path = Path(
        os.getenv("FRONTEND_DIST", str(BASE_DIR.parent / "frontend" / "dist"))
    )
    MODELS_DIR: Path = Path(os.getenv("MODELS_DIR", str(BASE_DIR / "models")))


settings = Settings()
