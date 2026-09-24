import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="LibraryFrequency",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="nazwa")),
                (
                    "frequency_millihz",
                    models.PositiveIntegerField(
                        validators=[
                            django.core.validators.MinValueValidator(1000),
                            django.core.validators.MaxValueValidator(20000000),
                        ],
                        verbose_name="częstotliwość [mHz]",
                    ),
                ),
                ("category", models.CharField(db_index=True, max_length=60, verbose_name="kategoria")),
                ("description", models.TextField(blank=True, verbose_name="opis")),
                ("tags", models.JSONField(blank=True, default=list, verbose_name="tagi")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="kolejność")),
                ("is_active", models.BooleanField(default=True, verbose_name="aktywna")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "częstotliwość",
                "verbose_name_plural": "częstotliwości",
                "ordering": ["category", "sort_order", "frequency_millihz"],
            },
        ),
    ]
