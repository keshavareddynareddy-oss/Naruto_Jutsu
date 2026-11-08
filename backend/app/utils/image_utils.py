import base64
import binascii
import io

import numpy as np
from PIL import Image

MAX_IMAGE_BYTES = 1_800_000
MAX_IMAGE_PIXELS = 4_000_000


def decode_base64_image(data: str | None) -> np.ndarray | None:
    """Decode a base64 image (optional data-URI header) into an RGB array.

    Aspect ratio is preserved. Stretching a square hand crop to 640×480
    warps MediaPipe landmarks and breaks the trained classifier.
    """
    if not data or not isinstance(data, str) or len(data) > 2_500_000:
        return None

    if "," in data:
        _header, encoded = data.split(",", 1)
    else:
        encoded = data

    try:
        img_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        return None

    if len(img_bytes) > MAX_IMAGE_BYTES:
        return None

    try:
        image = Image.open(io.BytesIO(img_bytes))
        if image.width * image.height > MAX_IMAGE_PIXELS:
            return None
        image = image.convert("RGB")
    except (OSError, ValueError):
        return None

    return np.array(image, dtype=np.uint8)