import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("frequencies", "0002_seed_library")]

    operations = [
        migrations.AddField(
            model_name="libraryfrequency",
            name="key",
            field=models.SlugField(blank=True, max_length=60, null=True, unique=True, verbose_name="klucz"),
        ),
        migrations.AddField(
            model_name="libraryfrequency",
            name="binaural_beat_millihz",
            field=models.PositiveIntegerField(
                blank=True,
                help_text="Jeśli ustawione: lewy kanał = częstotliwość, prawy = częstotliwość + dudnienie.",
                null=True,
                validators=[django.core.validators.MaxValueValidator(100000)],
                verbose_name="dudnienie binauralne [mHz]",
            ),
        ),
        migrations.AlterField(
            model_name="libraryfrequency",
            name="description",
            field=models.CharField(blank=True, max_length=200, verbose_name="krótki opis"),
        ),
        migrations.AddField(
            model_name="libraryfrequency",
            name="info",
            field=models.TextField(blank=True, help_text="Sekcje zaczynaj od „## Tytuł”.", verbose_name="informacje"),
        ),
        migrations.AddField(
            model_name="libraryfrequency",
            name="managed",
            field=models.BooleanField(
                default=True,
                help_text="Aktualizowany automatycznie z library_data.py. Odznacz, by zachować ręczne zmiany.",
                verbose_name="zarządzany",
            ),
        ),
    ]
