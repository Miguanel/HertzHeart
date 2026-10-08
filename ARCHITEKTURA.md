# Hertz Hearth (Herce Serca) – architektura (wersja poprawiona)

Sekwencer częstotliwości w przeglądarce: biblioteka częstotliwości (dokładność 0,001 Hz), projekty złożone ze ścieżek i segmentów czasowych z obwiednią głośności, zapis lokalny (telefon/komputer), udostępnianie projektów, wdrożenie jako Web Service na Render.com.

---

## 1. Co było źle we wzorcu z Gemini

| # | Problem | Dlaczego to błąd | Poprawka |
|---|---------|------------------|----------|
| 1 | `linearRampToValueAtTime(v, "+" + node.time)` | `"+t"` w Tone.js oznacza „t sekund **od teraz**” (od chwili wywołania), a nie od startu transportu. Automatyzacja nie reaguje na pauzę, przewijanie ani na `startTimeOffset` (który w przykładzie w ogóle nie jest użyty). Brak punktu zakotwiczenia `setValueAtTime` – pierwsza rampa startuje od nieprzewidywalnego momentu. | Planowanie w czasie absolutnym kontekstu audio: `t0 + (czasWKompozycji − pozycjaStartu)`, zawsze z `setValueAtTime` na początku. |
| 2 | „`Tone.Transport.start()` sam uruchomi oscylatory” | Nie uruchomi – oscylator musi być zsynchronizowany (`osc.sync().start(offset)`), a automatyzacja `Gain` i tak nie jest powiązana z transportem. Pauza/seek = rozjazd dźwięku z wykresem. | Silnik przy każdym Play/Seek buduje graf od zadanej pozycji; pauza = `AudioContext.suspend()`. |
| 3 | Brak odblokowania audio | Przeglądarki (szczególnie iOS/Safari) blokują dźwięk do pierwszej interakcji użytkownika. | `ctx.resume()` wywołane w handlerze kliknięcia Play. |
| 4 | Każda ścieżka `.toDestination()` | Suma wielu sinusów o amplitudzie 1.0 przesteruje wyjście (clipping, zniekształcenia). | Szyna master: `GainNode` (głośność główna) → `DynamicsCompressorNode` (limiter) → wyjście. |
| 5 | Kliknięcia (trzaski) | Start/stop oscylatora przy niezerowej głośności daje skok sygnału. | Zawsze krótkie wejście/wyjście (10–20 ms) przy starcie, seeku i stopie. |
| 6 | Chart.js + `chartjs-plugin-dragdata` | Plugin pozwala tylko **przeciągać istniejące** punkty (dodawanie/usuwanie trzeba dopisać), słabo działa z dotykiem, a Chart.js nie jest edytorem osi czasu z wieloma segmentami. | Własny edytor obwiedni w SVG + Pointer Events (mysz i dotyk jednym API). |
| 7 | Model danych | `envelope.time` – nie wiadomo, czy względny do `startTimeOffset`, czy absolutny; brak czasu trwania; jedna ścieżka = jeden segment (a wymaganie mówi o wielu segmentach czasowych); brak id punktów, wersji schematu, głośności/wyciszenia ścieżki; częstotliwość jako float. | Model z sekcji 3. |
| 8 | Wszystko w Django | Wymaganie: projekty zapisane **lokalnie** na urządzeniu + udostępnianie. Gemini w ogóle nie uwzględnił pamięci przeglądarki ani trybu offline. | IndexedDB (Dexie) + PWA; backend tylko do biblioteki i krótkich linków. |
| 9 | Render.com pominięty | Darmowy Web Service na Render ma **ulotny dysk** – SQLite znika przy każdym deployu/restarcie; usługa usypia po bezczynności. | PostgreSQL (Render Postgres) dla danych serwerowych; linki udostępniania działające bez serwera (sekcja 5). |
| 10 | Playhead z `Tone.Transport.seconds` | Pomija opóźnienie wyjścia (lookahead, `outputLatency`) – linia wyprzedza dźwięk. | `pozycja = from + (ctx.currentTime − t0) − ctx.outputLatency`. |

