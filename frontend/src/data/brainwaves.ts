/**
 * Baza wiedzy o pasmach fal mózgowych (EEG): kategorie zakresów, precyzyjne zjawiska i sprzężenia
 * międzypasmowe (CFC). Używana do informowania użytkownika, w jakie pasmo trafia wybrana częstotliwość
 * (ścieżka projektu albo dudnienie binauralne).
 *
 * Opisy mają charakter edukacyjny – dotyczą oscylacji rejestrowanych w mózgu, a nie skutków słuchania dźwięku.
 */

import type { BrainRegionId } from './brainRegions'

export type BrainTone = 'neutral' | 'warn'

export interface BrainBand {
  id: string
  name: string
  /** Zakres [Hz] – dolna granica włącznie, górna wyłącznie (poza ostatnim pasmem). */
  min: number
  max: number
  states: string
  area: string
  /** Obszary do zaznaczenia na schemacie mózgu. */
  regions: BrainRegionId[]
  notes: string
  color: string
  tone: BrainTone
}

export interface BrainPhenomenon {
  id: string
  /** Etykieta częstotliwości jak w tabeli źródłowej, np. „~0.1 Hz”. */
  label: string
  name: string
  min: number
  max: number
  area: string
  regions: BrainRegionId[]
  notes: string
  tone: BrainTone
}

export interface CouplingComponent {
  label: string
  min: number
  max: number
}

export interface BrainCoupling {
  id: string
  name: string
  subtitle: string
  components: CouplingComponent[]
  areas: string
  regions: BrainRegionId[]
  states: string
  mechanism: string
  tone: BrainTone
}

const C = {
  isf: '#6b7cff',
  slow: '#8a6bff',
  delta: '#a46bff',
  theta: '#5f8bff',
  alpha: '#3dffc5',
  beta: '#ffb547',
  gamma: '#ff5fa2',
  hfo: '#ff7a45',
}

