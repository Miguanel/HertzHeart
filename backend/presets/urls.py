from django.urls import path

from .views import PresetListView

urlpatterns = [path("", PresetListView.as_view(), name="preset-list")]