**Tone.js – czy potrzebny?** Nie. Cała aplikacja to oscylatory + automatyzacja głośności, a to natywne Web Audio API robi bezpośrednio (`OscillatorNode`, `GainNode`, `AudioParam`). Bez Tone.js: mniej abstrakcji, pełna kontrola nad planowaniem i – co ważne – **ten sam kod** działa w `OfflineAudioContext`, czyli eksport projektu do pliku WAV dostajemy prawie za darmo.

**Dokładność 3 miejsc po przecinku:** `AudioParam` jest typu float32. Błąd zaokrąglenia jest mniejszy niż 0,0005 Hz dla częstotliwości poniżej 16 384 Hz, więc np. 777,778 Hz jest odtwarzane dokładnie z zadaną rozdzielczością. W danych trzymamy częstotliwość jako **liczbę całkowitą w mHz** (777778), żeby nie gromadzić błędów float w zapisie i UI.

---

## 2. Stack technologiczny

**Frontend**
- React + TypeScript, budowany przez Vite
- Zustand (stan) + Immer (niemutowalne aktualizacje) + zundo (undo/redo)
- Zod – walidacja projektów importowanych z linków/plików (to niezaufane dane)
- Dexie – wygodna warstwa nad IndexedDB (zapis projektów na urządzeniu)
- vite-plugin-pwa – instalacja na telefonie, działanie offline
- Natywne Web Audio API – silnik audio
- Własne komponenty SVG – edytor obwiedni i oś czasu
- Tailwind CSS (opcjonalnie) – stylowanie

**Backend**
- Django + Django REST Framework
- Django Admin – wygodne zarządzanie biblioteką częstotliwości
- PostgreSQL (produkcja), SQLite (lokalnie)
- WhiteNoise – Django serwuje zbudowany frontend (jeden Web Service na Render)
- Gunicorn

Wersje: instaluj najnowsze stabilne (`npm create vite@latest`, `pip install django djangorestframework …`), a następnie przypnij je w `package-lock.json` i `requirements.txt`.

---

## 3. Model danych

```ts
// model/types.ts
export type Waveform = 'sine' | 'triangle' | 'square' | 'sawtooth';
export type Curve = 'linear' | 'hold';          // kształt odcinka dochodzącego do punktu

export interface EnvelopePoint {
  id: string;
  t: number;        // sekundy WZGLĘDEM początku segmentu, 0 ≤ t ≤ clip.duration
  v: number;        // głośność 0.0–1.0
  curve: Curve;
}

export interface Clip {                          // segment czasowy na ścieżce
  id: string;
  start: number;    // sekundy od początku kompozycji
  duration: number; // sekundy
  envelope: EnvelopePoint[]; // posortowane po t; pierwszy t=0, ostatni t=duration
}

export interface Track {
  id: string;
  name: string;
  frequencyMilliHz: number;     // 777778 = 777.778 Hz
  libraryRef?: string;          // id z biblioteki (informacyjnie)
  waveform: Waveform;
  volume: number;               // 0.0–1.0, mnożnik całej ścieżki
  muted: boolean;
  clips: Clip[];                // bez nakładania się w obrębie ścieżki
}

export interface Composition {
  schemaVersion: 1;             // do migracji starszych zapisów
  id: string;                   // crypto.randomUUID()
  title: string;
  createdAt: string;            // ISO 8601
  updatedAt: string;
  masterVolume: number;         // 0.0–1.0
  tracks: Track[];
}

export interface LibraryFrequency {
  id: string;
  name: string;
  frequencyMilliHz: number;
  category: string;
  description?: string;
  tags: string[];
}
```

Zasady:
- Projekt jest **samowystarczalny**: ścieżka kopiuje częstotliwość z biblioteki, więc udostępniony projekt działa nawet, gdy wpis w bibliotece zmieni się lub zniknie.
- Gotowe „diagramy uruchomieniowe” (fade-in, fade-out, trapez, pulsowanie) to funkcje generujące `EnvelopePoint[]` dla zadanej długości segmentu, nie osobny typ danych.
- Czas całej kompozycji liczony jest z danych (`max(clip.start + clip.duration)`), nie przechowywany.

---

## 4. Silnik audio

Silnik jest zwykłym modułem TS niezależnym od Reacta. Dostaje **migawkę** `Composition` i pozycję startu.

```
OscillatorNode ─► GainNode (obwiednia × volume ścieżki) ─┐
OscillatorNode ─► GainNode ───────────────────────────────┼─► master GainNode ─► DynamicsCompressor ─► destination
OscillatorNode ─► GainNode ───────────────────────────────┘
```

