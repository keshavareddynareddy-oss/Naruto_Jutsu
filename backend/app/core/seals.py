"""Canonical twelve-zodiac seal names used by the classifier and jutsu matcher."""

from __future__ import annotations

ZODIAC_SEALS = (
    "Rat",
    "Ox",
    "Tiger",
    "Hare",
    "Dragon",
    "Snake",
    "Horse",
    "Ram",
    "Monkey",
    "Bird",
    "Dog",
    "Boar",
)

_CANONICAL = {name.lower(): name for name in ZODIAC_SEALS}
_IGNORED = {"zero", "none", "unknown", ""}


def canonical_seal(label: str | None) -> str | None:
    """Map dataset labels (`ox`, `ZERO`) onto title-case names, or None."""
    if label is None:
        return None
    key = str(label).strip().lower()
    if key in _IGNORED:
        return None
    return _CANONICAL.get(key)
