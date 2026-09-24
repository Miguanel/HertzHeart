import json

from django.conf import settings
from rest_framework import serializers

from .models import SharedProject

MAX_TRACKS = 64


class ShareCreateSerializer(serializers.ModelSerializer):
    data = serializers.JSONField()

    class Meta:
        model = SharedProject
        fields = ["data"]

    def validate_data(self, value):
        # Pełna walidacja schematu odbywa się we frontendzie (Zod) przy otwieraniu projektu;
        # tutaj pilnujemy tylko kształtu i rozmiaru, żeby nie przechowywać śmieci.
        if not isinstance(value, dict):
            raise serializers.ValidationError("Projekt musi być obiektem JSON.")
        if value.get("schemaVersion") != 1:
            raise serializers.ValidationError("Nieobsługiwana wersja schematu projektu.")
        tracks = value.get("tracks")
        if not isinstance(tracks, list) or len(tracks) > MAX_TRACKS:
            raise serializers.ValidationError(f"Projekt musi mieć listę ścieżek (maks. {MAX_TRACKS}).")
        size = len(json.dumps(value, separators=(",", ":")).encode("utf-8"))
        if size > settings.SHARE_MAX_BYTES:
            raise serializers.ValidationError("Projekt jest zbyt duży do udostępnienia.")
        self.context["size_bytes"] = size
        return value

    def create(self, validated_data):
        data = validated_data["data"]
        title = str(data.get("title") or "")[:200]
        return SharedProject.objects.create(data=data, title=title, size_bytes=self.context.get("size_bytes", 0))
