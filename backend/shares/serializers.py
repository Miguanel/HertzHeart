from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import SharedProject
from .validation import validate_composition


class ShareCreateSerializer(serializers.ModelSerializer):
    data = serializers.JSONField()

    class Meta:
        model = SharedProject
        fields = ["data"]

    def validate_data(self, value):
        try:
            self.context["size_bytes"] = validate_composition(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        data = validated_data["data"]
        title = str(data.get("title") or "")[:200]
        return SharedProject.objects.create(data=data, title=title, size_bytes=self.context.get("size_bytes", 0))
