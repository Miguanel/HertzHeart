"""Początkowa zawartość biblioteki. Dalsze zmiany wprowadzaj w panelu /admin/."""

from django.db import migrations

# (nazwa, częstotliwość w mHz, kategoria, opis, tagi)
SEED = [
    ("Solfeggio 174", 174_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 285", 285_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 396 (UT)", 396_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 417 (RE)", 417_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 528 (MI)", 528_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 639 (FA)", 639_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 741 (SOL)", 741_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 852 (LA)", 852_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Solfeggio 963", 963_000, "Solfeggio", "Skala Solfeggio", ["solfeggio"]),
    ("Słońce", 126_220, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Ziemia – rok (OM)", 136_100, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Merkury", 141_270, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Mars", 144_720, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Saturn", 147_850, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Jowisz", 183_580, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Ziemia – doba", 194_180, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Księżyc synodyczny", 210_420, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("Wenus", 221_230, "Kosmiczna oktawa", "Wg H. Cousto", ["cousto", "planety"]),
    ("C4 (strój naukowy)", 256_000, "Strojenie", "C4 przy stroju naukowym", ["strojenie"]),
    ("C4 (A=440)", 261_626, "Strojenie", "C4 w stroju równomiernie temperowanym", ["strojenie"]),
    ("A4 = 432 Hz", 432_000, "Strojenie", "Alternatywny strój A4", ["strojenie"]),
    ("A4 = 440 Hz", 440_000, "Strojenie", "Standardowy strój A4 (ISO 16)", ["strojenie"]),
    ("Ton testowy 100 Hz", 100_000, "Tony testowe", "Niski ton kontrolny", ["test"]),
    ("Ton testowy 1 kHz", 1_000_000, "Tony testowe", "Ton odniesienia 1 kHz", ["test"]),
]


def seed(apps, schema_editor):
    LibraryFrequency = apps.get_model("frequencies", "LibraryFrequency")
    for order, (name, mhz, category, description, tags) in enumerate(SEED):
        LibraryFrequency.objects.get_or_create(
            name=name,
            category=category,
            defaults={"frequency_millihz": mhz, "description": description, "tags": tags, "sort_order": order},
        )


class Migration(migrations.Migration):
    dependencies = [("frequencies", "0001_initial")]

    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