export const BRAIN_BANDS: BrainBand[] = [
  {
    id: 'isf',
    name: 'ISF (Infraslow Fluctuations)',
    min: 0.001,
    max: 0.1,
    states:
      'Nieświadoma regulacja bazowa. Człowiek nie odczuwa tego jako „myśli”, lecz jako ogólny poziom energii, napięcia w ciele i rytmu dobowego.',
    area: 'Sieć Domyślna Mózgu (DMN), pień mózgu, podwzgórze.',
    regions: ['dmn', 'brainstem', 'hypothalamus'],
    notes:
      'Raporty laboratoryjne: ściśle korelują z sygnałem BOLD w rezonansie fMRI. Używane w specjalistycznym neurofeedbacku (ILF) do leczenia traumy (PTSD) i stabilizacji autonomicznego układu nerwowego.',
    color: '#6b6bff',
    tone: 'neutral',
  },
  {
    id: 'slow',
    name: 'Wolne Oscylacje (Slow)',
    min: 0.1,
    max: 0.5,
    states:
      'Stan głębokiej nieświadomości, całkowite „odcięcie” od świata zewnętrznego. Zjawisko „up/down states” (naprzemienne wyciszanie i pobudzanie sieci neuronowych).',
    area: 'Rozległe sieci kory nowej (Neocortex).',
    regions: ['cortex'],
    notes:
      'Zjawisko kluczowe dla tzw. homeostazy synaptycznej. Podczas tej częstotliwości mózg „usuwa” zbędne połączenia synaptyczne zebrane w ciągu dnia, robiąc miejsce na nową wiedzę.',
    color: '#9b6bff',
    tone: 'neutral',
  },
  {
    id: 'delta-slow',
    name: 'Wolna Delta',
    min: 0.5,
    max: 2,
    states: 'Głęboki sen wolnofalowy (N3). Brak marzeń sennych, odczucie głębokiego „resetu” po przebudzeniu.',
    area: 'Pętle wzgórzowo-korowe.',
    regions: ['thalamus', 'cortex'],
    notes:
      'Medycyna: główny wskaźnik prawidłowego wydzielania hormonu wzrostu (HGH). Jeśli fali tej brakuje, pacjenci zgłaszają przewlekłe zmęczenie (np. w fibromialgii).',
    color: '#c86bff',
    tone: 'neutral',
  },
  {
    id: 'delta-high',
    name: 'Wysoka Delta',
    min: 2,
    max: 4,
    states: 'Stan silnego otępienia, przymglenia świadomości, faza przejściowa między snem a czuwaniem.',
    area: 'Struktury podkorowe, hipokamp.',
    regions: ['basalGanglia', 'thalamus', 'hippocampus'],
    notes:
      'U dorosłych w stanie czuwania obecność tej fali to patologia (często marker guzów mózgu, demencji lub urazów TBI). U niemowląt to stan domyślny.',
    color: '#f06bdc',
    tone: 'warn',
  },
  {
    id: 'theta-slow',
    name: 'Wolna Theta',
    min: 4,
    max: 6,
    states:
      'Odmienne stany świadomości, hipnagogia (obrazy widoczne przed zaśnięciem), faza REM (żywe sny), głęboka medytacja.',
    area: 'Formacja hipokampa, ciało migdałowate.',
    regions: ['hippocampus', 'amygdala'],
    notes:
      'Wiąże się z konsolidacją pamięci epizodycznej. Nadmiar tej fali w stanie czuwania (tzw. „spowolnienie limbiczne”) występuje u osób z depresją i ciężkim ADHD.',
    color: '#4d8bff',
    tone: 'neutral',
  },
  {
    id: 'theta-fm',
    name: 'Szybka Theta (Fm-Theta)',
    min: 6,
    max: 8,
    states: 'Intuicyjne wglądy, stan „zawieszenia” przy rozwiązywaniu złożonych problemów mentalnych (np. trudne zadanie z matematyki).',
    area: 'Przednia kora obręczy (ACC), przyśrodkowa kora przedczołowa.',
    regions: ['acc', 'mpfc'],
    notes:
      'Badania: Fm-Theta (Frontal Midline Theta) rośnie proporcjonalnie do obciążenia pamięci roboczej. Jest dowodem na to, że mózg intensywnie przeszukuje zasoby wewnętrzne.',
    color: '#22c8ff',
    tone: 'neutral',
  },
  {
    id: 'alpha-slow',
    name: 'Wolna Alpha',
    min: 8,
    max: 10,
    states: 'Odprężenie, lekkość, odpływanie myślami, zmniejszenie napięcia mięśniowego. Zjawisko występuje po zamknięciu oczu.',
    area: 'Płaty potyliczne i ciemieniowe.',
    regions: ['occipital', 'parietal'],
    notes:
      '„Most” między podświadomością a świadomością. Trening tej fali często wykorzystuje się u pacjentów z wypaleniem zawodowym w celu redukcji stresu.',
    color: '#22e4c0',
    tone: 'neutral',
  },
  {
    id: 'alpha-mu',
    name: 'Wysoka Alpha (Rytm Mu)',
    min: 10,
    max: 12,
    states: 'Czuwanie w stanie fizycznego spoczynku. Odczucie dystansu, biernej obserwacji.',
    area: 'Kora czuciowo-ruchowa (bruzda środkowa).',
    regions: ['motor', 'sensory'],
    notes:
      'Rytm Mu tłumi się natychmiast, gdy wykonamy ruch lub… gdy widzimy, jak ktoś inny go wykonuje. Jest powiązany z działaniem neuronów lustrzanych (empatia, uczenie się przez naśladownictwo).',
    color: '#4dff88',
    tone: 'neutral',
  },
  {
    id: 'smr',
    name: 'SMR (Niska Beta)',
    min: 12,
    max: 15,
    states: 'Spokojna, rozluźniona uwaga (tzw. zrelaksowana czujność). Stan optymalny np. do czytania książki ze zrozumieniem.',
    area: 'Kora ruchowa i układ siatkowaty.',
    regions: ['motor', 'sensory', 'reticular'],
    notes:
      'Raporty medyczne: zwiększanie amplitudy SMR zapobiega napadom padaczkowym (podnosi próg drgawkowy) i radykalnie zmniejsza nadpobudliwość ruchową u dzieci z ADHD.',
    color: '#b4ff5a',
    tone: 'neutral',
  },
  {
    id: 'beta-mid',
    name: 'Średnia Beta',
    min: 15,
    max: 20,
    states: 'Aktywna uwaga, logiczne myślenie, przetwarzanie informacji z zewnątrz, ożywiona dyskusja.',
    area: 'Kora przedczołowa, płaty czołowe.',
    regions: ['prefrontal', 'frontal'],
    notes: 'Optymalne pasmo do pracy intelektualnej. Niedobór w płatach czołowych skutkuje prokrastynacją i „mgłą mózgową”.',
    color: '#f5e65a',
    tone: 'neutral',
  },
  {
    id: 'beta-high',
    name: 'Wysoka Beta',
    min: 20,
    max: 30,
    states: 'Niepokój, napięcie, ekscytacja, reakcja stresowa „walcz lub uciekaj”. Odczucie „pędzących myśli”.',
    area: 'Ciało migdałowate, rozsiana kora.',
    regions: ['amygdala', 'cortex'],
    notes:
      'Klinicznie: chroniczne utrzymywanie się tej fali to marker zaburzeń lękowych (nerwicy), bezsenności i natręctw (OCD). Mózg traci ogromne ilości glukozy.',
    color: '#ffb547',
    tone: 'warn',
  },
  {
    id: 'gamma-slow',
    name: 'Wolna Gamma',
    min: 30,
    max: 50,
    states:
      '„Efekt AHA!”, moment nagłego olśnienia, nagła klarowność. Poczucie absolutnej jedności postrzegania (obraz, dźwięk i dotyk zlewają się w jedno).',
    area: 'Rozległa sieć korowo-wzgórzowa (synchronizacja całego mózgu).',
    regions: ['cortex', 'thalamus'],
    notes:
      'Badania lab.: stymulacja światłem i dźwiękiem o częstotliwości 40 Hz pomaga usuwać blaszki amyloidowe w chorobie Alzheimera u myszy laboratoryjnych (aktywacja mikrogleju).',
    color: '#ff8a3d',
    tone: 'neutral',
  },
  {
    id: 'gamma-fast',
    name: 'Szybka Gamma',
    min: 50,
    max: 100,
    states:
      '„Stan Flow”, hiper-świadomość, przekraczanie barier własnego „ego”. Doświadczany przez mistrzów sztuk walki i zaawansowanych medytujących.',
    area: 'Kora przedczołowa współpracująca z układem limbicznym.',
    regions: ['prefrontal', 'amygdala', 'hippocampus'],
    notes:
      'Bardzo rzadko rejestrowana trwale u przeciętnego człowieka (pojawia się we fleszach). Wymaga niezwykle wysokiego zestrojenia metabolicznego mózgu.',
    color: '#ff5555',
    tone: 'neutral',
  },
  {
    id: 'ripples',
    name: 'Ripples (HFO)',
    min: 100,
    max: 250,
    states: 'Niewyczuwalne świadomie. Działają w tle podczas snu. Występują podczas nagłego odtwarzania wspomnień.',
    area: 'Hipokamp i kora śródwęchowa.',
    regions: ['hippocampus', 'temporal'],
    notes:
      'Neurologia kliniczna: „Ripples” to paczki ultrakrótkich impulsów, podczas których mózg w ułamku sekundy przegrywa wspomnienia z całego dnia z hipokampa do kory czołowej – na „twardy dysk” pamięci długotrwałej.',
    color: '#ff6bc8',
    tone: 'neutral',
  },
  {
    id: 'fast-ripples',
    name: 'Fast Ripples (HFO)',
    min: 250,
    max: 500,
    states: 'Patologiczne; pacjent może odczuwać aurę przedpadaczkową, dezorientację, dziwne smaki/zapachy.',
    area: 'Strefy epileptogenne (uszkodzone fragmenty tkanki mózgowej).',
    regions: ['hippocampus', 'temporal'],
    notes:
      'Zastosowanie medyczne: zapisywane wyłącznie z elektrod wszczepionych do mózgu (iEEG). Klinicyści używają tego pasma jako „radaru” do precyzyjnego lokalizowania i operacyjnego usuwania ognisk padaczkowych.',
    color: '#8fa0ff',
    tone: 'warn',
  },
  {
    id: 'ultra-fast',
    name: 'Ultra-Fast (Spikes)',
    min: 500,
    max: 1000,
    states: 'Wrażenia zmysłowe (ukłucie igły, nagły błysk) przekształcane na potencjały czynnościowe. Poziom pojedynczej komórki, a nie sieci.',
    area: 'Neurony czuciowe, aksony, synapsy.',
    regions: ['sensory'],
    notes:
      'Powyżej 500 Hz wchodzimy w zakres MUA (Multi-Unit Activity). To częstotliwość wystrzałów pojedynczych neuronów (iglice – action potentials). Nie jest to rytm całego mózgu, lecz „język maszynowy” pojedynczych komórek.',
    color: '#d0d8e8',
    tone: 'neutral',
  },
]