```ts
// audio/schedule.ts – ten sam kod dla AudioContext (odtwarzanie) i OfflineAudioContext (eksport WAV)
const FADE = 0.015;

export function scheduleComposition(
  ctx: BaseAudioContext, out: AudioNode, comp: Composition,
  from: number,          // pozycja w kompozycji [s], od której gramy
  t0: number,            // czas kontekstu, w którym pozycja `from` ma zabrzmieć
): OscillatorNode[] {
  const at = (x: number) => t0 + (x - from);    // czas kompozycji → czas kontekstu
  const oscs: OscillatorNode[] = [];

  for (const track of comp.tracks) {
    if (track.muted) continue;
    for (const clip of track.clips) {
      const clipEnd = clip.start + clip.duration;
      if (clipEnd <= from) continue;

      const pts = clip.envelope.map(p => ({ ...p, abs: clip.start + p.t, v: p.v * track.volume }));
      const begin = Math.max(from, clip.start);
      const v0 = valueAt(pts, begin);          // interpolacja obwiedni w chwili `begin`

      const osc = new OscillatorNode(ctx, { type: track.waveform, frequency: track.frequencyMilliHz / 1000 });
      const gain = new GainNode(ctx, { gain: 0 });
      osc.connect(gain).connect(out);

      const g = gain.gain;
      g.setValueAtTime(0, at(begin));                         // kotwica
      g.linearRampToValueAtTime(v0, at(begin) + FADE);        // bez trzasku przy seeku
      for (const p of pts) {
        if (p.abs <= begin + FADE) continue;
        if (p.curve === 'hold') g.setValueAtTime(p.v, at(p.abs));
        else g.linearRampToValueAtTime(p.v, at(p.abs));
      }
      osc.start(at(begin));
      osc.stop(at(clipEnd) + FADE);
      oscs.push(osc);
    }
  }
  return oscs;
}
```

Klasa `AudioEngine` (singleton):
- `play(comp, from)` – `await ctx.resume()`, zapamiętuje `t0 = ctx.currentTime + 0.05`, wywołuje `scheduleComposition`.
- `pause()` / `resume()` – `ctx.suspend()` / `ctx.resume()` (czas kontekstu staje w miejscu, harmonogram zostaje nienaruszony).
- `stop()` / `seek(pos)` – szybkie wyciszenie mastera (`cancelAndHoldAtTime` + rampa do 0), zatrzymanie i odłączenie węzłów, ewentualnie ponowny `play` od `pos`.
- `getPosition()` – `from + (ctx.currentTime − t0) − (ctx.outputLatency ?? 0)`; odczytywane w `requestAnimationFrame` przez komponent osi czasu.
- Edycja w trakcie odtwarzania → (z debounce ~150 ms) `seek(getPosition())` z nową migawką.
- `renderToWav(comp)` – `OfflineAudioContext` + `scheduleComposition` + koder WAV (16-bit PCM). Przydatne na telefonie: plik WAV odtwarzany przez `<audio>` + Media Session API gra przy zablokowanym ekranie, czego Web Audio na iOS/Androidzie nie gwarantuje. Uwaga na rozmiar: 1 h mono 44,1 kHz 16-bit ≈ 318 MB.

Bezpieczeństwo słuchu: domyślna głośność master ≤ 0,5, twardy limit w limiterze, ostrzeżenie przy wysokich częstotliwościach.

---

## 5. Zapis lokalny i udostępnianie

**Zapis na urządzeniu**
- Dexie/IndexedDB: tabela `projects` (`id`, `title`, `updatedAt`, `data`). `localStorage` odpada – mały limit i synchroniczne API.
- Autozapis z debounce po każdej zmianie w store.
- `navigator.storage.persist()` – prośba, by przeglądarka nie czyściła danych.
- PWA: instalacja na ekranie głównym telefonu, działanie offline (w tym biblioteka częstotliwości w cache).

