"""Kanoniczna zawartość biblioteki częstotliwości.

Zmiany w tym pliku trafiają do bazy poleceniem `python manage.py sync_library`
(uruchamianym automatycznie przy każdym wdrożeniu). Wpisy edytowane ręcznie w panelu
admina z odznaczonym polem „zarządzany” nie są nadpisywane.
"""

SAFETY = (
    "## Bezpieczeństwo\n"
    "Nie słuchaj podczas prowadzenia pojazdu ani pracy wymagającej czujności. Osoby z padaczką, "
    "zaburzeniami rytmu serca lub chorobami psychicznymi powinny skonsultować się z lekarzem. "
    "Używaj umiarkowanej głośności. To nie jest metoda leczenia."
)

# ---------------------------------------------------------------- Solfeggio
SOLFEGGIO_INFO = (
    "## Czym jest\n"
    "Zestaw częstotliwości spopularyzowany w latach 70.–90. XX w. (J. Puleo, L. Horowitz), później rozszerzony "
    "do dziewięciu tonów. Nazwy UT–LA pochodzą z sylab średniowiecznego hymnu „Ut queant laxis”, ale same "
    "wartości w Hz nie mają związku z historycznym solfeżem – w średniowieczu nie istniał wzorzec wysokości dźwięku.\n\n"
    "## Deklarowane działanie\n{claim}\n\n"
    "## Stan badań\n"
    "Brak rzetelnych dowodów na specyficzne działanie tych częstotliwości; pojedyncze, małe badania nie pozwalają "
    "na wnioski. Spokojne, jednostajne tony mogą jednak sprzyjać relaksacji niezależnie od konkretnej wartości."
)

SOLFEGGIO = [
    ("solfeggio-174", "Solfeggio 174", "174.000", "Zwolennicy przypisują mu łagodzenie napięcia i bólu."),
    ("solfeggio-285", "Solfeggio 285", "285.000", "Zwolennicy przypisują mu wspieranie regeneracji."),
    ("solfeggio-396", "Solfeggio 396 (UT)", "396.000", "Zwolennicy łączą go z „uwalnianiem od lęku i poczucia winy”."),
    ("solfeggio-417", "Solfeggio 417 (RE)", "417.000", "Zwolennicy łączą go z „ułatwianiem zmian”."),
    ("solfeggio-528", "Solfeggio 528 (MI)", "528.000",
     "Najpopularniejszy z tonów, nazywany „częstotliwością miłości”. Twierdzenie o „naprawie DNA” nie ma podstaw naukowych."),
    ("solfeggio-639", "Solfeggio 639 (FA)", "639.000", "Zwolennicy łączą go z harmonią w relacjach."),
    ("solfeggio-741", "Solfeggio 741 (SOL)", "741.000", "Zwolennicy łączą go z „oczyszczaniem” i ekspresją."),
    ("solfeggio-852", "Solfeggio 852 (LA)", "852.000", "Zwolennicy łączą go z intuicją."),
    ("solfeggio-963", "Solfeggio 963", "963.000", "Zwolennicy łączą go z „połączeniem duchowym”."),
]

# ---------------------------------------------------------------- Kosmiczna oktawa
COUSTO_INFO = (
    "## Czym jest\n"
    "Hans Cousto („Kosmiczna oktawa”, 1978) przeliczył okresy ruchu ciał niebieskich na dźwięk: częstotliwość "
    "odpowiadającą okresowi podwaja się (przesuwa o oktawy) tak długo, aż znajdzie się w zakresie słuchu. {origin}\n\n"
    "## Zastosowanie\n"
    "Strojenie kamertonów, gongów i mis w muzykoterapii i medytacji. 136,10 Hz („OM”) to popularny dźwięk bazowy w jodze.\n\n"
    "## Stan badań\n"
    "Wyprowadzenie ma charakter matematyczno-symboliczny; brak badań potwierdzających szczególny wpływ tych tonów na organizm."
)