export const BRAIN_PHENOMENA: BrainPhenomenon[] = [
  {
    id: 'mayer',
    label: '~0.1 Hz',
    name: 'Fale Mayera (Mayer Waves) / Oscylacje BOLD',
    min: 0.08,
    max: 0.12,
    area: 'Pień mózgu, układ autonomiczny, DMN.',
    regions: ['brainstem', 'dmn'],
    notes:
      'Idealnie korelują z hemodynamiczną odpowiedzią mózgu w fMRI (przepływ krwi). Częstotliwość ta odzwierciedla naturalny rytm przełączania się mózgu między skupieniem na zewnątrz a introspekcją.',
    tone: 'neutral',
  },
  {
    id: 'so',
    label: '0.8 – 1.2 Hz',
    name: 'Rytm Powolny (Slow Oscillation – SO)',
    min: 0.8,
    max: 1.2,
    area: 'Sieci korowo-korowe (Neocortex).',
    regions: ['cortex'],
    notes:
      'Fundamentalny mechanizm snu NREM. W tym dokładnym przedziale mózg „dyryguje” procesem konsolidacji pamięci, synchronizując inne szybsze fale (wrzeciona i ripples).',
    tone: 'neutral',
  },
  {
    id: 'spike-wave',
    label: '3 Hz',
    name: 'Iglice-Fale (Spike-and-Wave Discharges)',
    min: 2.75,
    max: 3.25,
    area: 'Rozległa kora współpracująca ze wzgórzem.',
    regions: ['cortex', 'thalamus'],
    notes:
      'Patologia kliniczna: klasyczny i bardzo precyzyjny biomarker padaczki nieświadomości (petit mal). Pacjent na kilka sekund „zastyga” ze wzrokiem utkwionym w przestrzeń, nie tracąc napięcia mięśniowego.',
    tone: 'warn',
  },
  {
    id: 'theta-hippo',
    label: '7 Hz (6.5 – 8 Hz)',
    name: 'Ludzki pik Thety Hipokampalnej',
    min: 6.5,
    max: 8,
    area: 'Hipokamp (struktury limbiczne).',
    regions: ['hippocampus'],
    notes:
      'Choć u zwierząt (np. szczurów) theta podczas eksploracji wynosi równe 8 Hz, u ludzi pik Thety odpowiedzialnej za nawigację przestrzenną („GPS mózgu”) i pamięć epizodyczną występuje precyzyjnie w okolicach 7 Hz.',
    tone: 'neutral',
  },
  {
    id: 'iaf',
    label: '8.5 – 10.5 Hz',
    name: 'Indywidualna Częstotliwość Alfa (IAF – Individual Alpha Frequency)',
    min: 8.5,
    max: 10.5,
    area: 'Kora potyliczna.',
    regions: ['occipital'],
    notes:
      'Każdy człowiek ma swój unikalny „odcisk palca” częstotliwości Alfa (np. dokładnie 9.8 Hz). Badania dowodzą, że osoby z wyższym szczytem IAF (np. 10.5 Hz vs 8.5 Hz) cechują się szybszym tempem przetwarzania informacji poznawczych.',
    tone: 'neutral',
  },
  {
    id: 'spindles-slow',
    label: '11 – 13 Hz',
    name: 'Wolne Wrzeciona Snu (Slow Sleep Spindles)',
    min: 11,
    max: 13,
    area: 'Kora czołowa (generowane w jądrze siatkowatym wzgórza – TRN).',
    regions: ['frontal', 'thalamus'],
    notes:
      'Występują podczas 2. fazy snu NREM. Są kluczowe dla przetwarzania pamięci deklaratywnej. Zmniejszona gęstość wrzecion w tym paśmie to wczesny biomarker schizofrenii.',
    tone: 'neutral',
  },
  {
    id: 'spindles-fast',
    label: '13 – 15 Hz',
    name: 'Szybkie Wrzeciona Snu (Fast Sleep Spindles)',
    min: 13,
    max: 15,
    area: 'Kora ciemieniowa i czuciowo-ruchowa.',
    regions: ['parietal', 'sensory', 'motor'],
    notes:
      'Występują tuż po wolnych wrzecionach. Odpowiadają za konsolidację pamięci motorycznej (np. nauka jazdy na rowerze czy gry na instrumencie).',
    tone: 'neutral',
  },
  {
    id: 'smr-classic',
    label: '13 – 15 Hz (pik 14 Hz)',
    name: 'Klasyczny SMR (Rytm Czuciowo-Ruchowy)',
    min: 13,
    max: 15,
    area: 'Kora czuciowo-ruchowa (Rolandyczna).',
    regions: ['motor', 'sensory'],
    notes:
      'Odkryty przez M. Stermana u kotów. Jego precyzyjne wzmacnianie metodą neurofeedbacku (dokładnie wokół 14 Hz) jest jedną z nielicznych niefarmakologicznych metod podnoszenia progu drgawkowego u chorych na padaczkę lekooporną.',
    tone: 'neutral',
  },
  {
    id: 'pmbr',
    label: '~20 Hz (18 – 22 Hz)',
    name: 'Odbicie Beta (Post-Movement Beta Rebound – PMBR)',
    min: 18,
    max: 22,
    area: 'Pierwotna kora ruchowa (M1).',
    regions: ['motor'],
    notes:
      'Zjawisko występujące ułamek sekundy po zakończeniu ruchu (np. po zaciśnięciu dłoni). Kora ruchowa generuje potężny, wąski sygnał ~20 Hz, który działa jak „zatwierdzenie stanu”, resetując układ przed kolejnym ruchem.',
    tone: 'neutral',
  },
  {
    id: 'assr',
    label: '40 Hz',
    name: 'ASSR (Auditory Steady-State Response) / Problem Wiązania (Binding Problem)',
    min: 39,
    max: 41,
    area: 'Kora słuchowa, pętle wzgórzowo-korowe.',
    regions: ['auditory', 'thalamus'],
    notes:
      'Precyzyjna częstotliwość 40 Hz to moment, w którym mózg łączy cechy obiektu (np. okrągły kształt, czerwony kolor i zapach jabłka) w jedno pojęcie świadome. U osób ze spektrum autyzmu i schizofrenią faza odpowiedzi na 40 Hz jest często zaburzona.',
    tone: 'neutral',
  },
  {
    id: 'spw-r',
    label: '140 – 200 Hz',
    name: 'Sharp-Wave Ripples (SPW-Rs)',
    min: 140,
    max: 200,
    area: 'Obszar CA1 hipokampa.',
    regions: ['hippocampus'],
    notes:
      'Rejestrowane w głębi mózgu. Występują w spoczynku i we śnie. Podczas tego ułamka sekundy (ok. 100 ms) mózg odtwarza („replay”) ścieżkę neuronową aktywowaną za dnia, ale 10 do 20 razy szybciej. Przenosi w ten sposób wspomnienia do kory nowej.',
    tone: 'neutral',
  },
  {
    id: 'fr',
    label: '>250 Hz (250 – 500 Hz)',
    name: 'Fast Ripples',
    min: 250,
    max: 500,
    area: 'Tkanka epileptogenna.',
    regions: ['hippocampus', 'temporal'],
    notes:
      'Badania iEEG pokazują, że tkanka generująca te mikroskopijne oscylacje jest uszkodzona i stanowi ognisko zapalne dla ataków padaczki. Chirurdzy używają częstotliwości >250 Hz jako mapy wskazującej, który fragment mózgu usunąć.',
    tone: 'warn',
  },
  {
    id: 'sep-hfo',
    label: '600 – 900 Hz',
    name: 'HFO potencjałów wywołanych (Somatosensory Evoked Potentials)',
    min: 600,
    max: 900,
    area: 'Promienistość wzgórzowo-korowa.',
    regions: ['thalamus', 'sensory'],
    notes:
      'Rejestrowane powierzchniowo, ale nie są to już oscylacje sieci. To synchroniczny, salwowy „ogień” (wystrzały potencjałów czynnościowych) setek tysięcy pojedynczych aksonów podróżujących od wzgórza do kory po podaniu zewnętrznego bodźca prądowego na nerw dłoni.',
    tone: 'neutral',
  },
]

