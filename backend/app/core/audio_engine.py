"""Optional local sound playback. Cloud hosts usually have no audio device."""

from __future__ import annotations

import os
import threading
from pathlib import Path

from app.config import BASE_DIR

_sound_cache: dict[str, object] = {}
_channel = None
_mixer_ready = False


def _init_mixer() -> bool:
    global _channel, _mixer_ready
    if _mixer_ready:
        return _channel is not None

    _mixer_ready = True
    try:
        import pygame

        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=512)
        _channel = pygame.mixer.Channel(0)
        return True
    except Exception as exc:
        print(f"[audio_engine] Mixer unavailable: {exc}")
        _channel = None
        return False


def _sanitise_name(name: str) -> str:
    return name.lower().replace(" ", "_")


def play_sound(jutsu_name: str | None) -> None:
    if os.getenv("ENV", "development") == "production":
        return
    if not jutsu_name or not _init_mixer():
        return

    try:
        import pygame
    except Exception:
        return

    safe_name = _sanitise_name(jutsu_name)
    file_path = Path(BASE_DIR) / "sounds" / f"{safe_name}.mp3"
    if not file_path.exists():
        return

    def _play() -> None:
        try:
            if safe_name not in _sound_cache:
                _sound_cache[safe_name] = pygame.mixer.Sound(str(file_path))
            sound = _sound_cache[safe_name]
            _channel.stop()
            _channel.play(sound)
        except Exception as exc:
            print(f"[audio_engine] Could not play '{file_path}': {exc}")

    threading.Thread(target=_play, daemon=True).start()


def stop_sound() -> None:
    if _channel is not None:
        _channel.stop()
