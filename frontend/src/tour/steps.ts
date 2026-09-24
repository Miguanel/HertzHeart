import { engine } from '../audio/engine'
import { DEFAULT_PRESET_OPTIONS } from '../model/envelope'
import { findClip, useProjectStore } from '../store/projectStore'
import { togglePlay } from '../store/session'
import type { LibraryTab, MobileView, SheetId } from '../store/uiStore'

export interface TourStep {
  id: string
  /** Selektory elementu do podświetlenia; pierwszy widoczny wygrywa. Brak = okno na środku. */
  target?: string[]
  title: string
  text: string
  /** Stan interfejsu ustawiany przed pokazaniem kroku. */
  ui: { view: MobileView; sheet?: SheetId; libraryTab?: LibraryTab }
  action?: { label: string; run: () => void }
}

const t = (id: string) => `[data-tour="${id}"]`

const demoClipId = () => {
  const { composition, selectedClipId } = useProjectStore.getState()
  return findClip(composition, selectedClipId)?.clip.id ?? composition.tracks[0]?.clips[0]?.id ?? null
}

const previewFirstLibraryItem = () => {
  document.querySelector<HTMLButtonElement>(`${t('library-item')} button[aria-label="Odsłuchaj"], ${t('library-item')} button[aria-label="Zatrzymaj odsłuch"]`)?.click()
}