export const BRAIN_COUPLINGS: BrainCoupling[] = [
  {
    id: 'theta-gamma',
    name: 'Theta (4–8 Hz) + Gamma (40–100 Hz)',
    subtitle: 'Theta-Gamma Phase-Amplitude Coupling',
    components: [
      { label: 'Theta', min: 4, max: 8 },
      { label: 'Gamma', min: 40, max: 100 },
    ],
    areas: 'Oś pionowa: hipokamp (głęboko) ↔ kora przedczołowa (powierzchnia).',
    regions: ['hippocampus', 'prefrontal'],
    states: 'Pojemność pamięci roboczej, przyswajanie sekwencji (np. zapamiętywanie numeru telefonu w locie).',
    mechanism:
      'Fale Theta działają jak „taktowanie zegara”. Na każdym szczycie fali Theta (co ok. 150 ms) „podczepia się” paczka szybkich fal Gamma (każda paczka to jeden element do zapamiętania). Im dłuższa fala Theta, tym więcej paczek Gamma się zmieści (wyższe IQ / lepsza pamięć robocza).',
    tone: 'neutral',
  },
  {
    id: 'so-spindle-ripple',
    name: 'Wolna Oscylacja (~1 Hz) + Wrzeciona Snu (12–15 Hz) + Ripples (~200 Hz)',
    subtitle: 'Potrójne sprzężenie',
    components: [
      { label: 'Wolna oscylacja ~1 Hz', min: 0.5, max: 1.5 },
      { label: 'Wrzeciona 12–15 Hz', min: 12, max: 15 },
      { label: 'Ripples ~200 Hz', min: 140, max: 250 },
    ],
    areas: 'Trójkąt głęboko-korowy: kora nowa ↔ wzgórze ↔ hipokamp.',
    regions: ['cortex', 'thalamus', 'hippocampus'],
    states:
      'NREM. Całkowita nieświadomość, ale skrajna aktywność w tle. Moment przenoszenia wspomnień krótkotrwałych na pamięć długotrwałą.',
    mechanism:
      '„Zrzut danych na twardy dysk”. Wolna fala kory (1 Hz) daje sygnał wzgórzu do wygenerowania wrzeciona (15 Hz). Wrzeciono otwiera „okno” w hipokampie, który wystrzeliwuje błyskawiczne Ripples (200 Hz) z zapisanym wspomnieniem z całego dnia.',
    tone: 'neutral',
  },
  {
    id: 'theta-alpha',
    name: 'Theta Czołowa (6–8 Hz) + Alpha Ciemieniowa (8–12 Hz)',
    subtitle: 'Antykorelacja Przednio-Tylna',
    components: [
      { label: 'Theta czołowa', min: 6, max: 8 },
      { label: 'Alpha ciemieniowa', min: 8, max: 12 },
    ],
    areas: 'Płaszczyzna strzałkowa (przód-tył): kora przedczołowa (frontal) ↔ kora ciemieniowa (parietal).',
    regions: ['prefrontal', 'parietal'],
    states: 'Stan najwyższego obciążenia mentalnego (np. rozwiązywanie skomplikowanego równania, gra w szachy na czas).',
    mechanism:
      'Czołowa Theta wzrasta (aktywne myślenie, przeszukiwanie „bazy danych”), podczas gdy potyliczno-ciemieniowa Alpha również rośnie, aby zadziałać jak tłumik akustyczny – całkowicie odcina mózg od bodźców zmysłowych (nie słyszysz, co ktoś do ciebie mówi, gdy o czymś intensywnie myślisz).',
    tone: 'neutral',
  },
  {
    id: 'alpha-gamma',
    name: 'Alpha (10 Hz) spadek + Gamma (40+ Hz) wzrost',
    subtitle: 'Focal Gamma Synchronization',
    components: [
      { label: 'Alpha ~10 Hz', min: 8, max: 12 },
      { label: 'Gamma 40+ Hz', min: 40, max: 100 },
    ],
    areas: 'Płaszczyzna poprzeczna / ogniskowa: kora potyliczna (wzrokowa) i obszary czołowe.',
    regions: ['occipital', 'frontal'],
    states: 'Skupienie wzroku na jednym detalu w tłumie (np. szukanie twarzy znajomego na peronie).',
    mechanism:
      'Alpha działa w mózgu jak zasłona. Gdy kierujesz na coś uwagę, „zasłona” Alpha opada (desynchronizacja) w precyzyjnym punkcie kory wzrokowej, co pozwala na natychmiastowy „wybuch” fal Gamma w tym miejscu, przetwarzających detale obrazu. Reszta pola widzenia pozostaje stłumiona przez Alphę.',
    tone: 'neutral',
  },
  {
    id: 'beta-gamma',
    name: 'Beta (15–30 Hz) + Gamma (60–90 Hz)',
    subtitle: 'Przełączanie Motoryczne',
    components: [
      { label: 'Beta', min: 15, max: 30 },
      { label: 'Gamma 60–90 Hz', min: 60, max: 90 },
    ],
    areas: 'Układ pozapiramidowy: kora ruchowa (M1) ↔ zwoje podstawy.',
    regions: ['motor', 'basalGanglia'],
    states: 'Płynne poruszanie się, intencja ruchu przechodząca w akcję. Hamowanie niepotrzebnych tików.',
    mechanism:
      'Beta to fala hamująca ruch (utrzymuje mięśnie w statycznym pogotowiu). Aby wykonać ruch, pasmo Beta musi natychmiast zaniknąć, a zwoje podstawy odpalają falę Gamma ułatwiającą ruch. Brak zdolności do takiego płynnego przełączania między Betą a Gammą to główny mechanizm objawów choroby Parkinsona.',
    tone: 'neutral',
  },
  {
    id: 'delta-beta',
    name: 'Delta (1–4 Hz) + Beta (15–30 Hz)',
    subtitle: 'Coupling w Czuwaniu',
    components: [
      { label: 'Delta', min: 1, max: 4 },
      { label: 'Beta', min: 15, max: 30 },
    ],
    areas: 'Sieci rozproszone: ciało migdałowate ↔ kora przedczołowa.',
    regions: ['amygdala', 'prefrontal'],
    states:
      'Stan patologiczny / dyskomfort. Silne odczucie lęku, stresu pourazowego (PTSD) lub ataku paniki. Odczucie zmęczenia połączonego z natłokiem myśli (tzw. „wired and tired”).',
    mechanism:
      'Delta zwykle nie powinna występować w stanie czuwania, chyba że mózg łata mikrouszkodzenia lub jest w szoku traumatycznym. Sprzężenie wolnej fali Delta z szybką falą stresu Beta oznacza uwięzienie mózgu w pętli „zamrożenia” emocjonalnego, z którego stara się analitycznie uciec.',
    tone: 'warn',
  },
]

