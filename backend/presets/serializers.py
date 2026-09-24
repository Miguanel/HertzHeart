from rest_framework import serializers

from .models import Preset


class PresetSerializer(serializers.ModelSerializer):
    id = serializers.SerializerMethodField()

    class Meta:
        model = Preset
        fields = ["id", "name", "category", "description", "info", "headphones", "data"]

    def get_id(self, obj: Preset) -> str:
        return f"remote-{obj.pk}"
