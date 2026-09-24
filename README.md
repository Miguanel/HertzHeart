# HeartzHeart

Sekwencer częstotliwości w przeglądarce: biblioteka częstotliwości (dokładność 0,001 Hz), projekty ze ścieżkami
i segmentami czasowymi, diagramy głośności, zapis lokalny (IndexedDB/PWA), udostępnianie linkiem i eksport WAV.
Architektura: [ARCHITEKTURA.md](ARCHITEKTURA.md).

## Uruchomienie lokalne (Windows, PowerShell)

```powershell
# Terminal 1 – backend (http://localhost:8000/admin)
.\venv\Scripts\Activate.ps1
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py sync_library   # wczytuje bibliotekę z frequencies/library_data.py
python manage.py runserver

# Terminal 2 – frontend (http://localhost:5173)
cd frontend
npm install
npm run dev
```

Frontend w trybie deweloperskim przekazuje zapytania `/api/*` do Django (proxy w `vite.config.ts`).

## Testy i kontrola

```powershell
cd backend;  python manage.py test
cd frontend; npm test; npm run lint; npm run build
```

## Wdrożenie na Render.com

1. Wypchnij repozytorium na GitHub.
2. Render → **New → Blueprint** → wybierz repozytorium (plik `render.yaml`).
3. Podaj `DJANGO_SUPERUSER_USERNAME`, `DJANGO_SUPERUSER_EMAIL`, `DJANGO_SUPERUSER_PASSWORD`.
4. Po wdrożeniu: aplikacja pod `https://<nazwa>.onrender.com`, panel biblioteki pod `/admin/`.

Uwagi: darmowy Web Service usypia po bezczynności (pierwsze wejście trwa dłużej), a darmowa baza Postgres na Render
ma ograniczony czas życia – sprawdź aktualne warunki planu. Projekty użytkowników są w przeglądarce, więc nie zależą od bazy.

## Biblioteka i zestawy

- **Częstotliwości**: źródłem jest `backend/frequencies/library_data.py`. Po zmianie pliku uruchom `python manage.py sync_library`
  (na Render dzieje się to automatycznie przy każdym wdrożeniu). Wpisy z odznaczonym „zarządzany” w panelu admina nie są nadpisywane.
  Pole „dudnienie binauralne” tworzy przy dodawaniu parę ścieżek L/P.
- **Zestawy**: wbudowane w `frontend/src/data/templates.ts`. Dodatkowe zestawy publikujesz bez kodu: przygotuj projekt w aplikacji,
  pobierz plik `.heartz.json` (Projekty → pobierz) i wklej jego zawartość w panelu `/admin/` → Zestawy.
