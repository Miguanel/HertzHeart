from django.test import TestCase, override_settings

PROJECT = {
    "schemaVersion": 1,
    "id": "abc",
    "title": "Test",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
    "masterVolume": 0.5,
    "tracks": [],
}


class ShareApiTests(TestCase):
    def test_create_and_fetch(self):
        created = self.client.post("/api/shares/", {"data": PROJECT}, content_type="application/json")
        self.assertEqual(created.status_code, 201)
        slug = created.json()["slug"]
        fetched = self.client.get(f"/api/shares/{slug}/")
        self.assertEqual(fetched.status_code, 200)
        self.assertEqual(fetched.json()["data"]["title"], "Test")

    def test_rejects_wrong_schema(self):
        response = self.client.post("/api/shares/", {"data": {"tracks": []}}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    @override_settings(SHARE_MAX_BYTES=100)
    def test_rejects_too_large(self):
        response = self.client.post("/api/shares/", {"data": PROJECT}, content_type="application/json")
        self.assertEqual(response.status_code, 400)

    def test_unknown_slug_returns_404(self):
        self.assertEqual(self.client.get("/api/shares/nieistnieje/").status_code, 404)


class SpaFallbackTests(TestCase):
    def test_share_path_is_served_by_spa(self):
        self.assertEqual(self.client.get("/s/abcdef/").status_code, 200)

    def test_health(self):
        self.assertEqual(self.client.get("/api/health/").json()["status"], "ok")