const inRange = (hz: number, min: number, max: number, inclusiveMax = false) => hz >= min && (inclusiveMax ? hz <= max : hz < max)

export interface BrainMatch {
  hz: number
  band: BrainBand | null
  phenomena: BrainPhenomenon[]
}

/** Do jakiego pasma (podsekcji) i jakich zjawisk należy częstotliwość [Hz]. */
export function matchFrequency(hz: number): BrainMatch {
  const last = BRAIN_BANDS.length - 1
  const band = BRAIN_BANDS.find((b, i) => inRange(hz, b.min, b.max, i === last)) ?? null
  const phenomena = BRAIN_PHENOMENA.filter((p) => inRange(hz, p.min, p.max, true))
  return { hz, band, phenomena }
}

export const hasBrainMatch = (m: BrainMatch) => m.band !== null || m.phenomena.length > 0

export interface CouplingMatch {
  coupling: BrainCoupling
  /** Dla każdego składnika – częstotliwości [Hz], które go spełniają. */
  hits: number[][]
}

/** Sprzężenia CFC, których wszystkie składniki występują wśród podanych częstotliwości [Hz]. */
export function detectCouplings(frequencies: number[]): CouplingMatch[] {
  const unique = [...new Set(frequencies.filter((f) => Number.isFinite(f) && f > 0))]
  const out: CouplingMatch[] = []
  for (const coupling of BRAIN_COUPLINGS) {
    const hits = coupling.components.map((c) => unique.filter((f) => inRange(f, c.min, c.max, true)))
    if (hits.every((h) => h.length > 0)) {
      // te same częstotliwości nie mogą obsłużyć dwóch składników naraz (np. 8 Hz jako theta i alpha)
      const used = new Set<number>()
      const ok = hits.every((h) => {
        const free = h.find((f) => !used.has(f))
        if (free === undefined) return false
        used.add(free)
        return true
      })
      if (ok) out.push({ coupling, hits })
    }
  }
  return out
}

