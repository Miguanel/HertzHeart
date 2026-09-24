from rest_framework import serializers

from .models import LibraryFrequency


class LibraryFrequencySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    frequencyMilliHz = serializers.IntegerField(source="frequency_millihz")
    binauralBeatMilliHz = serializers.IntegerField(source="binaural_beat_millihz", allow_null=True)

    class Meta:
        model = LibraryFrequency
        fields = ["id", "key", "name", "frequencyMilliHz", "binauralBeatMilliHz", "category", "description", "info", "tags"]
