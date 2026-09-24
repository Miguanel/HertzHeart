from django.db import migrations, models

import shares.validation


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Preset",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120, verbose_name="nazwa")),
                ("category", models.CharField(default="Społeczność", max_length=60, verbose_name="kategoria")),
                ("description", models.CharField(blank=True, max_length=240, verbose_name="krótki opis")),
                ("info", models.TextField(blank=True, help_text="Sekcje zaczynaj od „## Tytuł”.", verbose_name="informacje")),
                ("headphones", models.BooleanField(default=False, verbose_name="wymaga słuchawek")),
                ("data", models.JSONField(validators=[shares.validation.validate_composition], verbose_name="projekt (JSON)")),
                ("sort_order", models.PositiveIntegerField(default=0, verbose_name="kolejność")),
                ("is_active", models.BooleanField(default=True, verbose_name="opublikowany")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"verbose_name": "zestaw", "verbose_name_plural": "zestawy", "ordering": ["category", "sort_order", "name"]},
        ),
    ]
