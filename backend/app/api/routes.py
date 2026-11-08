from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

from app.constants.jutsu_patterns import catalog
from app.core.jutsu_engine import reset_jutsu_cooldowns
from app.core.sequence_manager import reset_sequence
from app.core.seal_classifier import models_available
from app.services.prediction_service import process_frame
from app.config import settings

router = APIRouter()


class PredictionRequest(BaseModel):
    image: str


def _session(x_session_id: str | None) -> str:
    return (x_session_id or "default").strip() or "default"


@router.get("/health")
async def health():
    landmarker = (settings.MODELS_DIR / "hand_landmarker.task").exists()
    classifier = models_available()
    return {
        "ok": landmarker and classifier,
        "landmarker": landmarker,
        "classifier": classifier,
        "env": settings.ENV,
    }


@router.get("/jutsus")
async def jutsus():
    return {"jutsus": catalog()}


@router.post("/predict")
async def predict(data: PredictionRequest, x_session_id: str | None = Header(default=None)):
    try:
        return process_frame(data.image, session_id=_session(x_session_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc


@router.post("/reset")
async def reset(x_session_id: str | None = Header(default=None)):
    session_id = _session(x_session_id)
    reset_sequence(session_id=session_id)
    reset_jutsu_cooldowns(session_id=session_id)
    return {"ok": True}
