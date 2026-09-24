import os

from django.conf import settings
from django.http import FileResponse, HttpResponse, JsonResponse
from django.views.decorators.cache import never_cache


def health(request):
    # RENDER_GIT_COMMIT ustawia Render – pozwala sprawdzić, która wersja jest wdrożona.
    commit = os.environ.get("RENDER_GIT_COMMIT", "")[:7] or None
    return JsonResponse({"status": "ok", "commit": commit})


@never_cache
def spa(request):
    """Zwraca index.html frontendu dla każdej ścieżki aplikacji (np. /s/<slug>)."""
    index = settings.FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index.open("rb"), content_type="text/html; charset=utf-8")
    return HttpResponse(
        "<h1>HeartzHeart API</h1><p>Frontend nie jest zbudowany. "
        "W trybie deweloperskim otwórz <a href='http://localhost:5173'>http://localhost:5173</a>.</p>",
        content_type="text/html; charset=utf-8",
    )