**Udostępnianie (od najprostszego)**
1. **Link z projektem w hashu URL** – JSON → kompresja (`CompressionStream('deflate-raw')`) → base64url → `https://…/#p=…`. Nie wymaga serwera, działa zawsze; hash nie jest wysyłany do serwera.
2. **Plik `.heartz.json`** – eksport/import, na telefonie przez Web Share API (`navigator.share({ files })`).
3. **Krótki link** `…/s/Ab3xK9` – projekt zapisany w bazie po stronie serwera (dla bardzo dużych projektów, gdy link z pkt 1 jest za długi).

Każdy import przechodzi przez walidację Zod i migrację `schemaVersion`.

---

## 6. Backend (Django)

Aplikacje Django:
- `frequencies` – model `LibraryFrequency` (+ kategorie), edycja w Django Admin.
- `shares` – model `SharedProject` (`slug`, `data: JSONField`, `created_at`), limit rozmiaru i prosty rate limit.

API (DRF):
```
GET  /api/frequencies/          lista biblioteki (cache HTTP)
POST /api/shares/               {data} → {slug}
GET  /api/shares/{slug}/        → {data}
```
Wszystkie pozostałe ścieżki → `index.html` frontendu (SPA), pliki statyczne przez WhiteNoise.

---

## 7. Struktura repozytorium

```
HeartzHeart/
├─ backend/
│  ├─ manage.py
│  ├─ config/              settings, urls, wsgi
│  ├─ frequencies/
│  └─ shares/
├─ frontend/
│  ├─ src/
│  │  ├─ audio/            engine.ts, schedule.ts, wav.ts
│  │  ├─ model/            types.ts, schema.ts (Zod), envelope.ts (valueAt, presety)
│  │  ├─ store/            projectStore.ts (Zustand + zundo)
│  │  ├─ db/               dexie.ts
│  │  ├─ share/            codec.ts
│  │  └─ components/       Library, TrackList, Timeline, EnvelopeEditor, TransportBar
│  └─ vite.config.ts       proxy /api → http://localhost:8000 w trybie dev
├─ Dockerfile              multi-stage: node (build frontendu) → python (Django + gunicorn)
└─ render.yaml
```

Lokalnie: `python manage.py runserver` (port 8000) + `npm run dev` (Vite z proxy `/api`).
Render: jeden Web Service z Dockerfile + Render Postgres (`DATABASE_URL`).

---

## 8. Kolejność prac (MVP)

1. Szkielet: Vite + React + TS, Django + DRF, proxy dev.
2. Model + Zod + `valueAt` + testy jednostkowe (Vitest).
3. Silnik audio: jedna ścieżka, jeden segment, play/pause/stop/seek, master + limiter.
4. Oś czasu z wieloma ścieżkami i segmentami + playhead.
5. Edytor obwiedni SVG (dodaj/przeciągnij/usuń punkt, presety, przyciąganie do siatki).
6. Biblioteka częstotliwości (API + Admin + wybór do ścieżki).
7. Dexie: lista projektów, autozapis; PWA.
8. Udostępnianie: link w hashu, plik JSON, krótkie linki.
9. Eksport WAV.
10. Dockerfile + render.yaml, deploy.

---

## 9. Aktualizacja (październik 2026): bufor łagodzący, precyzja 0,0000001 Hz, zakładka binauralna, fale mózgowe

**Silnik audio – nowy model (zastępuje opis z sekcji 4)**
- Każda ścieżka = **jeden ciągły generator** na czas odtwarzania (`audio/schedule.ts` → `createTrackVoice`, `trackGainPoints`) zamiast osobnego oscylatora na segment. Między segmentami gra w ciszy, a segmenty stykające się ze sobą łączą się bez przerwy.
- **Bufor łagodzący** (`store/settings.ts`, domyślnie 1 s, zakres 0,05–5 s): `engine.update(comp)` nie przebudowuje grafu, tylko płynnie doprowadza dźwięk do nowego stanu: częstotliwość po rampie w skali log, głośność/diagram/kanał po rampie liniowej (`holdAt` = `cancelAndHoldAtTime` z obejściem dla Firefoksa), a zmiana kształtu fali = przenikanie dwóch generatorów. Start/pauza/stop: wejście i wyjście maks. 1,5 s, przewijanie: przenikanie maks. 0,3 s (opcja w ustawieniach).
- **Ochrona wyjścia**: master → filtr DC (górnoprzepustowy 0,5 Hz) → `guard` (płynne wyciszenie i powrót po `devicechange` / przerwaniu kontekstu przez system) → limiter.
- **Generator 64-bit** (`audio/osc.ts`): AudioWorklet z fazą i częstotliwością typu double (PolyBLEP dla prostokąta/piły). Ładowany z Bloba; gdy niedostępny (brak HTTPS, stara przeglądarka) – fallback na `OscillatorNode` (float32). Zweryfikowane: błąd fazy po 1 h ≈ 1e-9 cyklu, brak skoku przy zmianie 200→210 Hz.
- Eksport WAV (`scheduleOffline`) korzysta z tego samego modelu obwiedni i generatora.

