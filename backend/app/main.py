from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.config import settings
from app.core.hand_tracker import ensure_hand_tracker_available
from app.core.seal_classifier import models_available, warmup_classifier


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        if models_available():
            warmup_classifier()
        if (settings.MODELS_DIR / "hand_landmarker.task").exists():
            ensure_hand_tracker_available()
    except Exception as exc:
        print(f"[startup] Model warmup skipped: {exc}")
    yield


app = FastAPI(
    title="Hidden Seal Nexus",
    description="Recognize Naruto hand seals and release jutsu from a live camera.",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if "*" not in settings.CORS_ORIGINS else ["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/api")
async def api_root():
    return {"name": "Hidden Seal Nexus", "docs": "/docs", "health": "/api/health"}


DIST = settings.FRONTEND_DIST
if DIST.exists():
    assets_dir = DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def index():
        return FileResponse(DIST / "index.html")

    @app.get("/{full_path:path}")
    async def spa(full_path: str):
        if full_path.startswith("api") or full_path in {"docs", "openapi.json", "redoc"}:
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(DIST / "index.html")
