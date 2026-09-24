from django.db import migrations, models

import shares.models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SharedProject",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "slug",
                    models.CharField(default=shares.models.generate_slug, editable=False, max_length=16, unique=True),
                ),
                ("title", models.CharField(blank=True, max_length=200, verbose_name="tytuł")),
                ("data", models.JSONField(verbose_name="projekt")),
                ("size_bytes", models.PositiveIntegerField(default=0, verbose_name="rozmiar [B]")),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True, verbose_name="utworzono")),
                ("last_accessed_at", models.DateTimeField(blank=True, null=True, verbose_name="ostatnie otwarcie")),
            ],
            options={
                "verbose_name": "udostępniony projekt",
                "verbose_name_plural": "udostępnione projekty",
                "ordering": ["-created_at"],
            },
        ),
    ]