COUSTO = [
    ("cousto-sun", "Słońce", "126.220", "Wartość przypisana Słońcu w systemie Cousto."),
    ("cousto-earth-year", "Ziemia – rok (OM)", "136.100", "Odpowiada okresowi obiegu Ziemi wokół Słońca (rok)."),
    ("cousto-mercury", "Merkury", "141.270", "Odpowiada okresowi obiegu Merkurego."),
    ("cousto-mars", "Mars", "144.720", "Odpowiada okresowi obiegu Marsa."),
    ("cousto-saturn", "Saturn", "147.850", "Odpowiada okresowi obiegu Saturna."),
    ("cousto-jupiter", "Jowisz", "183.580", "Odpowiada okresowi obiegu Jowisza."),
    ("cousto-earth-day", "Ziemia – doba", "194.180", "Odpowiada długości doby słonecznej."),
    ("cousto-moon", "Księżyc synodyczny", "210.420", "Odpowiada miesiącowi synodycznemu (od nowiu do nowiu)."),
    ("cousto-venus", "Wenus", "221.230", "Odpowiada okresowi obiegu Wenus."),
]

# ---------------------------------------------------------------- Fale mózgowe (binauralne)
BINAURAL_INFO = (
    "## Jak to działa\n"
    "Dudnienia binauralne: do lewego ucha trafia ton {carrier} Hz, do prawego {right} Hz. Mózg odbiera różnicę "
    "{beat} Hz jako rytmiczne pulsowanie. Po dodaniu powstają dwie ścieżki – lewa (L) i prawa (P). "
    "Potrzebne są słuchawki stereo; na głośnikach efekt nie powstaje.\n\n"
    "## {band}\n{band_text}\n\n"
    "## Stan badań\n"
    "Rytmy mózgu (EEG) są dobrze opisane, ale to, czy dudnienia binauralne faktycznie je „dostrajają”, pozostaje "
    "niepewne – przeglądy badań pokazują wyniki niespójne. Metaanaliza z 2019 r. wskazała niewielki do umiarkowanego "
    "wpływ na lęk, pamięć, uwagę i odczuwanie bólu, przy dużym zróżnicowaniu badań.\n\n" + SAFETY
)

BRAINWAVES = [
    ("brain-delta", "Delta 2,5 Hz", "150.000", "2.500", "Pasmo delta (0,5–4 Hz)",
     "Dominuje w głębokim śnie (faza N3). U dorosłych w czasie czuwania praktycznie nie występuje. "
     "Sesje delta stosuje się zwykle przed snem."),
    ("brain-theta", "Theta 6 Hz", "200.000", "6.000", "Pasmo theta (4–8 Hz)",
     "Senność, lekki sen, głęboka medytacja. W hipokampie rytm theta wiąże się z pamięcią i nawigacją przestrzenną."),
    ("brain-schumann", "Rezonans Schumanna 7,83 Hz", "200.000", "7.830", "Rezonans Schumanna",
     "Rezonans elektromagnetyczny wnęki Ziemia–jonosfera (ok. 7,83 Hz). Twierdzenia o jego szczególnym, "
     "„uziemiającym” wpływie na człowieka nie są potwierdzone; jako dudnienie mieści się na granicy theta/alfa."),
    ("brain-alpha", "Alfa 10 Hz", "200.000", "10.000", "Pasmo alfa (8–13 Hz)",
     "Zrelaksowane czuwanie, najwyraźniejsze przy zamkniętych oczach; słabnie przy skupieniu wzroku i wysiłku umysłowym."),
    ("brain-beta", "Beta 15 Hz", "250.000", "15.000", "Pasmo beta (13–30 Hz)",
     "Aktywne myślenie, koncentracja i czujność. Nadmiar aktywności beta bywa kojarzony z napięciem."),
    ("brain-gamma", "Gamma 40 Hz", "300.000", "40.000", "Pasmo gamma (powyżej 30 Hz)",
     "Integracja informacji zmysłowych i uwaga. Stymulacja 40 Hz (światłem i dźwiękiem) jest badana eksperymentalnie "
     "w chorobie Alzheimera – wyniki u ludzi są wstępne. Dudnienie 40 Hz słychać raczej jako „chropowatość” niż pulsowanie."),
]

