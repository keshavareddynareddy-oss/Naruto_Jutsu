import collections
from pathlib import Path

import numpy as np

from app.config import settings

try:
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision
except ModuleNotFoundError as exc:
    mp = None
    python = None
    vision = None
    _IMPORT_ERROR = exc
else:
    _IMPORT_ERROR = None

MODEL_PATH = settings.MODELS_DIR / "hand_landmarker.task"

_detector = None
_SMOOTH_WINDOW = 5
_landmark_buffers: dict[str, collections.deque] = {}


def _get_buffer(session_id: str) -> collections.deque:
    buffer = _landmark_buffers.get(session_id)
    if buffer is None:
        buffer = collections.deque(maxlen=_SMOOTH_WINDOW)
        _landmark_buffers[session_id] = buffer
    return buffer


def _reset_smoother(session_id: str) -> None:
    buffer = _landmark_buffers.get(session_id)
    if buffer is not None:
        buffer.clear()


def _create_detector():
    if python is None or vision is None:
        raise RuntimeError(
            "MediaPipe is not installed for the current Python interpreter."
        ) from _IMPORT_ERROR

    if not Path(MODEL_PATH).exists():
        raise RuntimeError(f"Hand landmarker model missing at {MODEL_PATH}")

    options = vision.HandLandmarkerOptions(
        base_options=python.BaseOptions(model_asset_path=str(MODEL_PATH)),
        num_hands=1,
        min_hand_detection_confidence=0.72,
        min_hand_presence_confidence=0.72,
        min_tracking_confidence=0.72,
    )
    return vision.HandLandmarker.create_from_options(options)


def ensure_hand_tracker_available():
    global _detector
    if _detector is None:
        _detector = _create_detector()
    return _detector


def _normalize_landmarks(landmarks):
    coords = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    coords -= coords[0]
    z_range = float(coords[:, 2].max() - coords[:, 2].min())
    scale = np.linalg.norm(coords, axis=1).max()
    if scale > 0:
        coords /= scale
    return coords.flatten().tolist() + [z_range]


def extract_landmarks(frame, session_id: str = "default"):
    detector = ensure_hand_tracker_available()

    rgb = mp.Image(
        image_format=mp.ImageFormat.SRGB,
        data=np.ascontiguousarray(frame),
    )
    result = detector.detect(rgb)

    if not result.hand_landmarks:
        _reset_smoother(session_id)
        return None

    landmarks = result.hand_landmarks[0]
    raw = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    buffer = _get_buffer(session_id)
    buffer.append(raw)
    smoothed = np.mean(buffer, axis=0)

    class _LM:
        __slots__ = ("x", "y", "z")

        def __init__(self, x, y, z):
            self.x, self.y, self.z = float(x), float(y), float(z)

    return _normalize_landmarks([_LM(x, y, z) for x, y, z in smoothed])
