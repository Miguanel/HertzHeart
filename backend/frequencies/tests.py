from django.test import TestCase

from .models import LibraryFrequency
from .sync import sync_library


class FrequencyApiTests(TestCase):
    def test_list_returns_seeded_library(self):
        response = self.client.get("/api/frequencies/")
        self.assertEqual(response.status_code, 200)
        item = next(x for x in response.json() if x["name"] == "A4 = 440 Hz")
        self.assertEqual(item["frequencyMilliHz"], 440_000)
        self.assertIsInstance(item["id"], str)


class SyncLibraryTests(TestCase):
    def test_sync_adopts_seeded_rows_and_adds_new(self):
        before = LibraryFrequency.objects.count()
        created, updated, _ = sync_library()
        self.assertEqual(updated, before)  # wpisy z migracji 0002 zostały dopasowane, nie zdublowane
        self.assertGreater(created, 0)
        theta = LibraryFrequency.objects.get(key="brain-theta")
        self.assertEqual(theta.binaural_beat_millihz, 6_000)
        self.assertIn("słuchawki", theta.info.lower())
        # drugie uruchomienie niczego nie dubluje
        count = LibraryFrequency.objects.count()
        sync_library()
        self.assertEqual(LibraryFrequency.objects.count(), count)

    def test_unmanaged_rows_are_not_overwritten(self):
        sync_library()
        obj = LibraryFrequency.objects.get(key="tuning-a432")
        obj.name = "Moja nazwa"
        obj.managed = False
        obj.save()
        sync_library()
        obj.refresh_from_db()
        self.assertEqual(obj.name, "Moja nazwa")
