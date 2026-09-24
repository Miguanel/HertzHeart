from django.db import transaction

from .library_data import LIBRARY
from .models import LibraryFrequency

FIELDS = ["name", "frequency_millihz", "binaural_beat_millihz", "category", "description", "info", "tags", "sort_order"]


@transaction.atomic
def sync_library() -> tuple[int, int, int]:
    """Tworzy/aktualizuje wpisy z library_data.py. Zwraca (utworzone, zaktualizowane, pominięte)."""
    created = updated = skipped = 0
    for item in LIBRARY:
        obj = LibraryFrequency.objects.filter(key=item["key"]).first()
        if obj is None:
            # wpisy z pierwszej wersji (bez klucza) dopasowujemy po nazwie i kategorii
            obj = LibraryFrequency.objects.filter(key__isnull=True, name=item["name"], category=item["category"]).first()
        if obj is None:
            LibraryFrequency.objects.create(key=item["key"], **{f: item[f] for f in FIELDS})
            created += 1
            continue
        if not obj.managed:
            skipped += 1
            continue
        obj.key = item["key"]
        for f in FIELDS:
            setattr(obj, f, item[f])
        obj.save()
        updated += 1
    return created, updated, skipped
