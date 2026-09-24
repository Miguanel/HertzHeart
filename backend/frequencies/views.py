from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_control
from rest_framework import generics

from .models import LibraryFrequency
from .serializers import LibraryFrequencySerializer


@method_decorator(cache_control(public=True, max_age=300), name="dispatch")
class FrequencyListView(generics.ListAPIView):
    serializer_class = LibraryFrequencySerializer
    pagination_class = None
    queryset = LibraryFrequency.objects.filter(is_active=True)
