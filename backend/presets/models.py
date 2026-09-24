from django.db import models

from shares.validation import validate_composition


class Preset(models.Model):
    """Gotowy projekt publikowany w bibliotece „Zestawy”.

    Najprościej: przygotuj projekt w aplikacji, pobierz plik .heartz.json (Projekty -> pobierz)
    i wklej jego zawartość w pole „projekt”.
    """

    name = models.CharField("nazwa", max_length=120)
    category = models.CharField("kategoria", max_length=60, default="Społeczność")
    description = models.CharField("krótki opis", max_length=240, blank=True)
    info = models.TextField("informacje", blank=True, help_text="Sekcje zaczynaj od „## Tytuł”.")
    headphones = models.BooleanField("wymaga słuchawek", default=False)
    data = models.JSONField("projekt (JSON)", validators=[validate_composition])
    sort_order = models.PositiveIntegerField("kolejność", default=0)
    is_active = models.BooleanField("opublikowany", default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category", "sort_order", "name"]
        verbose_name = "zestaw"
        verbose_name_plural = "zestawy"

    def __str__(self) -> str:
        return self.name