# ---------------------------------------------------------------- Strojenie i testy
TUNING = [
    ("tuning-c4-256", "C4 (strój naukowy)", "256.000", "Strojenie", "C4 przy stroju naukowym",
     "## Czym jest\nStrój naukowy (filozoficzny) przyjmuje C4 = 256 Hz = 2⁸ Hz, dzięki czemu wszystkie C są potęgami "
     "dwójki. Odpowiada to A4 ≈ 430,54 Hz."),
    ("tuning-c4-440", "C4 (A=440)", "261.626", "Strojenie", "C4 w stroju równomiernie temperowanym",
     "## Czym jest\nWysokość środkowego C przy standardowym stroju A4 = 440 Hz i stroju równomiernie temperowanym."),
    ("tuning-a432", "A4 = 432 Hz", "432.000", "Strojenie", "Alternatywny strój A4",
     "## Czym jest\nAlternatywny strój (tzw. „strój Verdiego”), niższy od standardu o ok. 32 centy (1/3 półtonu).\n\n"
     "## Deklarowane działanie\nZwolennicy przypisują mu „naturalność” i działanie uspokajające.\n\n"
     "## Stan badań\nNieliczne, małe badania pilotażowe nie dają podstaw do takich wniosków. Różnica brzmienia jest "
     "subtelna i dla większości słuchaczy trudna do wychwycenia bez porównania."),
    ("tuning-a440", "A4 = 440 Hz", "440.000", "Strojenie", "Standardowy strój A4 (ISO 16)",
     "## Czym jest\nMiędzynarodowy wzorzec wysokości dźwięku A4 (norma ISO 16), używany powszechnie w muzyce i do strojenia instrumentów."),
    ("test-100", "Ton testowy 100 Hz", "100.000", "Tony testowe", "Niski ton kontrolny",
     "## Zastosowanie\nSprawdzanie przenoszenia niskich tonów. Małe głośniki telefonów i laptopów mogą go odtwarzać bardzo cicho."),
    ("test-1k", "Ton testowy 1 kHz", "1000.000", "Tony testowe", "Ton odniesienia 1 kHz",
     "## Zastosowanie\nStandardowy ton odniesienia w akustyce i elektronice audio – do sprawdzania kanałów i poziomu głośności."),
]


def mhz(text: str) -> int:
    whole, _, frac = text.partition(".")
    return int(whole) * 1000 + int((frac + "000")[:3])


def _fmt(text: str) -> str:
    return text.replace(".", ",")


def build_library() -> list[dict]:
    items: list[dict] = []
    for key, name, hz, claim in SOLFEGGIO:
        items.append(dict(key=key, name=name, frequency_millihz=mhz(hz), category="Solfeggio",
                          description="Skala Solfeggio", info=SOLFEGGIO_INFO.format(claim=claim), tags=["solfeggio"]))
    for key, name, hz, origin in COUSTO:
        items.append(dict(key=key, name=name, frequency_millihz=mhz(hz), category="Kosmiczna oktawa",
                          description="Wg H. Cousto", info=COUSTO_INFO.format(origin=origin), tags=["cousto", "planety"]))
    for key, name, carrier, beat, band, band_text in BRAINWAVES:
        right = (mhz(carrier) + mhz(beat)) / 1000
        items.append(dict(
            key=key, name=name, frequency_millihz=mhz(carrier), category="Fale mózgowe (binauralne)",
            description=f"Nośna {_fmt(carrier)} Hz, dudnienie {_fmt(beat)} Hz · słuchawki",
            info=BINAURAL_INFO.format(carrier=_fmt(carrier), right=_fmt(f"{right:.3f}"), beat=_fmt(beat), band=band, band_text=band_text),
            tags=["binauralne", "fale mózgowe"], binaural_beat_millihz=mhz(beat),
        ))
    for key, name, hz, category, description, info in TUNING:
        items.append(dict(key=key, name=name, frequency_millihz=mhz(hz), category=category,
                          description=description, info=info, tags=[]))
    for order, item in enumerate(items):
        item.setdefault("binaural_beat_millihz", None)
        item["sort_order"] = order
    return items


LIBRARY = build_library()
