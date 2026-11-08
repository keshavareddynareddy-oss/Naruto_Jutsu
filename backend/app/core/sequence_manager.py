from dataclasses import dataclass, field
from time import monotonic

MIN_SEAL_CONFIDENCE = 0.72
STABLE_FRAME_REQUIREMENT = 8
MAX_SEQUENCE_LENGTH = 6
POST_COMMIT_LOCKOUT_SECONDS = 0.6
INACTIVITY_RESET_SECONDS = 2.0
SESSION_TTL_SECONDS = 60 * 30


@dataclass
class SequenceState:
    sequence: list[str] = field(default_factory=list)
    last_committed_seal: str | None = None
    last_seen_seal: str | None = None
    stable_frames: int = 0
    last_commit_time: float = 0.0
    last_active_time: float = 0.0
    last_touch: float = field(default_factory=monotonic)


_sessions: dict[str, SequenceState] = {}


def _prune_sessions(now: float) -> None:
    stale = [
        session_id
        for session_id, state in _sessions.items()
        if now - state.last_touch > SESSION_TTL_SECONDS
    ]
    for session_id in stale:
        _sessions.pop(session_id, None)


def get_state(session_id: str) -> SequenceState:
    now = monotonic()
    _prune_sessions(now)
    state = _sessions.get(session_id)
    if state is None:
        state = SequenceState()
        _sessions[session_id] = state
    state.last_touch = now
    return state


def update_sequence(seal: str | None, confidence: float = 0.0, session_id: str = "default"):
    state = get_state(session_id)
    now = monotonic()
    event = {"is_new_seal": False, "reason": None}

    if seal is None or confidence < MIN_SEAL_CONFIDENCE:
        if now - state.last_active_time > INACTIVITY_RESET_SECONDS:
            state.last_seen_seal = None
            state.stable_frames = 0
        event["reason"] = "low_confidence"
        return state.sequence, event

    state.last_active_time = now

    if seal == state.last_seen_seal:
        state.stable_frames += 1
    else:
        state.last_seen_seal = seal
        state.stable_frames = 1

    if state.stable_frames < STABLE_FRAME_REQUIREMENT:
        event["reason"] = "stabilizing"
        return state.sequence, event

    if now - state.last_commit_time < POST_COMMIT_LOCKOUT_SECONDS:
        event["reason"] = "lockout"
        return state.sequence, event

    if seal == state.last_committed_seal:
        event["reason"] = "duplicate"
        return state.sequence, event

    state.sequence.append(seal)
    state.last_committed_seal = seal
    state.last_seen_seal = None
    state.stable_frames = 0
    state.last_commit_time = now

    if len(state.sequence) > MAX_SEQUENCE_LENGTH:
        state.sequence.pop(0)

    event["is_new_seal"] = True
    return state.sequence, event


def reset_sequence(session_id: str = "default") -> None:
    _sessions[session_id] = SequenceState()