**Precyzja częstotliwości**
- Ustawienie 0–7 miejsc po przecinku (domyślnie 3). `frequencyMilliHz` może być ułamkiem mHz (kwantyzacja do 0,0001 mHz = 0,0000001 Hz, `quantizeMilliHz`); `formatHz(mHz, decimals)` / `parseHz(text, {decimals, min, max})` liczą na liczbach całkowitych.
- Uwaga: zegar karty dźwiękowej ma tolerancję rzędu ±20 ppm, więc bezwzględna częstotliwość nie jest dokładna do 7 miejsc; różnica L/P (dudnienie) jest zachowana dokładnie.

**Zakładka „Binauralne”** (`components/BinauralStudio.tsx`, `store/binauralStore.ts`, `components/Knob.tsx`)
- Tryb aplikacji `sequencer | binaural` (`uiStore.mode`): przełącznik w TopBar (desktop) i 4. pozycja w dolnej nawigacji (telefon).
- Pokrętła (skala log): nośna 20–1500 Hz, fala mózgowa (dudnienie) 0,001–1000 Hz, z kolorowymi łukami pasm; pola liczbowe z precyzją z ustawień; szybkie pasma Delta/Theta/Alfa/Beta/Gamma.
- Lista „Moje fale”: wiele fal może grać naraz (miks), każda z głośnością; zapis w localStorage; „Dodaj do projektu” tworzy parę ścieżek L/P. Konwencja: L = nośna, P = nośna + dudnienie.

**Fale mózgowe** (`data/brainwaves.ts`, `components/Brainwaves.tsx`)
- Trzy tabele od użytkownika: pasma (ISF … Ultra-Fast), zjawiska precyzyjne (~0.1 Hz … 600–900 Hz) oraz sprzężenia CFC.
- `matchFrequency(hz)` → podsekcja + zjawiska; `detectCouplings(freqs)` → CFC (każda częstotliwość może spełnić tylko jeden składnik).
- Jawna informacja: komunikat po dodaniu ścieżki / zmianie częstotliwości (dla pary L/P – dudnienie), ikona mózgu przy ścieżce, pasek „Fale mózgowe” nad osią czasu (dudnienia + CFC), pełny opis w zakładce binauralnej. Zawsze z zastrzeżeniem, że opisy dotyczą oscylacji EEG, a nie skutków słuchania.

**Ustawienia** (ikona zębatki): czas bufora, łagodny transport, liczba miejsc po przecinku, informowanie o pasmach; status generatora (64-bit / float32).

---

## 10. Hertz Hearth – Herce Serca (nowa nazwa), suwaki pasm, schemat mózgu

- **Nazwa**: w interfejsie, tytule strony, manifeście PWA, panelu admina i README aplikacja nazywa się „Hertz Hearth – Herce Serca”. Wewnętrzne klucze (`heartzheart:*` w localStorage, baza IndexedDB `heartzheart`, rozszerzenie `.heartz.json`, nazwa usługi w `render.yaml`) zostały celowo bez zmian – zmiana skasowałaby zapisane projekty użytkowników albo utworzyła nowy serwis na Render.
- **Suwaki zamiast pokręteł** w zakładce binauralnej: nośna = suwak w skali log (20–1500 Hz) + pole liczbowe.
- **`BandSlider`** (`components/BandSlider.tsx`): suwak fali mózgowej działa w obrębie jednego pasma z tabeli (`BRAIN_BANDS`, skala log w paśmie). Przytrzymanie kciuka na granicy przez 0,7 s (`HOLD_MS`) przenosi skalę do sąsiedniego pasma z animacją 450 ms; kciuk zostaje na częstotliwości granicznej, a dalszy ruch jest liczony względnie (granica „uzbraja się” ponownie po ruchu o 10 px – trzymanie bez ruchu nie przeskakuje kolejnych pasm). W drugą stronę tak samo. Dodatkowo: strzałki ◂ ▸, klawiatura (PageUp/PageDown), pasek wszystkich pasm do kliknięcia. Wersja `compact` przy każdej fali na liście „Moje fale”. Zweryfikowane w przeglądarce (Playwright).
- **`BrainMap`** (`components/BrainMap.tsx`, `data/brainRegions.ts`): schematyczny widok mózgu z boku (przód–tył poziomo) z przełącznikiem obrotu (przód u góry). Płaty i pasy kory wypełnione kolorem pasma, struktury głębokie (wzgórze, hipokamp, ciało migdałowate, zwoje podstawy, ACC, DMN…) rysowane przerywaną linią. Każde pasmo, zjawisko i sprzężenie CFC w `data/brainwaves.ts` ma pole `regions`.

