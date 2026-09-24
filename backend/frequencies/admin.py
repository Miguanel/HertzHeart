from decimal import Decimal

from django import forms
from django.contrib import admin

from .models import MAX_FREQUENCY_MILLIHZ, MIN_FREQUENCY_MILLIHZ, LibraryFrequency


class LibraryFrequencyForm(forms.ModelForm):
    """Pozwala wpisywać częstotliwość w Hz (3 miejsca po przecinku) zamiast w mHz."""

    frequency_hz = forms.DecimalField(
        label="Częstotliwość [Hz]",
        max_digits=8,
        decimal_places=3,
        min_value=Decimal(MIN_FREQUENCY_MILLIHZ) / 1000,
        max_value=Decimal(MAX_FREQUENCY_MILLIHZ) / 1000,
    )

    beat_hz = forms.DecimalField(
        label="Dudnienie binauralne [Hz]",
        required=False,
        max_digits=6,
        decimal_places=3,
        min_value=Decimal("0.001"),
        max_value=Decimal("100"),
        help_text="Opcjonalne. Lewy kanał = częstotliwość, prawy = częstotliwość + dudnienie (wymaga słuchawek).",
    )

    class Meta:
        model = LibraryFrequency
        fields = ["name", "frequency_hz", "beat_hz", "category", "description", "info", "tags", "sort_order", "is_active", "managed", "key"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.initial["frequency_hz"] = self.instance.frequency_hz
            if self.instance.binaural_beat_millihz:
                self.initial["beat_hz"] = Decimal(self.instance.binaural_beat_millihz) / 1000

    def save(self, commit=True):
        self.instance.frequency_millihz = int(self.cleaned_data["frequency_hz"] * 1000)
        beat = self.cleaned_data.get("beat_hz")
        self.instance.binaural_beat_millihz = int(beat * 1000) if beat else None
        return super().save(commit=commit)


@admin.register(LibraryFrequency)
class LibraryFrequencyAdmin(admin.ModelAdmin):
    form = LibraryFrequencyForm
    list_display = ["name", "hz", "beat", "category", "sort_order", "is_active", "managed"]
    list_editable = ["sort_order", "is_active"]
    list_filter = ["category", "is_active", "managed"]
    search_fields = ["name", "description", "category"]

    @admin.display(description="Hz", ordering="frequency_millihz")
    def hz(self, obj: LibraryFrequency) -> str:
        return f"{obj.frequency_hz:.3f}"

    @admin.display(description="Dudnienie")
    def beat(self, obj: LibraryFrequency) -> str:
        return f"{obj.binaural_beat_millihz / 1000:.3f} Hz" if obj.binaural_beat_millihz else "–"
