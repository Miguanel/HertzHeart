import secrets

from django.db import models


def generate_slug() -> str:
    return secrets.token_urlsafe(6)  # 8 znaków, ~48 bitów losowości


class SharedProject(models.Model):
    """Migawka projektu dostępna pod krótkim linkiem /s/<slug>."""

    slug = models.CharField(max_length=16, unique=True, default=generate_slug, editable=False)
    title = models.CharField("tytuł", max_length=200, blank=True)
    data = models.JSONField("projekt")
    size_bytes = models.PositiveIntegerField("rozmiar [B]", default=0)
    created_at = models.DateTimeField("utworzono", auto_now_add=True, db_index=True)
    last_accessed_at = models.DateTimeField("ostatnie otwarcie", null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "udostępniony projekt"
        verbose_name_plural = "udostępnione projekty"

    def __str__(self) -> str:
        return f"{self.title or 'Bez tytułu'} ({self.slug})"
