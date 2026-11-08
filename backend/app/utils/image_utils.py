import base64
import io

import numpy as np
from PIL import Image


def decode_base64_image(data: str | None) -> np.ndarray | None:
    """Decode a base64 image (optional data-URI header) into an RGB array.

    Aspect ratio is preserved. Stretching a square hand crop to 640×480
    warps MediaPipe landmarks and breaks the trained classifier.
    """
    if not data or not isinstance(data, str):
        return None

    if "," in data:
        _header, encoded = data.split(",", 1)
    else:
        encoded = data

    try:
        img_bytes = base64.b64decode(encoded)
    except Exception:
        return None

    try:
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        return None

    return np.array(image, dtype=np.uint8)