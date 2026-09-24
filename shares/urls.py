from django.urls import path

from .views import ShareCreateView, ShareDetailView

urlpatterns = [
    path("", ShareCreateView.as_view(), name="share-create"),
    path("<str:slug>/", ShareDetailView.as_view(), name="share-detail"),
]
