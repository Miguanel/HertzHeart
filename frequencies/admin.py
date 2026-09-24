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

    class Meta:
        model = LibraryFrequency
        fields = ["name", "frequency_hz", "category", "description", "tags", "sort_order", "is_active"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.initial["frequency_hz"] = self.instance.frequency_hz

    def save(self, commit=True):
        self.instance.frequency_millihz = int(self.cleaned_data["frequency_hz"] * 1000)
        return super().save(commit=commit)


@admin.register(LibraryFrequency)
class LibraryFrequencyAdmin(admin.ModelAdmin):
    form = LibraryFrequencyForm
    list_display = ["name", "hz", "category", "sort_order", "is_active"]
    list_editable = ["sort_order", "is_active"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "description", "category"]

    @admin.display(description="Hz", ordering="frequency_millihz")
    def hz(self, obj: LibraryFrequency) -> str:
        return f"{obj.frequency_hz:.3f}"
