from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from rest_framework import generics

from .models import Preset
from .serializers import PresetSerializer


@method_decorator(cache_control(public=True, max_age=300), name="dispatch")
class PresetListView(generics.ListAPIView):
    serializer_class = PresetSerializer
    pagination_class = None
    queryset = Preset.objects.filter(is_active=True)
