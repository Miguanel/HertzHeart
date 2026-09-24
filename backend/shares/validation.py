import json

from django.conf import settings
from django.core.exceptions import ValidationError

MAX_TRACKS = 64


def validate_composition(value) -> int:
    """Podstawowa kontrola kształtu i rozmiaru projektu. Zwraca rozmiar w bajtach.

    Pełna walidacja schematu odbywa się we frontendzie (Zod) przy otwieraniu projektu.
    """
    if not isinstance(value, dict):
        raise ValidationError("Projekt musi być obiektem JSON.")
    if value.get("schemaVersion") != 1:
        raise ValidationError("Nieobsługiwana wersja schematu projektu (wymagane schemaVersion: 1).")
    tracks = value.get("tracks")
    if not isinstance(tracks, list) or len(tracks) > MAX_TRACKS:
        raise ValidationError(f"Projekt musi mieć listę ścieżek (maks. {MAX_TRACKS}).")
    size = len(json.dumps(value, separators=(",", ":")).encode("utf-8"))
    if size > settings.SHARE_MAX_BYTES:
        raise ValidationError("Projekt jest zbyt duży.")
    return size
