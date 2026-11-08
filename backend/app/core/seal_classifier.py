from pathlib import Path

import joblib
import numpy as np

from app.config import settings
from app.core.hand_tracker import extract_landmarks
from app.core.seals import canonical_seal

MODEL_PATH = settings.MODELS_DIR / "seal_model.pkl"
ENCODER_PATH = settings.MODELS_DIR / "label_encoder.pkl"

CONFIDENCE_GATE = 0.72
MIN_MARGIN = 0.15

_model = None
_encoder = None
_clf = None


def models_available() -> bool:
    return Path(MODEL_PATH).exists() and Path(ENCODER_PATH).exists()


def warmup_classifier() -> None:
    _load_model()


def _load_model():
    global _model, _encoder, _clf
    if _model is not None and _encoder is not None:
        return _model, _encoder, _clf

    if not models_available():
        raise RuntimeError(
            f"Seal classifier files missing. Expected {MODEL_PATH} and {ENCODER_PATH}."
        )

    _model = joblib.load(MODEL_PATH)
    _encoder = joblib.load(ENCODER_PATH)
    _clf = _model.named_steps["mlp"] if hasattr(_model, "named_steps") else _model
    return _model, _encoder, _clf


def predict_seal(frame, session_id: str = "default"):
    if frame is None:
        return None, 0.0

    model, encoder, clf = _load_model()
    landmarks = extract_landmarks(frame, session_id=session_id)
    if landmarks is None:
        return None, 0.0

    features = np.array(landmarks, dtype=np.float32)

    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba([features])[0]
        top2 = np.argsort(probabilities)[::-1][:2]
        top_index = int(top2[0])
        confidence = float(probabilities[top_index])

        if confidence < CONFIDENCE_GATE:
            return None, confidence

        if len(top2) > 1:
            second_confidence = float(probabilities[top2[1]])
            if confidence - second_confidence < MIN_MARGIN:
                return None, confidence

        encoded_label = clf.classes_[top_index]
        raw = encoder.inverse_transform([encoded_label])[0]
        return canonical_seal(raw), confidence

    prediction = model.predict([features])
    raw = encoder.inverse_transform([prediction[0]])[0]
    return canonical_seal(raw), 1.0
