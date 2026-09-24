from django.urls import path

from .views import FrequencyListView

urlpatterns = [
    path("", FrequencyListView.as_view(), name="frequency-list"),
]