export function buildSteps(mobile: boolean): TourStep[] {
  const steps: (TourStep | false)[] = [
    {
      id: 'intro',
      title: 'Projekt demonstracyjny',
      text:
        'Otworzyliśmy przykładowy projekt z jedną niską częstotliwością: 136,100 Hz („OM”). Na nim pokażemy po kolei wszystkie funkcje.\n\nTwój poprzedni projekt jest bezpiecznie zapisany – na końcu zdecydujesz, czy do niego wrócić.',
      ui: { view: 'editor' },
    },
    {
      id: 'library',
      target: [t('library')],
      title: 'Biblioteka częstotliwości',
      text:
        'Gotowe częstotliwości pogrupowane w kategorie: Solfeggio, Kosmiczna oktawa, fale mózgowe, strojenie i tony testowe. Każda z nich może stać się ścieżką w Twoim projekcie.',
      ui: { view: 'library', libraryTab: 'frequencies' },
    },
    {
      id: 'custom',
      target: [t('custom-frequency')],
      title: 'Własna częstotliwość',
      text:
        'Wpisz dowolną wartość od 1 do 20 000 Hz z dokładnością do 0,001 Hz – z przecinkiem lub kropką, np. 777,778 – i kliknij „Dodaj”. Po wpisaniu wartości pojawi się też pole na nazwę.',
      ui: { view: 'library', libraryTab: 'frequencies' },
    },
    {
      id: 'filters',
      target: [t('library-filters')],
      title: 'Szukanie i kategorie',
      text: 'Wyszukuj po nazwie lub wartości w Hz. Przyciski kategorii zawężają listę – kliknij ponownie, aby pokazać wszystko.',
      ui: { view: 'library', libraryTab: 'frequencies' },
    },
    {
      id: 'item',
      target: [t('library-item')],
      title: 'Wpis w bibliotece',
      text:
        'Wartość w Hz, nazwa i krótki opis. Przyciski po prawej:\n• „i” – szczegóły: czym jest ta częstotliwość, co się jej przypisuje i co mówią badania,\n• słuchawki – kilkusekundowy odsłuch,\n• „+” – dodanie do projektu.\n\nWpisy z dopiskiem „L/P” to dudnienia binauralne: dodają od razu dwie ścieżki (lewą i prawą) i działają tylko na słuchawkach.',
      ui: { view: 'library', libraryTab: 'frequencies' },
      action: { label: 'Odsłuchaj', run: previewFirstLibraryItem },
    },
    {
      id: 'presets',
      target: [t('library')],
      title: 'Zestawy – gotowe projekty',
      text:
        'Druga zakładka biblioteki to gotowe projekty, np. sesje fal mózgowych czy sekwencja Solfeggio. Przycisk „i” opisuje zestaw, a przycisk folderu otwiera go jako nowy projekt, który możesz dowolnie zmieniać.',
      ui: { view: 'library', libraryTab: 'presets' },
    },
    {
      id: 'timeline',
      target: [t('timeline')],
      title: 'Oś czasu',
      text:
        'Każda częstotliwość to osobna ścieżka. Na ścieżce leżą segmenty – odcinki czasu, w których dźwięk gra. Linijka u góry pokazuje czas; kliknięcie jej przewija odtwarzanie. Zielona pionowa linia to bieżąca pozycja.',
      ui: { view: 'editor', libraryTab: 'frequencies' },
    },
    {
      id: 'track-top',
      target: [t('track-top')],
      title: 'Nagłówek ścieżki',
      text:
        'Nazwa (kliknij, aby zmienić), suwak głośności ścieżki, wyciszenie, „+” dodaje kolejny segment za ostatnim, kosz usuwa ścieżkę. Każdą zmianę możesz cofnąć.',
      ui: { view: 'editor' },
    },
    {
      id: 'track-bottom',
      target: [t('track-bottom')],
      title: 'Częstotliwość, fala i kanał',
      text:
        'Częstotliwość zmienisz w każdej chwili – zatwierdź Enterem.\n\nKształt fali: sinus brzmi najczyściej, trójkąt, prostokąt i piła – coraz ostrzej.\n\nL / L+P / P decyduje, czy ścieżka gra w lewym, obu czy prawym głośniku lub słuchawce. Tak buduje się dudnienia binauralne: np. 200 Hz po lewej i 206 Hz po prawej.',
      ui: { view: 'editor' },
    },
    {
      id: 'clip',
      target: [t('clip')],
      title: 'Segment',
      text: mobile
        ? 'Stuknij segment, aby go zaznaczyć – wtedy możesz go przeciągać, a uchwytem przy prawej krawędzi zmieniać długość. Podwójne stuknięcie w puste miejsce ścieżki tworzy nowy segment. Zaznaczony segment edytujesz niżej.'
        : 'Przeciągnij segment, aby przesunąć go w czasie; uchwyt przy prawej krawędzi zmienia długość. Dwuklik w pustym miejscu ścieżki tworzy nowy segment. Zaznaczony segment edytujesz w panelu poniżej.',
      ui: { view: 'editor' },
    },
    {
      id: 'zoom',
      target: [t('timeline-zoom')],
      title: 'Powiększenie osi czasu',
      text: 'Oddal, dopasuj cały projekt do ekranu albo przybliż – przydatne przy długich sesjach i precyzyjnym ustawianiu segmentów.',
      ui: { view: 'editor' },
    },
    {
      id: 'timing',
      target: [t('inspector-timing')],
      title: 'Czas segmentu i ustawienia szablonów',
      text:
        'Start i długość zaznaczonego segmentu w sekundach. „Poziom szablonu” i „Narastanie / wygaszanie” to ustawienia używane przez szablony poniżej.',
      ui: { view: 'editor' },
    },
    {
      id: 'presets-row',
      target: [t('inspector-presets')],
      title: 'Szablony diagramu',
      text:
        'Jednym kliknięciem nadasz segmentowi przebieg głośności: łagodne wejście i wyjście, narastanie, wygaszanie, stały poziom, falę albo pulsowanie.',
      ui: { view: 'editor' },
      action: {
        label: 'Wypróbuj „Fala”',
        run: () => {
          const id = demoClipId()
          if (id) useProjectStore.getState().applyPreset(id, 'swell', DEFAULT_PRESET_OPTIONS)
        },
      },
    },
    {
      id: 'envelope',
      target: [t('envelope')],
      title: 'Diagram głośności',
      text:
        'Wykres pokazuje, jak zmienia się głośność w trakcie segmentu (oś pozioma – czas, pionowa – poziom).\n• Przeciągaj punkty,\n• dwuklik / podwójne stuknięcie dodaje punkt, „+ Punkt” wstawia go w największej luce,\n• zaznaczony punkt usuniesz koszem lub klawiszem Delete,\n• „Liniowo / Skok” wybiera płynne przejście albo nagłą zmianę.',
      ui: { view: 'editor' },
    },
    {
      id: 'transport',
      target: [t('transport')],
      title: 'Odtwarzanie',
      text:
        'Odtwórz / pauza (także spacją), stop, pasek pozycji i głośność główna. Zmiany w projekcie słychać od razu, nawet w trakcie odtwarzania. Zacznij od cichej głośności.',
      ui: { view: 'editor' },
      action: { label: '▶ Posłuchaj demo', run: togglePlay },
    },
    {
      id: 'undo',
      target: [t('undo')],
      title: 'Cofnij i ponów',
      text: mobile
        ? 'Cofnij ostatnią zmianę jednym stuknięciem.'
        : 'Cofnij (Ctrl+Z) i ponów (Ctrl+Shift+Z) – bezpieczne eksperymentowanie z projektem.',
      ui: { view: 'editor' },
    },
    {
      id: 'title',
      target: [t('title')],
      title: 'Nazwa i automatyczny zapis',
      text:
        'Kliknij, aby zmienić nazwę projektu. Projekt zapisuje się sam w pamięci tej przeglądarki – potwierdza to napis pod nazwą. Działa także bez internetu, a aplikację możesz zainstalować na telefonie („Dodaj do ekranu głównego”).',
      ui: { view: 'editor' },
    },
    {
      id: 'share',
      target: [t('sheet-share')],
      title: 'Udostępnianie i eksport',
      text:
        '• Link z projektem – cały projekt zakodowany w adresie, działa bez serwera,\n• krótki link – wygodny do wysłania w komunikatorze,\n• plik projektu – kopia zapasowa lub przesłanie dalej,\n• eksport WAV – nagranie całości; na telefonie gra też przy zablokowanym ekranie.',
      ui: { view: 'editor', sheet: 'share' },
    },
    {
      id: 'projects',
      target: [t('sheet-projects')],
      title: 'Twoje projekty',
      text:
        'Lista zapisanych projektów: otwieranie, duplikowanie, pobieranie pliku i usuwanie. Tu też zaczniesz nowy projekt albo zaimportujesz plik otrzymany od kogoś innego.',
      ui: { view: 'editor', sheet: 'projects' },
    },
    mobile && {
      id: 'nav',
      target: [t('mobile-nav')],
      title: 'Nawigacja',
      text: 'Na telefonie przełączasz się tu między biblioteką, edytorem i projektami.',
      ui: { view: 'editor' },
    },
    {
      id: 'help',
      target: [t('help-button')],
      title: 'Poradnik zawsze pod ręką',
      text: 'Ten przycisk uruchamia poradnik ponownie w dowolnym momencie.',
      ui: { view: 'editor' },
    },
  ]
  return steps.filter((s): s is TourStep => Boolean(s))
}

/** Wywoływane przy każdej zmianie kroku: przerywa dźwięki z poprzedniego kroku. */
export function silence() {
  engine.stopPreview()
  if (engine.state === 'playing') engine.stop()
}
