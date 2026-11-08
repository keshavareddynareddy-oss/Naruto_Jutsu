from time import monotonic

from app.constants.jutsu_patterns import JUTSU_PATTERNS

JUTSU_COOLDOWN_SECONDS = 3.0
MAX_ERRORS = 1

_last_trigger_time_by_session: dict[str, dict[str, float]] = {}


def _fuzzy_match(sequence: list, pattern: tuple) -> bool:
    length = len(pattern)
    tail = sequence[-length:]
    if len(tail) != length:
        return False
    errors = sum(1 for a, b in zip(tail, pattern) if a != b)
    return errors <= MAX_ERRORS


def detect_jutsu(sequence: list, session_id: str = "default"):
    if not sequence:
        return None, None

    cooldown_map = _last_trigger_time_by_session.setdefault(session_id, {})

    for pattern, jutsu in JUTSU_PATTERNS.items():
        if len(sequence) < len(pattern):
            continue

        if _fuzzy_match(sequence, pattern):
            jutsu_name = jutsu["name"]
            now = monotonic()
            last_trigger_time = cooldown_map.get(jutsu_name, 0.0)

            if now - last_trigger_time < JUTSU_COOLDOWN_SECONDS:
                return None, pattern

            cooldown_map[jutsu_name] = now
            return dict(jutsu), pattern

    return None, None


def get_best_jutsu_progress(sequence: list):
    if not sequence:
        return None

    best_match = None

    for pattern, jutsu in JUTSU_PATTERNS.items():
        max_overlap = min(len(sequence), len(pattern))

        for overlap in range(max_overlap, 0, -1):
            tail_slice = tuple(sequence[-overlap:])
            pattern_slice = pattern[:overlap]
            correct = sum(1 for a, b in zip(tail_slice, pattern_slice) if a == b)
            errors = overlap - correct

            if errors > MAX_ERRORS:
                continue

            if best_match is None or overlap > best_match["matched_count"]:
                best_match = {
                    "target_jutsu": jutsu["name"],
                    "target_type": jutsu["type"],
                    "matched_count": overlap,
                    "total_required": len(pattern),
                    "next_required_seal": (
                        pattern[overlap] if overlap < len(pattern) else None
                    ),
                    "required_sequence": list(pattern),
                    "errors": errors,
                }
            break

    return best_match


def reset_jutsu_cooldowns(session_id: str = "default") -> None:
    _last_trigger_time_by_session.pop(session_id, None)
