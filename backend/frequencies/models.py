from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

MIN_FREQUENCY_MILLIHZ = 1_000  # 1.000 Hz
MAX_FREQUENCY_MILLIHZ = 20_000_000  # 20 000.000 Hz


class LibraryFrequency(models.Model):
    """Wpis biblioteki. Częstotliwość przechowywana jako liczba całkowita w mHz (777.778 Hz -> 777778)."""

    key = models.SlugField("klucz", max_length=60, unique=True, null=True, blank=True)
    name = models.CharField("nazwa", max_length=120)
    frequency_millihz = models.PositiveIntegerField(
        "częstotliwość [mHz]",
        validators=[MinValueValidator(MIN_FREQUENCY_MILLIHZ), MaxValueValidator(MAX_FREQUENCY_MILLIHZ)],
    )
    binaural_beat_millihz = models.PositiveIntegerField(
        "dudnienie binauralne [mHz]",
        null=True,
        blank=True,
        validators=[MaxValueValidator(100_000)],
        help_text="Jeśli ustawione: lewy kanał = częstotliwość, prawy = częstotliwość + dudnienie.",
    )
    category = models.CharField("kategoria", max_length=60, db_index=True)
    description = models.CharField("krótki opis", max_length=200, blank=True)
    info = models.TextField("informacje", blank=True, help_text="Sekcje zaczynaj od „## Tytuł”.")
    tags = models.JSONField("tagi", default=list, blank=True)
    sort_order = models.PositiveIntegerField("kolejność", default=0)
    is_active = models.BooleanField("aktywna", default=True)
    managed = models.BooleanField(
        "zarządzany", default=True, help_text="Aktualizowany automatycznie z library_data.py. Odznacz, by zachować ręczne zmiany."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "sort_order", "frequency_millihz"]
        verbose_name = "częstotliwość"
        verbose_name_plural = "częstotliwości"

    @property
    def frequency_hz(self) -> Decimal:
        return Decimal(self.frequency_millihz) / 1000

    def __str__(self) -> str:
        return f"{self.name} ({self.frequency_hz:.3f} Hz)"