---

## 11. Strefy pasm, znaczniki zapisanych częstotliwości, tryb prosty, szybkie uruchamianie

- **Kolory pasm**: każde z 16 pasm w `BRAIN_BANDS` ma własny, odróżnialny kolor (od indygo dla ISF po srebrny dla Ultra-Fast). `bandRange()` / `bandLabel()` dają nazwę z zakresem, np. „Szybka Theta (Fm-Theta) · 6–8 Hz”.
- **`BandSlider` – strefy**: suwak = [strefa poprzedniego pasma 13%] [główny zakres] [strefa następnego pasma 13%], strefy w kolorach sąsiadów. Wejście kciukiem w strefę i przytrzymanie 0,7 s (wypełnienie strefy pokazuje postęp) przenosi skalę do sąsiada. Duża wartość częstotliwości (3xl/4xl) w kolorze pasma, pod nazwą „zakres X–Y Hz”.
- **Znaczniki** (`FrequencyMarker`): białe kreski na suwaku i kropki na pasku wszystkich pasm = częstotliwości fal mózgowych zapisanych gdzie indziej: inne fale z listy, dudnienia L/P bieżącego projektu i projektów zapisanych w IndexedDB (`useSavedMarkers` w `BinauralStudio.tsx`). Kliknięcie kreski ustawia tę częstotliwość.
- **Rysunek mózgu** jest zwijany (domyślnie zwinięty, pokazuje tylko nazwy obszarów); stan rozwinięcia zapamiętany w ustawieniach (`brainMapOpen`).
- **Tryb prosty** (`settings.simpleMode`, przełącznik w Ustawieniach i w nagłówku zakładki Binauralne): ukrywa opisy fal mózgowych, CFC, ikony mózgu przy ścieżkach, pasek nad osią czasu i komunikaty o pasmach. Panel „Szybkie uruchamianie” jest wtedy rozwinięty i na górze.
- **`QuickLaunch`** (`components/QuickLaunch.tsx`): bieżący projekt z play/pauza/stop; lista projektów zapisanych lokalnie z odtwarzaniem od początku jednym dotknięciem (bieżący projekt jest najpierw zapisywany), otwarciem w edytorze i zapisem na telefonie; „Zapisz fale jako projekt” (grające fale albo wybrana → pary L/P, zapis w IndexedDB bez zmiany bieżącego projektu); wczytanie pliku `.heartz.json`; przycisk instalacji PWA (`store/pwaInstall.ts`, `beforeinstallprompt`) lub instrukcja dla iPhone'a.
- **Zapis na telefonie** (`saveCompositionToDevice` w `share/codec.ts`): Web Share API z plikiem (systemowe „Zapisz w plikach / Udostępnij”), a gdy niedostępne – zwykłe pobranie pliku.

---

## 12. Warstwy fal binauralnych, chowanie rysunku

