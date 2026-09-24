from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

MIN_FREQUENCY_MILLIHZ = 1_000  # 1.000 Hz
MAX_FREQUENCY_MILLIHZ = 20_000_000  # 20 000.000 Hz


class LibraryFrequency(models.Model):
    """Wpis biblioteki. Częstotliwość przechowywana jako liczba całkowita w mHz (777.778 Hz -> 777778)."""

    name = models.CharField("nazwa", max_length=120)
    frequency_millihz = models.PositiveIntegerField(
        "częstotliwość [mHz]",
        validators=[MinValueValidator(MIN_FREQUENCY_MILLIHZ), MaxValueValidator(MAX_FREQUENCY_MILLIHZ)],
    )
    category = models.CharField("kategoria", max_length=60, db_index=True)
    description = models.TextField("opis", blank=True)
    tags = models.JSONField("tagi", default=list, blank=True)
    sort_order = models.PositiveIntegerField("kolejność", default=0)
    is_active = models.BooleanField("aktywna", default=True)
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
