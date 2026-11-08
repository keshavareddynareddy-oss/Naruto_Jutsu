from app.core.audio_engine import play_sound
from app.core.jutsu_engine import detect_jutsu, get_best_jutsu_progress
from app.core.seal_classifier import predict_seal
from app.core.sequence_manager import reset_sequence, update_sequence
from app.utils.image_utils import decode_base64_image


def process_frame(image_data: str, session_id: str = "default") -> dict:
    frame = decode_base64_image(image_data)
    if frame is None:
        raise ValueError("Invalid image payload — could not decode base64 frame.")

    seal, confidence = predict_seal(frame, session_id=session_id)
    sequence, event = update_sequence(seal, confidence, session_id=session_id)
    jutsu, matched_pattern = detect_jutsu(list(sequence), session_id=session_id)

    if jutsu is not None:
        play_sound(jutsu.get("name"))
        reset_sequence(session_id=session_id)
        sequence = []

    progress = get_best_jutsu_progress(list(sequence))

    return {
        "seal": str(seal) if seal is not None else None,
        "confidence": round(float(confidence), 4),
        "sequence": [str(item) for item in sequence],
        "jutsu": jutsu,
        "is_new_seal": event["is_new_seal"],
        "sequence_reason": event["reason"],
        "matched_pattern": (
            [str(item) for item in matched_pattern] if matched_pattern else None
        ),
        "progress": progress,
    }