- **Warstwy w generatorze** (`binauralStore.stack`, `stackOf()`, `addLayer`, `removeLayer`, `playStack`, `stopStack`): generator pokazuje stos fal edytowanych razem. Przycisk „＋ Dodaj kolejną falę binauralną” tworzy nową warstwę: następne pasmo fal mózgowych (do ok. 100 Hz, potem poprzednie) i nośna przesunięta o +40 Hz (lub −40 Hz powyżej 1000 Hz). Każda warstwa (`LayerCard`) ma własny suwak nośnej, szybki wybór nośnej (100, 136,1, 200, 250, 300, 432, 528 Hz + nośne innych fal), suwak pasma, głośność i przycisk odtwarzania. „Odtwórz wszystkie / Zatrzymaj warstwy” steruje całym stosem; „Dodaj warstwy do projektu” tworzy pary L/P dla każdej warstwy. Usunięcie warstwy (✕) zostawia falę na liście „Moje fale”. Wybór fali z listy pokazuje ją jako jedyną warstwę (o ile nie należy już do stosu). Starsze zapisy bez `stack` działają (warstwą jest wybrana fala).
- **Rysunek mózgu**: w rozwiniętym widoku jest przycisk „Schowaj rysunek ✕”.

---

## 13. Delikatne wygaszanie i pasek „Teraz gra”

- **Wygaszanie** (`fadeOut` w `audio/osc.ts`): stop, pauza, wyłączenie fali binauralnej, zatrzymanie odsłuchu i usunięcie ścieżki w trakcie gry nie są już liniową rampą, tylko krzywą `setValueCurveAtTime`: miękki początek, potem spadek równomierny w decybelach do ok. −50 dB i łagodne domknięcie do zera. Czas ustawia `settings.stopFade` (domyślnie 2 s, zakres 0,2–8 s, suwak w Ustawieniach); `stopFadeTime()` zwraca go, gdy „łagodny transport” jest włączony. Zweryfikowane renderowaniem offline: brak skoków między próbkami (maks. ~2e-5).
- Silnik udostępnia stan dla UI: `fadingBinaural` (fale w trakcie wygaszania), `projectFading`, `previewInfo` (nazwa i częstotliwość odsłuchu z biblioteki).
- **`PlayingDock`** (`components/PlayingDock.tsx`), stały pasek na dole ekranu nad transportem/nawigacją: każde aktywne źródło dźwięku (fale binauralne, projekt w zakładce Binauralne, odsłuch z biblioteki) z jednym przyciskiem stop/wznów, nazwą, częstotliwością nośnej i dudnienia, pasmem z zakresem i pierwszym zdaniem opisu pasma z bazy fal mózgowych (w trybie prostym bez opisu). W trakcie wygaszania pozycja pokazuje „wygaszanie…” i można ją włączyć ponownie. Kliknięcie fali przechodzi do niej w zakładce Binauralne. Przy kilku źródłach – „Zatrzymaj wszystko” (z wygaszeniem).
- Komunikaty (`NoticeBar`) przeniesione na górę ekranu, żeby nie zasłaniały paska.

---

## 14. Responsywność (sprawdzone zrzutami 360×740 … 1920×1080, także telefon poziomo)

- **Wariant `short`** (`@custom-variant short (@media (max-height: 540px))` w `index.css`) dla telefonu w poziomie i niskich okien: dolna nawigacja znika, jej ikony trafiają do nagłówka (`CompactNav` w `TopBar.tsx`); pasek „Teraz gra” i transport stoją obok siebie w jednym kompaktowym wierszu; mniejsze odstępy, ukryty podpis logo, status zapisu i opis pasma w pasku; głośność główna jako przycisk z wysuwanym suwakiem.
- **Zakładka Binauralne na telefonie/tablecie pionowo**: zamiast siatki z `min-h-0` (panele nachodziły na siebie i wychodziły poza ekran) – zwykła kolumna przewijana w pionie; siatka 2-kolumnowa dopiero od `lg`. Krótszy tytuł panelu na wąskich ekranach.
- **Nagłówek na laptopie (1024 px)**: przełącznik Sekwencer/Binauralne i „Projekty” pokazują same ikony poniżej `xl`, więc tytuł projektu się mieści; poradnik ukryty na bardzo wąskich ekranach (< 380 px) i w trybie `short` (dostępny z szerszego widoku).
- **Desktop (`lg`)**: „Teraz gra” obok transportu (maks. 48% szerokości) zamiast osobnego wiersza; nagłówek ścieżki w osi czasu szerszy (400 px), gdy oś ma ≥ 760 px – nazwy ścieżek nie są ucinane.
- Testowe budowanie bez npm: `tailwindcss.compile()` (czysty JS) + bundler Bun + Playwright – przydatne, gdy rejestr npm jest niedostępny.
