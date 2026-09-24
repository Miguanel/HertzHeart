from django.test import TestCase


class FrequencyApiTests(TestCase):
    def test_list_returns_seeded_library(self):
        response = self.client.get("/api/frequencies/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertGreater(len(data), 0)
        item = next(x for x in data if x["name"] == "A4 = 440 Hz")
        self.assertEqual(item["frequencyMilliHz"], 440_000)
        self.assertIsInstance(item["id"], str)