const fmtNum = (hz: number) => String(Number(hz.toPrecision(4))).replace('.', ',')
/** „0,5–2 Hz” – zakres pasma do etykiet. */
export const bandRange = (b: Pick<BrainBand, 'min' | 'max'>) => `${fmtNum(b.min)}–${fmtNum(b.max)} Hz`
/** Nazwa pasma z zakresem, np. „Szybka Theta (Fm-Theta) · 6–8 Hz”. */
export const bandLabel = (b: BrainBand) => `${b.name} · ${bandRange(b)}`

/** Kolor pasma dla częstotliwości (do kropek i wskaźników). */
export const bandColor = (hz: number) => matchFrequency(hz).band?.color ?? '#7d8bab'

/** Uproszczone pasma do szybkiego wyboru dudnienia w zakładce binauralnej. */
export const QUICK_BANDS = [
  { id: 'delta', label: 'Delta', min: 0.5, max: 4, center: 2, color: C.delta },
  { id: 'theta', label: 'Theta', min: 4, max: 8, center: 6, color: C.theta },
  { id: 'alpha', label: 'Alfa', min: 8, max: 12, center: 10, color: C.alpha },
  { id: 'beta', label: 'Beta', min: 12, max: 30, center: 18, color: C.beta },
  { id: 'gamma', label: 'Gamma', min: 30, max: 100, center: 40, color: C.gamma },
] as const
