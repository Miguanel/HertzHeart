from rest_framework import serializers

from .models import LibraryFrequency


class LibraryFrequencySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    frequencyMilliHz = serializers.IntegerField(source="frequency_millihz")

    class Meta:
        model = LibraryFrequency
        fields = ["id", "name", "frequencyMilliHz", "category", "description", "tags"]
