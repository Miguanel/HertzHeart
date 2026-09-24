from django.contrib import admin
from django.urls import include, path, re_path

from .views import health, spa

admin.site.site_header = "HeartzHeart – administracja"
admin.site.site_title = "HeartzHeart"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/frequencies/", include("frequencies.urls")),
    path("api/shares/", include("shares.urls")),
    path("api/presets/", include("presets.urls")),
    # Wszystko inne obsługuje frontend (SPA).
    re_path(r"^(?!api/|admin/|static/).*$", spa, name="spa"),
]
