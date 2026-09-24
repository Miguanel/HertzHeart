from django.core.exceptions import ValidationError
from django.test import TestCase

from .models import Preset

DATA = {"schemaVersion": 1, "id": "x", "title": "T", "createdAt": "", "updatedAt": "", "masterVolume": 0.5, "tracks": []}


class PresetTests(TestCase):
    def test_list_only_active(self):
        Preset.objects.create(name="A", data=DATA)
        Preset.objects.create(name="B", data=DATA, is_active=False)
        data = self.client.get("/api/presets/").json()
        self.assertEqual([p["name"] for p in data], ["A"])
        self.assertTrue(data[0]["id"].startswith("remote-"))

    def test_invalid_json_rejected(self):
        with self.assertRaises(ValidationError):
            Preset(name="Zły", data={"tracks": []}).full_clean()
